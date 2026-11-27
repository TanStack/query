import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { realpath, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { brotliCompressSync, constants, gzipSync } from 'node:zlib'
import { build, normalizePath } from 'vite'
import { adapterTreemap } from './analyze.ts'
import { measureMicrofrontends } from './microfrontends.ts'
import type { Rolldown } from 'vite'

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
type Adapter = typeof baseline | typeof pluggable
type Chunk = Rolldown.OutputChunk
type ModuleEntry = [id: string, module: Chunk['modules'][string]]
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
] as const
type Screen = (typeof workloads)[number]['screen']

const otherFrameworks = [
  /\/(?:packages|node_modules\/@tanstack)\/(?:angular|lit|preact|solid|svelte|vue)-query[^/]*\//,
  /\/node_modules\/(?:@angular|@lit|@vue|lit|lit-element|lit-html|preact|solid-js|svelte|vue)\//,
]

function buildDirectory(directory: string, packageName: string) {
  return (
    normalizePath(
      path.join(
        directory,
        'packages',
        path.posix.basename(packageName),
        'build',
      ),
    ) + '/'
  )
}

function runtimeOwners(directory: string, adapter: Adapter) {
  const core = adapter === baseline ? '@tanstack/query-core' : pluggableCore
  return [adapter, core].map((name) => buildDirectory(directory, name))
}

const pluggableOwners = runtimeOwners(checkout, pluggable)
const pluggableCoreDirectory = buildDirectory(checkout, pluggableCore)
function rendersFeature(id: string, feature: string) {
  return (
    id.endsWith(`/${feature}.js`) &&
    pluggableOwners.some((dir) => id.startsWith(dir))
  )
}

async function buildApp(
  packageName: Adapter,
  screen: Screen,
  belongsToAdapter?: (id: string) => boolean,
) {
  const outDir = path.join(
    root,
    'dist',
    screen,
    path.posix.basename(packageName),
  )
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
          packageName === pluggable ? 'pluggable-query.ts' : 'v6-query.ts',
        ),
        '#polling-option': path.join(
          root,
          'src',
          packageName === pluggable
            ? 'pluggable-interval.ts'
            : 'numeric-interval.ts',
        ),
        '#feature-options': path.join(
          root,
          'src',
          packageName === pluggable ? 'pluggable-options.ts' : 'v6-options.ts',
        ),
        '#screen': path.join(root, 'src', `${screen}.tsx`),
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
  assert('output' in result, 'Expected a single application build')
  const chunks = result.output.filter((output) => output.type === 'chunk')
  if (!chunks.some((chunk) => chunk.isEntry)) {
    throw new Error(`Missing browser entry chunk for ${packageName}`)
  }
  return chunks
}

function renderedModules(chunks: Array<Chunk>): Array<ModuleEntry> {
  return chunks.flatMap((chunk) =>
    Object.entries(chunk.modules).filter(
      ([, module]) => module.renderedLength > 0,
    ),
  )
}

// These operations can retain the named helpers they use internally.
const filterPredicates = [
  'isQueryActive',
  'isQueryStale',
  'getQueryObserverCount',
]
const filteredQueries = ['findCachedQueries', ...filterPredicates]
const refetchFilters = [
  ...filteredQueries,
  'isQueryDisabled',
  'isQueryStatic',
  'isQueryFetched',
]
const bulkOperations: Record<string, Array<string>> = {
  getQueriesData: filteredQueries,
  setQueriesData: ['setQueryData', ...filteredQueries],
  removeQueries: filteredQueries,
  resetQueries: ['resetCachedQuery', 'refetchQueries', ...refetchFilters],
  cancelQueries: filteredQueries,
  invalidateQueries: [
    'invalidateCachedQuery',
    'refetchQueries',
    ...refetchFilters,
  ],
  refetchQueries: refetchFilters,
}
const cacheHelpers: Record<string, Array<string>> = {
  findCachedQuery: filterPredicates,
  findCachedQueries: filterPredicates,
  clearQueryCache: [],
  isQueryActive: [],
  isQueryDisabled: ['isQueryActive', 'isQueryFetched', 'getQueryObserverCount'],
  isQueryStatic: ['getQueryObserverCount'],
  isQueryStale: ['getQueryObserverCount'],
  isQueryFetched: [],
  getQueryObserverCount: [],
  resetCachedQuery: [],
  invalidateCachedQuery: [],
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

function checkResultHelpers(
  modules: Array<ModuleEntry>,
  expected: Array<string>,
  context: string,
) {
  const included = modules
    .filter(([id]) => rendersFeature(id, 'queryResult'))
    .flatMap(([, module]) => module.renderedExports)
  assert.deepEqual(
    new Set(included),
    new Set(expected),
    `${context} retained unexpected query result helpers`,
  )
}

function checkOptimisticFetch(
  chunks: Array<Chunk>,
  expected: boolean,
  context: string,
) {
  // Inspect the emitted Query JS. This catches a race left inside an otherwise
  // essential class even if the dedicated Suspense module was tree-shaken.
  const included = chunks.some(({ code }) => /\bPromise\.race\s*\(/.test(code))
  assert.equal(
    included,
    expected,
    `${context} retained optimistic fetch race: ${included}`,
  )
}

function checkErrorReset(
  chunks: Array<Chunk>,
  expected: boolean,
  context: string,
) {
  // The generic reader must not keep a call to the public boundary reset API.
  const included = chunks.some(({ code }) => /\.clearReset\b/.test(code))
  assert.equal(
    included,
    expected,
    `${context} retained error-boundary reset access: ${included}`,
  )
}

function checkClientOperations(
  modules: Array<ModuleEntry>,
  workload: string,
  required?: string,
) {
  const tracked = new Set([
    ...Object.keys(bulkOperations),
    ...Object.keys(cacheHelpers),
    'infiniteQuery',
    'query',
    'setQueryData',
  ])
  const operations = new Set(
    modules
      .filter(([id]) => id.startsWith(pluggableCoreDirectory))
      .flatMap(([, module]) =>
        module.renderedExports.filter((name) => tracked.has(name)),
      ),
  )
  const allowed = [
    required,
    ...(required
      ? (bulkOperations[required] ?? cacheHelpers[required] ?? [])
      : []),
    ...(required === 'infiniteQuery' ? ['query'] : []),
  ]
  for (const name of operations) {
    assert(
      allowed.includes(name),
      `${workload} retained unused client operation ${name}`,
    )
  }
  if (required)
    assert(operations.has(required), `${workload} is missing ${required}`)
  if (required === 'invalidateQueries') {
    for (const used of [
      'invalidateCachedQuery',
      'getQueryObserverCount',
      'isQueryFetched',
    ])
      assert(operations.has(used), `${workload} is missing ${used}`)
  }
}

// Query modules may only come from the two packages built in the selected checkout.
function checkPairOwnership(
  modules: Array<ModuleEntry>,
  owners: Array<string>,
  context: string,
) {
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

function checkApp(chunks: Array<Chunk>, packageName: Adapter, screen: Screen) {
  if (packageName === pluggable) {
    const retained = renderedModules(chunks)
    const modules = retained.map(([id]) => id)
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
    const usesPages = screen === 'paginated' || screen === 'polling'
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
      QueryErrorResetBoundary: screen === 'polling',
      errorBoundaryUtils: screen === 'polling',
      fetchOptimistic: screen === 'polling',
      refetchInterval: screen === 'polling',
      infiniteQuery: false,
      queryOptions: true,
      infiniteQueryOptions: usesPages,
      infiniteQueryObserver: usesPages,
      infiniteQueryBehavior: usesPages,
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
    const pageFetcher = retained.some(
      ([id, module]) =>
        rendersFeature(id, 'infiniteQueryBehavior') &&
        module.renderedExports.includes('createInfiniteFetch'),
    )
    assert.equal(pageFetcher, usesPages, `${screen} infinite page fetcher`)
    const utilities = retained
      .filter(([id]) => rendersFeature(id, 'utils'))
      .flatMap(([, module]) => module.renderedExports)
    assert(
      utilities.includes('replaceEqualDeep') &&
        utilities.includes('replaceData'),
      `${screen} is missing default structural sharing`,
    )
    if (screen === 'query') {
      assert(
        !modules.some((id) => rendersFeature(id, 'throwOnError')),
        'Read-only list retained the optional throwOnError implementation',
      )
      assert(
        !utilities.includes('shouldThrowError'),
        'Read-only list retained the error boundary predicate',
      )
    }
    const selectedStatus = screen === 'polling' ? [] : ['isPending', 'isError']
    if (screen === 'paginated') selectedStatus.push('isFetching')
    checkResultHelpers(retained, selectedStatus, screen)
    checkClientOperations(
      retained,
      screen,
      screen === 'options' ? 'invalidateQueries' : undefined,
    )
  }
}

const reactPeer = /^react(?:-dom)?(?:\/|$)/

function retainedExports(modules: Array<ModuleEntry>) {
  return new Map(
    modules.map(([id, module]) => [id, new Set(module.renderedExports)]),
  )
}

// v6 keeps some features inside classes. The emitted chunk's source map names
// their retained implementations even when the production minifier renames them.
function workloadFeatures(
  packageName: Adapter,
  chunk: Chunk,
  modules: Array<ModuleEntry>,
) {
  const files = new Set(modules.map(([id]) => path.basename(id, '.js')))
  assert(chunk.map, 'Expected a source map for the attributed Query chunk')
  const symbols = new Set(chunk.map.names)
  const exports = new Set(
    modules.flatMap(([, module]) => module.renderedExports),
  )
  const stock = packageName === baseline
  const bulk = [
    'getQueriesData',
    'setQueriesData',
    'cancelQueries',
    'resetQueries',
  ]
  const features = {
    'Manual cached-query reset': stock
      ? /\breset\(\)\{[^}]*\bthis\.resetState\b/.test(chunk.code)
      : exports.has('resetCachedQuery'),
    'Cached-query invalidation and observer/fetch checks': stock
      ? ['invalidate', 'getObserversCount', 'isFetched'].every((method) =>
          chunk.code.includes(`${method}(){`),
        )
      : [
          'invalidateCachedQuery',
          'getQueryObserverCount',
          'isQueryFetched',
        ].some((operation) => exports.has(operation)),
    'Mutation cache': files.has('mutationCache'),
    'Serial mutation queues': stock
      ? symbols.has('scopeFor')
      : files.has('serialScope'),
    'Infinite page fetching': files.has('infiniteQueryBehavior'),
    'Interval polling': stock
      ? symbols.has('#updateRefetchInterval')
      : files.has('refetchInterval'),
    'Result selection and placeholder data': stock
      ? symbols.has('selection') && symbols.has('#resolvePlaceholder')
      : files.has('select') || files.has('placeholderData'),
    'Optimistic observer fetch (`fetchOptimistic`)': stock
      ? chunk.code.includes('fetchOptimistic(')
      : files.has('fetchOptimistic'),
    'Query error reset handling': files.has('QueryErrorResetBoundary'),
    'Bulk cache reads, writes, cancellation and reset': stock
      ? bulk.every((method) => chunk.code.includes(`${method}(`))
      : bulk.some((operation) => exports.has(operation)),
  }
  return Object.entries(features)
    .filter(([, included]) => included)
    .map(([name]) => name)
}

async function measure(packageName: Adapter, screen: Screen) {
  const app = await buildApp(packageName, screen)
  checkApp(app, packageName, screen)

  // Only published package JS from the appropriate checkout may enter the
  // Query chunk. Keep the original app entrypoint so it drives tree-shaking.
  const source =
    packageName === baseline && baseCheckout ? baseCheckout : checkout
  const owners = runtimeOwners(source, packageName)
  const belongsToAdapter = (id: string) =>
    owners.some((dir) => id.startsWith(dir))
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
  const [queryChunk] = library
  assert(
    queryChunk && library.length === 1,
    `Expected one Query chunk in ${packageName} ${screen}`,
  )
  if (packageName === pluggable) {
    checkOptimisticFetch(library, screen === 'polling', screen)
    checkErrorReset(library, screen === 'polling', screen)
  }
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
    renderedModules(attributed.filter((chunk) => chunk !== queryChunk)).some(
      ([id]) => belongsToAdapter(id),
    ) ||
    [...queryChunk.imports, ...queryChunk.dynamicImports].some(
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
  const js = Buffer.from(queryChunk.code)
  return {
    name: packageName,
    library: {
      raw: js.length,
      gzip: gzipSync(js, { level: 9 }).length,
      brotli: brotliCompressSync(js, {
        params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
      }).length,
    },
    largestModules,
    features: workloadFeatures(packageName, queryChunk, actual),
  }
}

// A combined app cannot tell whether each projection pulls in its sibling,
// or whether rendering a boundary pulls in paused-mutation restoration.
async function checkPluggableExports() {
  const adapter = await import('@tanstack/react-query-pluggable')
  const { QueryClient, QueriesObserver, notifyManager } = adapter
  for (const alias of [
    'fetchQuery',
    'fetchInfiniteQuery',
    'suspense',
    'suspenseQuery',
    'useBaseQuery',
    'useInfiniteQuery',
    'useSuspenseQuery',
    'useSuspenseInfiniteQuery',
  ]) {
    assert(!Object.hasOwn(adapter, alias), `Unexpected retired export ${alias}`)
  }
  const client = new QueryClient()
  const key = ['public-export-probe']
  const initial = await adapter.query(client, {
    queryKey: key,
    queryFn: () => ({ titles: ['A'], page: 1 }),
  })
  const updated = adapter.setQueryData<typeof initial>(client, key, {
    titles: ['A'],
    page: 2,
  })
  assert(updated)
  assert.equal(updated.page, 2)
  assert.strictEqual(
    updated.titles,
    initial.titles,
    'Default structural sharing',
  )
  assert.deepEqual(
    await adapter.infiniteQuery(client, {
      queryKey: ['public-infinite-export-probe'],
      initialPageParam: 0,
      queryFn: ({ pageParam }) => pageParam,
      getNextPageParam: () => undefined,
    }),
    { pages: [0], pageParams: [0] },
  )
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
    [
      adapter.Query,
      [
        'isActive',
        'isDisabled',
        'isStatic',
        'isStale',
        'reset',
        'invalidate',
        'getObserversCount',
        'isFetched',
      ],
    ],
  ] as const) {
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
    throwOnError: [
      'queryOptions',
      'queryObserver',
      'throwOnError',
      'QueryErrorResetBoundary',
      'errorBoundaryUtils',
    ],
    suspenseQueryOptions: [
      'suspenseQueryOptions',
      'queryObserver',
      'suspense',
      'QueryErrorResetBoundary',
      'errorBoundaryUtils',
      'fetchOptimistic',
    ],
    suspenseInfiniteQueryOptions: [
      'suspenseInfiniteQueryOptions',
      'infiniteQueryObserver',
      'queryObserver',
      'infiniteQueryBehavior',
      'suspense',
      'QueryErrorResetBoundary',
      'errorBoundaryUtils',
      'fetchOptimistic',
    ],
    HydrationBoundary: ['infiniteQueryBehavior'],
  }
  const coreExports = {
    ...Object.fromEntries(resultHelpers.map((name) => [name, ['queryResult']])),
    fetchOptimistic: ['fetchOptimistic'],
    infiniteQuery: ['infiniteQuery', 'infiniteQueryBehavior'],
    QueryClient: [],
    query: [],
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
    isQueryFetched: ['queryPredicates'],
    getQueryObserverCount: ['queryPredicates'],
    resetCachedQuery: [],
    invalidateCachedQuery: [],
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
  const expected: Record<string, Array<string>> = {
    ...reactExports,
    ...coreExports,
  }
  const features = new Set(Object.values(expected).flat())
  const entry = path.join(root, 'public-export-probe.ts')
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
            return undefined
          },
          load(id) {
            if (id !== entry) return
            if (name === 'throwOnError') {
              return `
                import { queryOptions, throwOnError, useQuery } from '${source}'
                export function useThrowingQuery() {
                  return useQuery(queryOptions({ queryKey: ['boundary-probe'], queryFn: () => 1, throwOnError: [throwOnError, true] }))
                }
              `
            }
            return `export { ${name} } from '${source}'`
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
    assert(Array.isArray(results), 'Expected an ESM library build')
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
      // Suspense can share the error policy used by the explicit option helper.
      if (feature === 'throwOnError' && required.includes('suspense')) continue
      const included = modules.some(([id]) => rendersFeature(id, feature))
      if (included !== required.includes(feature)) {
        throw new Error(
          `Importing ${name} unexpectedly ${included ? 'included' : 'excluded'} ${feature}`,
        )
      }
    }
    if (resultHelpers.includes(name)) checkResultHelpers(modules, [name], name)
    if (!coreOnly)
      checkErrorReset(
        chunks,
        required.includes('QueryErrorResetBoundary'),
        name,
      )
    if (!coreOnly || name === 'fetchOptimistic')
      checkOptimisticFetch(chunks, required.includes('fetchOptimistic'), name)
    if (
      ['QueryClient', 'query', 'infiniteQuery', 'setQueryData'].includes(
        name,
      ) ||
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
function formatChange(bytes: number, baselineBytes: number) {
  const difference = bytes - baselineBytes
  const sign = difference > 0 ? '+' : ''
  const percent = ((100 * difference) / baselineBytes).toFixed(2)
  return `${sign}${integer.format(difference)} B (${sign}${percent}%)`
}

function formatSize(bytes: number, baselineBytes: number, isBaseline: boolean) {
  const size = `${integer.format(bytes)} B`
  if (isBaseline) return size
  return `${size}<br>${formatChange(bytes, baselineBytes)}`
}

function revision(directory: string) {
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
  const stock = await measure(baseline, screen)
  const experiment = await measure(pluggable, screen)
  results.push({ screen, title, rows: [stock, experiment] as const })
  const v6Gzip = stock.library.gzip
  const pluggableGzip = experiment.library.gzip
  lines.push(
    `| ${title} | ${integer.format(v6Gzip)} B | ${integer.format(pluggableGzip)} B | ${formatChange(pluggableGzip, v6Gzip)} |`,
  )
}
lines.push(
  '',
  '### What each workload leaves out',
  '',
  'These implementations are present in the v6 Query chunk and absent from the pluggable chunk for the same screen.',
  '',
  '| Workload | Code removed compared with v6 |',
  '| --- | --- |',
)
for (const {
  title,
  rows: [stock, experiment],
} of results) {
  const removed = stock.features.filter(
    (feature) => !experiment.features.includes(feature),
  )
  lines.push(
    `| ${title} | ${removed.join(' · ') || 'None of the tracked features'} |`,
  )
}
lines.push(
  '',
  'All four screens retain default structural sharing. Both bookmark screens retain mutation support. The selection screen retains invalidation and refetching. The polling screen retains Suspense, pagination and polling.',
  '',
  `Baseline adapter and core at \`${base}\` (${baseCheckout ? 'base checkout' : 'current checkout'}). Pluggable adapter, core and fixture at \`${head}\`.`,
)
lines.push(
  '',
  '<details>',
  '<summary>Query runtime sizes · minified JS, gzip and Brotli</summary>',
  '',
  'The app entry drives tree-shaking. Each isolated ESM chunk includes the React adapter and its matching core. React and React DOM are external. Sizes are bytes of the Query chunk measured directly, with gzip level 9 and Brotli quality 11.',
  '',
  '| Workload | Package | Minified JS | Gzip | Brotli |',
  '| --- | --- | ---: | ---: | ---: |',
)
for (const { title, rows } of results) {
  const baselineSizes = rows[0].library
  for (const row of rows) {
    const cells = (['raw', 'gzip', 'brotli'] as const).map((metric) =>
      formatSize(
        row.library[metric],
        baselineSizes[metric],
        row.name === baseline,
      ),
    )
    lines.push(`| ${title} | \`${row.name}\` | ${cells.join(' | ')} |`)
  }
}
const readOnly = results.find(({ screen }) => screen === 'query')?.rows[1]
assert(readOnly, 'Expected a read-only pluggable workload')
lines.push(
  '',
  `Largest modules in the read-only pluggable chunk, by rendered size before minification: ${readOnly.largestModules.map((name) => `\`${name}\``).join(', ')}.`,
  '',
  '</details>',
  '',
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
