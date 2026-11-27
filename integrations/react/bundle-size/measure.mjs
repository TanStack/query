import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { realpath, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { brotliCompressSync, constants, gzipSync } from 'node:zlib'
import { build, normalizePath } from 'vite'
import { adapterTreemap } from './analyze.mjs'

const root = import.meta.dirname
const checkout = path.resolve(root, '../../..')
const baseCheckout = process.env.QUERY_BASE_CHECKOUT
  ? await realpath(process.env.QUERY_BASE_CHECKOUT)
  : undefined
const basePackage =
  baseCheckout && path.join(baseCheckout, 'packages/react-query')
const baseline = '@tanstack/react-query'
const pluggable = '@tanstack/react-query-pluggable'
const packages = [baseline, pluggable]
const workloads = [
  { screen: 'query', title: 'Read-only list' },
  { screen: 'paginated', title: 'Paginated bookmarks' },
  {
    screen: 'options',
    title: 'Selection, serial bookmarks and invalidation',
  },
  {
    screen: 'polling',
    title: 'Polling',
  },
]

const otherFrameworks = [
  /\/(?:packages|node_modules\/@tanstack)\/(?:angular|lit|preact|solid|svelte|vue)-query[^/]*\//,
  /\/node_modules\/(?:@angular|@lit|@vue|lit|lit-element|lit-html|preact|solid-js|svelte|vue)\//,
]

function runtimeOwners(directory, packageName) {
  return [packageName.split('/')[1], 'query-core'].map(
    (name) =>
      normalizePath(path.join(directory, 'packages', name, 'build')) + '/',
  )
}

const pluggableOwners = runtimeOwners(checkout, pluggable)
function rendersFeature(id, feature) {
  return (
    id.endsWith(`/${feature}.js`) &&
    pluggableOwners.some((dir) => id.startsWith(dir))
  )
}

async function buildApp(packageName, screen, belongsToAdapter) {
  const outDir = path.join(root, 'dist', screen, packageName.split('/')[1])
  const result = await build({
    root,
    base: './',
    configFile: false,
    mode: 'production',
    logLevel: 'warn',
    plugins: [
      ...(belongsToAdapter ? [adapterTreemap(screen, packageName)] : []),
      {
        name: 'resolve-benchmark-adapter',
        enforce: 'pre',
        resolveId(id, importer) {
          if (id !== '#adapter') return
          // Resolve the public browser export using the requested checkout's package scope.
          const from =
            packageName === baseline && basePackage
              ? path.join(basePackage, 'package.json')
              : importer
          return this.resolve(packageName, from, { skipSelf: true })
        },
      },
    ],
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: {
        '#query-hooks': path.join(
          root,
          'src',
          packageName === pluggable ? 'pluggable-query.js' : 'v6-query.js',
        ),
        '#polling-option': path.join(
          root,
          'src',
          packageName === pluggable
            ? 'pluggable-interval.js'
            : 'numeric-interval.js',
        ),
        '#feature-options': path.join(
          root,
          'src',
          packageName === pluggable ? 'pluggable-options.js' : 'v6-options.js',
        ),
        '#screen': path.join(root, 'src', `${screen}.jsx`),
      },
    },
    build: {
      outDir,
      write: !belongsToAdapter,
      sourcemap: belongsToAdapter ? 'hidden' : false,
      reportCompressedSize: false,
      // All modules in these apps execute on the client.
      rolldownOptions: {
        checks: { moduleLevelDirective: false },
        ...(belongsToAdapter && {
          external: reactPeer,
          output: {
            codeSplitting: {
              groups: [
                {
                  name: 'query-runtime',
                  test: belongsToAdapter,
                  includeDependenciesRecursively: false,
                },
              ],
            },
          },
        }),
      },
    },
  })
  const chunks = result.output.filter((output) => output.type === 'chunk')
  if (!chunks.some((chunk) => chunk.isEntry)) {
    throw new Error(`Missing browser entry chunk for ${packageName}`)
  }
  return chunks
}

function renderedModules(chunks) {
  return chunks.flatMap((chunk) =>
    Object.entries(chunk.modules).filter(
      ([, module]) => module.renderedLength > 0,
    ),
  )
}

// Each bulk operation may retain the other public operations it calls.
const bulkOperations = {
  getQueriesData: [],
  setQueriesData: ['setQueryData'],
  removeQueries: [],
  resetQueries: ['refetchQueries'],
  cancelQueries: [],
  invalidateQueries: ['refetchQueries'],
  refetchQueries: [],
}

function checkClientOperations(modules, workload, required) {
  const operations = new Set(
    modules.flatMap(([id, module]) => {
      if (rendersFeature(id, 'cacheOperations')) return module.renderedExports
      if (rendersFeature(id, 'queryClient')) {
        return module.renderedExports.filter(
          (name) => name === 'fetchQuery' || name === 'setQueryData',
        )
      }
      return []
    }),
  )
  const allowed = [required, ...(bulkOperations[required] ?? [])]
  for (const name of operations) {
    assert(
      allowed.includes(name),
      `${workload} retained unused client operation ${name}`,
    )
  }
  if (required)
    assert(operations.has(required), `${workload} is missing ${required}`)
}

function checkApp(chunks, packageName, screen) {
  const modules = renderedModules(chunks).map(([id]) => id)
  if (
    packageName === baseline &&
    basePackage &&
    !modules.some((id) => id.startsWith(normalizePath(basePackage) + '/build/'))
  ) {
    throw new Error(
      `Missing built @tanstack/react-query from base checkout ${basePackage}`,
    )
  }
  if (packageName === pluggable) {
    const foreignRuntime = modules.find((id) =>
      otherFrameworks.some((pattern) => pattern.test(id)),
    )
    if (foreignRuntime) {
      throw new Error(
        `${packageName} bundled unexpected runtime code: ${foreignRuntime}`,
      )
    }
    if (
      chunks.some((chunk) =>
        chunk.moduleIds.some((id) => id.endsWith('/build/runtime/index.js')),
      )
    ) {
      throw new Error(
        `${packageName} included an internal runtime barrel in the app`,
      )
    }
    const usesMutations = screen === 'paginated' || screen === 'options'
    const features = {
      queryClient: true,
      queryCache: true,
      query: true,
      queryObserver: true,
      mutationCache: usesMutations,
      mutation: usesMutations,
      mutationObserver: usesMutations,
      suspenseQuery: screen === 'polling',
      suspense: screen === 'polling',
      refetchInterval: screen === 'polling',
      fetchInfiniteQuery: false,
      infiniteQuery: screen === 'paginated' || screen === 'polling',
      infiniteQueryObserver: screen === 'paginated' || screen === 'polling',
      infiniteQueryBehavior: screen === 'paginated' || screen === 'polling',
      select: screen === 'options',
      placeholderData: screen === 'options',
      serialScope: screen === 'options',
      cacheOperations: screen === 'options',
    }
    for (const [feature, expected] of Object.entries(features)) {
      const included = modules.some((id) => rendersFeature(id, feature))
      if (included !== expected) {
        throw new Error(
          `Unexpected ${feature} implementation in ${screen}: included=${included}`,
        )
      }
    }
    checkClientOperations(
      renderedModules(chunks),
      screen,
      screen === 'options' ? 'invalidateQueries' : undefined,
    )
  }
}

const reactPeer = /^react(?:-dom)?(?:\/|$)/

function retainedExports(modules) {
  return new Map(
    modules.map(([id, module]) => [id, new Set(module.renderedExports)]),
  )
}

function sizesOf(chunks) {
  const sizes = { raw: 0, gzip: 0, brotli: 0 }
  for (const chunk of chunks) {
    const js = Buffer.from(chunk.code)
    sizes.raw += js.length
    sizes.gzip += gzipSync(js, { level: 9 }).length
    sizes.brotli += brotliCompressSync(js, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
    }).length
  }
  return sizes
}

async function measure(packageName, screen) {
  const app = await buildApp(packageName, screen)
  checkApp(app, packageName, screen)

  // Only published package JS from the appropriate checkout may enter the
  // Query chunk. Keep the original app entrypoint so it drives tree-shaking.
  const source =
    packageName === baseline && baseCheckout ? baseCheckout : checkout
  const owners = runtimeOwners(source, packageName)
  const belongsToAdapter = (id) => owners.some((dir) => id.startsWith(dir))
  const attributed = await buildApp(packageName, screen, belongsToAdapter)
  const library = attributed.filter((chunk) => chunk.name === 'query-runtime')
  assert.equal(
    library.length,
    1,
    `Expected one Query chunk in ${packageName} ${screen}`,
  )
  const actual = renderedModules(library)
  const expected = renderedModules(app).filter(([id]) => belongsToAdapter(id))
  for (const dir of owners) {
    if (!expected.some(([id]) => id.startsWith(dir))) {
      throw new Error(`Missing Query runtime from ${dir} in ${screen}`)
    }
  }
  assert.deepEqual(
    retainedExports(actual),
    retainedExports(expected),
    `Query modules or exports differ from the production ${packageName} ${screen} app`,
  )
  if (
    renderedModules(attributed.filter((chunk) => chunk !== library[0])).some(
      ([id]) => belongsToAdapter(id),
    ) ||
    [...library[0].imports, ...library[0].dynamicImports].some(
      (id) => !reactPeer.test(id),
    )
  ) {
    throw new Error(
      `Query runtime spans additional chunks in ${packageName} ${screen}`,
    )
  }
  const largestModules = actual
    .sort(([, a], [, b]) => b.renderedLength - a.renderedLength)
    .slice(0, 5)
    .map(([id]) =>
      normalizePath(path.relative(path.join(source, 'packages'), id)),
    )
  return { library: sizesOf(library), app: sizesOf(app), largestModules }
}

// A combined app cannot tell whether each projection pulls in its sibling,
// or whether rendering a boundary pulls in paused-mutation restoration.
async function checkPluggableExports() {
  const {
    QueryClient,
    query,
    queryOptions,
    mutationOptions,
    infiniteQueryOptions,
    QueriesObserver,
    notifyManager,
  } = await import(pluggable)
  assert.deepEqual(
    Object.getOwnPropertyNames(QueryClient.prototype),
    ['constructor'],
    'QueryClient operations must be independently importable',
  )
  if (
    'getQueries' in QueriesObserver.prototype ||
    'setBatchNotifyFunction' in notifyManager
  ) {
    throw new Error(
      `${pluggable} exposed another adapter's observer or batch notification API`,
    )
  }
  if (
    typeof queryOptions !== 'function' ||
    queryOptions !== query ||
    queryOptions !== mutationOptions ||
    queryOptions !== infiniteQueryOptions
  ) {
    throw new Error(
      `${pluggable} must use the same identity function for query and the three option factories`,
    )
  }

  const expected = {
    query: [],
    suspenseQuery: ['suspenseQuery', 'suspense'],
    infiniteQuery: [
      'infiniteQuery',
      'infiniteQueryObserver',
      'infiniteQueryBehavior',
    ],
    fetchInfiniteQuery: ['fetchInfiniteQuery', 'infiniteQueryBehavior'],
    QueryClient: [],
    fetchQuery: [],
    setQueryData: [],
    getMutationCache: ['mutationCache'],
    select: ['select', 'projectResult'],
    placeholderData: ['placeholderData', 'projectResult'],
    serialScope: ['serialScope'],
    ...Object.fromEntries(
      Object.keys(bulkOperations).map((name) => [name, ['cacheOperations']]),
    ),
    HydrationBoundary: ['infiniteQueryBehavior'],
    dehydrate: [],
    hydrate: [
      'infiniteQueryBehavior',
      'mutation',
      'mutationCache',
      'serialScope',
    ],
  }
  const features = new Set(Object.values(expected).flat())
  const entry = path.join(root, 'public-export-probe.js')
  for (const [name, required] of Object.entries(expected)) {
    const results = await build({
      root,
      configFile: false,
      logLevel: 'error',
      plugins: [
        {
          name: 'import-one-public-export',
          resolveId(id) {
            if (id === entry) return id
          },
          load(id) {
            if (id === entry) return `export { ${name} } from '${pluggable}'`
          },
        },
      ],
      build: {
        write: false,
        lib: { entry, formats: ['es'], fileName: 'probe' },
        rolldownOptions: {
          external: ['react', 'react/jsx-runtime'],
          checks: { moduleLevelDirective: false },
        },
      },
    })
    const modules = results
      .flatMap(({ output }) =>
        output
          .filter((file) => file.type === 'chunk')
          .flatMap((chunk) => Object.entries(chunk.modules)),
      )
      .filter(([, module]) => module.renderedLength > 0)
    for (const feature of features) {
      const included = modules.some(([id]) => rendersFeature(id, feature))
      if (included !== required.includes(feature)) {
        throw new Error(
          `Importing ${name} unexpectedly ${included ? 'included' : 'excluded'} ${feature}`,
        )
      }
    }
    if (
      ['QueryClient', 'fetchQuery', 'setQueryData'].includes(name) ||
      Object.hasOwn(bulkOperations, name)
    ) {
      checkClientOperations(
        modules,
        name,
        name === 'QueryClient' ? undefined : name,
      )
    }
  }
}
await checkPluggableExports()

const integer = new Intl.NumberFormat('en-US')
function formatChange(bytes, baselineBytes) {
  const difference = bytes - baselineBytes
  const sign = difference > 0 ? '+' : ''
  const percent = ((100 * difference) / baselineBytes).toFixed(2)
  return `${sign}${integer.format(difference)} B (${sign}${percent}%)`
}

function formatSize(bytes, baselineBytes, isBaseline) {
  const size = `${integer.format(bytes)} B`
  if (isBaseline) return size
  return `${size}<br>${formatChange(bytes, baselineBytes)}`
}

function revision(directory) {
  return execFileSync('git', ['-C', directory, 'rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim()
}

const head = revision(root)
const base = baseCheckout ? revision(baseCheckout) : head
const lines = [
  '## React Query bundle size',
  '',
  '### Gzipped Query runtime',
  '',
  'Each row compares the Query JavaScript used by the same app. The change is measured against v6 for that row. Negative values mean fewer bytes.',
  '',
  '| Workload | React Query v6 | React Query Pluggable | Change vs v6 |',
  '| --- | ---: | ---: | ---: |',
]
const results = []
for (const { screen, title } of workloads) {
  const rows = []
  for (const name of packages) {
    rows.push({ name, ...(await measure(name, screen)) })
  }
  results.push({ screen, title, rows })
  const [v6Gzip, pluggableGzip] = rows.map((row) => row.library.gzip)
  lines.push(
    `| ${title} | ${integer.format(v6Gzip)} B | ${integer.format(pluggableGzip)} B | ${formatChange(pluggableGzip, v6Gzip)} |`,
  )
}
lines.push(
  '',
  'The pluggable read-only list retains the query client, cache, query and observer. Its production build drops the Suspense builder and policy, mutation cache and observer, polling scheduler, infinite-query behavior, selection, placeholder data, serial scopes and bulk cache operations. Both bookmark apps retain the mutation cache and observer.',
  '',
  `Baseline adapter and core at \`${base}\` (${baseCheckout ? 'base checkout' : 'current checkout'}). Pluggable adapter, core and fixture at \`${head}\`.`,
)
function addTable(key, heading, description) {
  lines.push(
    '',
    '<details>',
    `<summary>${heading}</summary>`,
    '',
    description,
    '',
    '| Workload | Package | Minified JS | Gzip | Brotli |',
    '| --- | --- | ---: | ---: | ---: |',
  )
  for (const { title, rows } of results) {
    const baselineSizes = rows[0][key]
    for (const row of rows) {
      const cells = Object.entries(row[key]).map(([metric, value]) =>
        formatSize(value, baselineSizes[metric], row.name === baseline),
      )
      lines.push(`| ${title} | \`${row.name}\` | ${cells.join(' | ')} |`)
    }
  }
  if (key === 'library') {
    const readOnly = results
      .find(({ screen }) => screen === 'query')
      .rows.find(({ name }) => name === pluggable)
    lines.push(
      '',
      `Largest modules in the read-only pluggable chunk, by rendered size before minification: ${readOnly.largestModules.map((name) => `\`${name}\``).join(', ')}.`,
    )
  }
  lines.push('', '</details>')
}
addTable(
  'library',
  'Query runtime sizes · minified JS, gzip and Brotli',
  'The app entry drives tree-shaking. This build externalizes React and React DOM and groups the adapter and its retained query-core modules into one ESM chunk for each package. Each cell measures the isolated chunk directly.',
)
addTable(
  'app',
  'Whole production app sizes · minified JS, gzip and Brotli',
  'Each build includes the app, React, React DOM and Query. This measures the JavaScript delivered to the browser.',
)
lines.push(
  '',
  'All sizes are bytes. Each JavaScript chunk is compressed separately with gzip level 9 and Brotli quality 11, then summed.',
  '',
)
const report = lines.join('\n')
await writeFile(path.join(root, 'dist/report.md'), report)
process.stdout.write(report)
