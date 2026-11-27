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
const pluggable = '@tanstack/react-query-no-core-pluggable'
const packages = [baseline, '@tanstack/react-query-no-core', pluggable]
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

const excludedFromStandaloneApps = [
  /\/(?:packages|node_modules\/@tanstack)\/(?:query-core|(?:angular|lit|preact|solid|svelte|vue)-query[^/]*)\//,
  /\/node_modules\/(?:@angular|@lit|@vue|lit|lit-element|lit-html|preact|solid-js|svelte|vue)\//,
]

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
  if (
    modules.some((id) =>
      /\/(?:packages|node_modules\/@tanstack)\/query-types\//.test(id),
    )
  ) {
    throw new Error(
      `${packageName} shipped runtime code from @tanstack/query-types`,
    )
  }
  if (packageName !== baseline) {
    const foreignRuntime = modules.find((id) =>
      excludedFromStandaloneApps.some((pattern) => pattern.test(id)),
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
  }
  if (packageName === pluggable) {
    const usesMutations = screen === 'paginated' || screen === 'options'
    const features = {
      queryClient: true,
      queryCache: true,
      query: true,
      queryObserver: true,
      mutationCache: usesMutations,
      mutation: usesMutations,
      mutationObserver: usesMutations,
      refetchInterval: screen === 'polling',
      infiniteQueryBehavior: screen === 'paginated' || screen === 'polling',
      select: screen === 'options',
      placeholderData: screen === 'options',
      serialScope: screen === 'options',
      cacheOperations: screen === 'options',
    }
    for (const [feature, expected] of Object.entries(features)) {
      const included = modules.some((id) =>
        id.endsWith(`/runtime/${feature}.js`),
      )
      if (included !== expected) {
        throw new Error(
          `Unexpected ${feature} implementation in ${screen}: included=${included}`,
        )
      }
    }
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
  const owners = (
    packageName === baseline
      ? ['react-query', 'query-core']
      : [packageName.split('/')[1]]
  ).map(
    (name) => normalizePath(path.join(source, 'packages', name, 'build')) + '/',
  )
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
    .map(([id]) => id.slice(owners.find((dir) => id.startsWith(dir)).length))
  return { library: sizesOf(library), app: sizesOf(app), largestModules }
}

// A combined app cannot tell whether each projection pulls in its sibling,
// or whether rendering a boundary pulls in paused-mutation restoration.
async function checkStandaloneExports() {
  const expected = {
    QueryClient: [],
    getMutationCache: ['mutationCache'],
    select: ['select', 'projectResult'],
    placeholderData: ['placeholderData', 'projectResult'],
    serialScope: ['serialScope'],
    invalidateQueries: ['cacheOperations'],
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
      const included = modules.some(([id]) =>
        id.endsWith(`/runtime/${feature}.js`),
      )
      if (included !== required.includes(feature)) {
        throw new Error(
          `Importing ${name} unexpectedly ${included ? 'included' : 'excluded'} ${feature}`,
        )
      }
    }
    if (name === 'invalidateQueries') {
      const [, operations] = modules.find(([id]) =>
        id.endsWith('/runtime/cacheOperations.js'),
      )
      if (
        operations.renderedExports.some(
          (item) => !['invalidateQueries', 'refetchQueries'].includes(item),
        )
      ) {
        throw new Error('Invalidation included unrelated bulk cache operations')
      }
    }
  }
}
await checkStandaloneExports()

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

// Inspect the published ESM entry points as a consumer would.
for (const name of packages.filter((name) => name !== baseline)) {
  const {
    queryOptions,
    mutationOptions,
    infiniteQueryOptions,
    QueriesObserver,
    notifyManager,
  } = await import(name)
  if (
    'getQueries' in QueriesObserver.prototype ||
    'setBatchNotifyFunction' in notifyManager
  ) {
    throw new Error(
      `${name} exposed another adapter's observer or batch notification API`,
    )
  }
  if (
    typeof queryOptions !== 'function' ||
    queryOptions !== mutationOptions ||
    queryOptions !== infiniteQueryOptions
  ) {
    throw new Error(
      `${name} must export one runtime function for all three option factories`,
    )
  }
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
  '| Workload | v6 | no-core change | no-core-pluggable change |',
  '| --- | ---: | ---: | ---: |',
]
const results = []
for (const { screen, title } of workloads) {
  const rows = []
  for (const name of packages) {
    rows.push({ name, ...(await measure(name, screen)) })
  }
  results.push({ screen, title, rows })
  const [v6Gzip, standaloneGzip, pluggableGzip] = rows.map(
    (row) => row.library.gzip,
  )
  lines.push(
    `| ${title} | ${integer.format(v6Gzip)} B | ${formatChange(standaloneGzip, v6Gzip)} | ${formatChange(pluggableGzip, v6Gzip)} |`,
  )
}
lines.push(
  '',
  'The pluggable read-only list retains the query client, cache, query and observer. Its production build drops the mutation cache and observer, polling scheduler, infinite-query behavior, selection, placeholder data, serial scopes and bulk cache operations. Both bookmark apps retain the mutation cache and observer.',
  '',
  `Baseline adapter at \`${base}\` (${baseCheckout ? 'base checkout' : 'current checkout'}). Alternatives and fixture at \`${head}\`.`,
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
  'The app entry drives tree-shaking. This build externalizes React and React DOM and groups retained Query modules into one ESM chunk. The baseline includes query-core. Each cell measures the isolated chunk directly.',
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
