import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { realpath, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { brotliCompressSync, constants, gzipSync } from 'node:zlib'
import { build, normalizePath } from 'vite'
import { adapterTreemap } from './analyze.mjs'
import { measureMicrofrontends } from './microfrontends.mjs'

const root = import.meta.dirname
const checkout = path.resolve(root, '../../..')
const baseCheckout = process.env.QUERY_BASE_CHECKOUT
  ? await realpath(process.env.QUERY_BASE_CHECKOUT)
  : undefined
const basePackage =
  baseCheckout && path.join(baseCheckout, 'packages/react-query')
const baseline = '@tanstack/react-query'
const pluggable = '@tanstack/react-query-pluggable'
const pluggableCore = '@tanstack/query-core-pluggable'
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

function buildDirectory(directory, packageName) {
  return (
    normalizePath(
      path.join(directory, 'packages', packageName.split('/')[1], 'build'),
    ) + '/'
  )
}

function runtimeOwners(directory, adapter) {
  const core = adapter === baseline ? '@tanstack/query-core' : pluggableCore
  return [adapter, core].map((name) => buildDirectory(directory, name))
}

const pluggableOwners = runtimeOwners(checkout, pluggable)
const pluggableCoreDirectory = buildDirectory(checkout, pluggableCore)
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

// These operations can retain the named helpers they use internally.
const filterPredicates = ['isQueryActive', 'isQueryStale']
const filteredQueries = ['findCachedQueries', ...filterPredicates]
const refetchFilters = [...filteredQueries, 'isQueryDisabled', 'isQueryStatic']
const bulkOperations = {
  getQueriesData: filteredQueries,
  setQueriesData: ['setQueryData', ...filteredQueries],
  removeQueries: filteredQueries,
  resetQueries: ['refetchQueries', ...refetchFilters],
  cancelQueries: filteredQueries,
  invalidateQueries: ['refetchQueries', ...refetchFilters],
  refetchQueries: refetchFilters,
}
const cacheHelpers = {
  findCachedQuery: filterPredicates,
  findCachedQueries: filterPredicates,
  clearQueryCache: [],
  isQueryActive: [],
  isQueryDisabled: ['isQueryActive'],
  isQueryStatic: [],
  isQueryStale: [],
}

const resultHelpers = [
  'isPending',
  'isSuccess',
  'isError',
  'isFetching',
  'isPaused',
  'isLoading',
  'isRefetching',
  'isLoadingError',
  'isRefetchError',
  'isFetched',
  'isFetchingNextPage',
  'isFetchingPreviousPage',
  'isFetchNextPageError',
  'isFetchPreviousPageError',
]

function checkResultHelpers(modules, expected, context) {
  const included = modules
    .filter(([id]) => rendersFeature(id, 'queryResult'))
    .flatMap(([, module]) => module.renderedExports)
  assert.deepEqual(
    new Set(included),
    new Set(expected),
    `${context} retained unexpected query result helpers`,
  )
}

function checkOptimisticFetch(chunks, expected, context) {
  // Inspect the emitted Query JS. This catches a race left inside an otherwise
  // essential class even if the dedicated Suspense module was tree-shaken.
  const included = chunks.some(({ code }) => /\bPromise\.race\s*\(/.test(code))
  assert.equal(
    included,
    expected,
    `${context} retained optimistic fetch race: ${included}`,
  )
}

function checkClientOperations(modules, workload, required) {
  const operations = new Set(
    modules.flatMap(([id, module]) => {
      if (
        ['cacheOperations', 'queryCacheOperations', 'queryPredicates'].some(
          (file) => rendersFeature(id, file),
        )
      )
        return module.renderedExports
      if (rendersFeature(id, 'queryClient')) {
        return module.renderedExports.filter(
          (name) => name === 'fetchQuery' || name === 'setQueryData',
        )
      }
      return []
    }),
  )
  const allowed = [
    required,
    ...(bulkOperations[required] ?? cacheHelpers[required] ?? []),
  ]
  for (const name of operations) {
    assert(
      allowed.includes(name),
      `${workload} retained unused client operation ${name}`,
    )
  }
  if (required)
    assert(operations.has(required), `${workload} is missing ${required}`)
}

// Query modules may only come from the two packages built in the selected checkout.
function checkPairOwnership(modules, owners, context) {
  const foreign = modules.find(
    ([id]) =>
      /\/(?:packages|node_modules\/@tanstack)\/(?:query-core|react-query)(?:-pluggable)?\//.test(
        id,
      ) && !owners.some((dir) => id.startsWith(dir)),
  )
  if (foreign)
    throw new Error(
      `${context} retained Query code outside the selected package pair: ${foreign[0]}`,
    )
}

function checkApp(chunks, packageName, screen) {
  const modules = renderedModules(chunks).map(([id]) => id)
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
        chunk.moduleIds.some(
          (id) =>
            id.endsWith('/build/runtime/index.js') ||
            rendersFeature(id, 'useBaseQuery'),
        ),
      )
    ) {
      throw new Error(
        `${packageName} included an internal runtime barrel or useBaseQuery in the app`,
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
      suspenseQueryOptions: screen === 'polling',
      suspenseInfiniteQueryOptions: screen === 'polling',
      suspense: screen === 'polling',
      fetchOptimistic: screen === 'polling',
      refetchInterval: screen === 'polling',
      fetchInfiniteQuery: false,
      queryOptions: true,
      infiniteQueryOptions: screen === 'paginated' || screen === 'polling',
      infiniteQueryObserver: screen === 'paginated' || screen === 'polling',
      infiniteQueryBehavior: screen === 'paginated' || screen === 'polling',
      select: screen === 'options',
      placeholderData: screen === 'options',
      serialScope: screen === 'options',
      cacheOperations: screen === 'options',
      queryCacheOperations: screen === 'options',
      queryPredicates: screen === 'options',
    }
    for (const [feature, expected] of Object.entries(features)) {
      const included = modules.some((id) => rendersFeature(id, feature))
      if (included !== expected) {
        throw new Error(
          `Unexpected ${feature} implementation in ${screen}: included=${included}`,
        )
      }
    }
    const selectedStatus = screen === 'polling' ? [] : ['isPending', 'isError']
    if (screen === 'paginated') selectedStatus.push('isFetching')
    checkResultHelpers(renderedModules(chunks), selectedStatus, screen)
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
  checkPairOwnership(
    renderedModules(app),
    owners,
    `${packageName} ${screen} app`,
  )
  const attributed = await buildApp(packageName, screen, belongsToAdapter)
  checkPairOwnership(
    renderedModules(attributed),
    owners,
    `${packageName} ${screen} attribution`,
  )
  const library = attributed.filter((chunk) => chunk.name === 'query-runtime')
  assert.equal(
    library.length,
    1,
    `Expected one Query chunk in ${packageName} ${screen}`,
  )
  if (packageName === pluggable)
    checkOptimisticFetch(library, screen === 'polling', screen)
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
  const adapter = await import(pluggable)
  const { QueryClient, QueriesObserver, notifyManager } = adapter
  for (const alias of [
    'query',
    'infiniteQuery',
    'suspense',
    'suspenseQuery',
    'useBaseQuery',
    'useInfiniteQuery',
    'useSuspenseQuery',
    'useSuspenseInfiniteQuery',
  ]) {
    assert(
      !Object.hasOwn(adapter, alias),
      `Unexpected query mode export ${alias}`,
    )
  }
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
  for (const [type, members] of [
    [adapter.QueryObserver, ['fetchOptimistic']],
    [adapter.QueryCache, ['find', 'findAll', 'clear']],
    [adapter.Query, ['isActive', 'isDisabled', 'isStatic', 'isStale']],
  ]) {
    for (const member of members)
      assert(
        !(member in type.prototype),
        `${type.name}.${member} would ship to every consumer`,
      )
  }
  const reactExports = {
    useQuery: [],
    queryOptions: ['queryOptions', 'queryObserver'],
    infiniteQueryOptions: [
      'infiniteQueryOptions',
      'infiniteQueryObserver',
      'queryObserver',
      'infiniteQueryBehavior',
    ],
    mutationOptions: [],
    suspenseQueryOptions: [
      'suspenseQueryOptions',
      'queryObserver',
      'suspense',
      'fetchOptimistic',
    ],
    suspenseInfiniteQueryOptions: [
      'suspenseInfiniteQueryOptions',
      'infiniteQueryObserver',
      'queryObserver',
      'infiniteQueryBehavior',
      'suspense',
      'fetchOptimistic',
    ],
    HydrationBoundary: ['infiniteQueryBehavior'],
  }
  const coreExports = {
    ...Object.fromEntries(resultHelpers.map((name) => [name, ['queryResult']])),
    fetchOptimistic: ['fetchOptimistic'],
    fetchInfiniteQuery: ['fetchInfiniteQuery', 'infiniteQueryBehavior'],
    QueryClient: [],
    fetchQuery: [],
    setQueryData: [],
    getMutationCache: ['mutationCache'],
    select: ['select', 'projectResult'],
    placeholderData: ['placeholderData', 'projectResult'],
    serialScope: ['serialScope'],
    findCachedQuery: ['queryCacheOperations', 'queryPredicates'],
    findCachedQueries: ['queryCacheOperations', 'queryPredicates'],
    clearQueryCache: ['queryCacheOperations'],
    isQueryActive: ['queryPredicates'],
    isQueryDisabled: ['queryPredicates'],
    isQueryStatic: ['queryPredicates'],
    isQueryStale: ['queryPredicates'],
    ...Object.fromEntries(
      Object.keys(bulkOperations).map((name) => [
        name,
        ['cacheOperations', 'queryCacheOperations', 'queryPredicates'],
      ]),
    ),
    dehydrate: [],
    hydrate: [
      'infiniteQueryBehavior',
      'mutation',
      'mutationCache',
      'serialScope',
    ],
  }
  const expected = { ...reactExports, ...coreExports }
  const features = new Set(Object.values(expected).flat())
  const entry = path.join(root, 'public-export-probe.js')
  for (const [name, required] of Object.entries(expected)) {
    const coreOnly = Object.hasOwn(coreExports, name)
    const source = coreOnly ? pluggableCore : pluggable
    const results = await build({
      root,
      configFile: false,
      logLevel: 'error',
      plugins: [
        {
          name: 'import-one-public-export',
          resolveId(id) {
            if (id === entry) return id
            if (id === pluggableCore) {
              const importer = path.join(
                checkout,
                'packages/react-query-pluggable/package.json',
              )
              return this.resolve(id, importer, { skipSelf: true })
            }
          },
          load(id) {
            if (id === entry) return `export { ${name} } from '${source}'`
          },
        },
      ],
      build: {
        write: false,
        lib: { entry, formats: ['es'], fileName: 'probe' },
        rolldownOptions: {
          external: reactPeer,
          checks: { moduleLevelDirective: false },
        },
      },
    })
    const chunks = results.flatMap(({ output }) =>
      output.filter((file) => file.type === 'chunk'),
    )
    const modules = renderedModules(chunks)
    const owners = coreOnly ? [pluggableCoreDirectory] : pluggableOwners
    checkPairOwnership(modules, owners, `Importing ${name} from ${source}`)
    if (
      coreOnly &&
      !modules.some(([id]) => id.startsWith(pluggableCoreDirectory))
    ) {
      throw new Error(
        `Core export ${name} did not render any code from ${source}`,
      )
    }
    if (
      coreOnly &&
      chunks.some((chunk) =>
        [...chunk.imports, ...chunk.dynamicImports].some((id) =>
          reactPeer.test(id),
        ),
      )
    ) {
      throw new Error(`Core export ${name} imported React`)
    }
    for (const feature of features) {
      const included = modules.some(([id]) => rendersFeature(id, feature))
      if (included !== required.includes(feature)) {
        throw new Error(
          `Importing ${name} unexpectedly ${included ? 'included' : 'excluded'} ${feature}`,
        )
      }
    }
    if (resultHelpers.includes(name)) checkResultHelpers(modules, [name], name)
    if (!coreOnly || name === 'fetchOptimistic')
      checkOptimisticFetch(chunks, required.includes('fetchOptimistic'), name)
    if (
      ['QueryClient', 'fetchQuery', 'setQueryData'].includes(name) ||
      Object.hasOwn(bulkOperations, name) ||
      Object.hasOwn(cacheHelpers, name)
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
  'The pluggable read-only list retains the query client, query cache, observer and two status helpers (`isPending` and `isError`). Its Query chunk excludes optimistic Suspense fetching, mutations, infinite queries, polling, selection, placeholder data, serial scopes, cache searches and bulk operations. Both bookmark apps retain mutation support. The polling screen retains the Suspense fetch path and uses no status helpers.',
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
  'The app entry drives tree-shaking. Each isolated ESM chunk includes the React adapter and its matching core: `react-query` with `query-core` or `react-query-pluggable` with `query-core-pluggable`. React and React DOM are external. Each cell measures the chunk directly.',
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
lines.push(
  await measureMicrofrontends({
    root,
    checkout,
    baseCheckout,
    baseline,
    pluggable,
    runtimeOwners,
    formatChange,
  }),
  '',
)
const report = lines.join('\n')
await writeFile(path.join(root, 'dist/report.md'), report)
process.stdout.write(report)
