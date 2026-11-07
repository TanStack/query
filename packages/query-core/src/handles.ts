import { environmentManager } from './environmentManager'
import { noop } from './utils'
import type { Query } from './query'
import type { QueryCache } from './queryCache'
import type { QueryClient } from './queryClient'
import type {
  InferDataFromTag,
  QueryKey,
  QueryObserverOptions,
  StaleTime,
} from './types'

// TYPES

/**
 * The options a query factory returns, usually from `queryOptions` or `infiniteQueryOptions`.
 */
type QueryFactoryOptions = Pick<
  QueryObserverOptions<any, any, any, any, any>,
  'queryKey' | 'queryKeyHashFn' | 'select'
>

/**
 * A function of zero or one argument that returns a query's options, usually with `queryOptions`
 * or `infiniteQueryOptions`. Its argument is the query's input, which handles carry.
 */
export type QueryHandleFactory = (input?: any) => QueryFactoryOptions

/**
 * The input of a query factory: its first parameter, or `undefined` if it takes none.
 */
type QueryHandleInput<TFactory extends QueryHandleFactory> =
  Parameters<TFactory> extends [] ? undefined : Parameters<TFactory>[0]

/**
 * The arguments the handle functions take after the factory: its input, if it takes one. A
 * factory's other parameters are left out, because a handle only carries the input, so
 * `experimental_fromHandle` couldn't pass them on.
 */
type QueryHandleArgs<TFactory extends QueryHandleFactory> =
  Parameters<TFactory> extends []
    ? []
    : Parameters<TFactory> extends [infer TInput, ...Array<any>]
      ? [input: TInput]
      : [input?: Parameters<TFactory>[0]]

type PlainTuple<
  TQueryKey extends ReadonlyArray<unknown>,
  TRequired extends Array<unknown> = [],
  TOptional extends Array<unknown> = [],
> = [...TRequired, ...TOptional]['length'] extends TQueryKey['length']
  ? [...TRequired, ...TOptional, unknown]['length'] extends TQueryKey['length']
    ? PlainTuple<
        TQueryKey,
        TRequired,
        [...TOptional, TQueryKey[[...TRequired, ...TOptional]['length']]]
      >
    : [...TRequired, ...Partial<TOptional>]
  : PlainTuple<TQueryKey, [...TRequired, TQueryKey[TRequired['length']]]>

type PlainQueryKey<TQueryKey extends ReadonlyArray<unknown>> =
  number extends TQueryKey['length']
    ? ReadonlyArray<TQueryKey[number]>
    : Readonly<PlainTuple<TQueryKey>>

/**
 * The `queryKey` of a factory's query as a plain readonly tuple, without the data tag that
 * `queryOptions` adds, so a handle stays a plain serializable object for routers that check
 * loader data.
 */
type QueryHandleKey<TFactory extends QueryHandleFactory> = PlainQueryKey<
  ReturnType<TFactory>['queryKey']
>

/**
 * A small serializable reference to a query, from `experimental_queryHandle`,
 * `experimental_queryHandleAsync` or `experimental_ensureQueryHandle`. Pass it to the component
 * that reads the query, and rebuild the query's options there with
 * `experimental_fromHandle(factory, handle)`. It carries no data: readers get the query's data
 * from the cache.
 *
 * Handles of two factories only mix when their keys have the same type. Declare keys with
 * `as const` to keep factories with the same input and data apart.
 */
export interface QueryHandle<
  TFactory extends QueryHandleFactory = QueryHandleFactory,
> {
  /**
   * The key of the query the handle refers to.
   */
  readonly queryKey: QueryHandleKey<TFactory>
  /**
   * The query's input: the argument its factory takes.
   */
  readonly input: QueryHandleInput<TFactory>
}

declare const definedQueryHandle: unique symbol

/**
 * A handle from `experimental_queryHandleAsync` or `experimental_ensureQueryHandle`: when it
 * resolved, the cache had the query's data. `experimental_getQueryHandleData` only takes these.
 * The brand exists only in types, so the handle is still a plain `{ queryKey, input }`.
 */
export interface DefinedQueryHandle<
  TFactory extends QueryHandleFactory = QueryHandleFactory,
> extends QueryHandle<TFactory> {
  /**
   * Marks a handle whose data was in the cache when it resolved. It exists only in types.
   */
  readonly [definedQueryHandle]: true
}

/**
 * The options `experimental_fromHandle` returns: the factory's options for the handle's input.
 */
export type FromHandleOptions<TFactory extends QueryHandleFactory> =
  ReturnType<TFactory>

type FactoryData<TOptions> = 'select' extends keyof TOptions
  ? TOptions extends { select?: (data: any) => infer TData }
    ? TData
    : never
  : TOptions extends { queryKey: QueryKey }
    ? InferDataFromTag<unknown, TOptions['queryKey']>
    : unknown

/**
 * The data a reader of a factory's query gets, the same as `useSuspenseQuery`'s `data`: what the
 * factory's `select` returns, or else the `queryFn`'s data, which is `InfiniteData` for an infinite
 * factory. Use it to type a prop that takes the data. Pass a factory type or a handle type.
 * @example
 * ```ts
 * function PostTitle(props: { post: experimental_InferQueryHandleData<typeof postQuery> }) {
 *   return <h1>{props.post.title}</h1>
 * }
 * ```
 */
export type InferQueryHandleData<
  T extends QueryHandleFactory | QueryHandle<any>,
> = T extends QueryHandleFactory
  ? FactoryData<ReturnType<T>>
  : T extends DefinedQueryHandle<infer TFactory>
    ? FactoryData<ReturnType<TFactory>>
    : T extends QueryHandle<infer TFactory>
      ? FactoryData<ReturnType<TFactory>>
      : never

/**
 * How a query started, for the devtools to show: the last handle function that started it, or an
 * observer, like `useQuery`, that started its first fetch. Core only records it in development.
 */
export interface QueryStartInfo {
  /**
   * The handle function that started the query, or `'observer'` when a component's query hook
   * started its first fetch, which makes it a request waterfall.
   */
  verb: 'queryHandle' | 'queryHandleAsync' | 'ensureQueryHandle' | 'observer'
  /**
   * Whether it ran on the server or in the browser.
   */
  environment: 'server' | 'client'
  /**
   * When it ran, in milliseconds since the epoch.
   */
  startedAt: number
  /**
   * Whether an observer, like `useQuery`, has read the query since.
   */
  observed: boolean
}

// START INFO

// A registered symbol, so devtools that bundle their own copy of this package still find it
const startInfoKey = Symbol.for('@tanstack/query-core/experimental_start')
const watchedCaches = new WeakSet<QueryCache>()

type QueryWithStartInfo = Query<any, any, any, any> & {
  [startInfoKey]?: QueryStartInfo
}

/**
 * Stores how a query started on the query itself, hidden from enumeration.
 * @param query - The query that started.
 * @param info - How it started.
 */
function setStartInfo(
  query: Query<any, any, any, any>,
  info: QueryStartInfo,
): void {
  Object.defineProperty(query, startInfoKey, {
    value: info,
    configurable: true,
    enumerable: false,
    writable: true,
  })
}

/**
 * Marks recorded queries as read when an observer subscribes to them.
 * @param queryCache - The cache to watch, once.
 */
function watchObservers(queryCache: QueryCache): void {
  if (watchedCaches.has(queryCache)) {
    return
  }
  watchedCaches.add(queryCache)
  queryCache.subscribe((event) => {
    if (event.type === 'observerAdded') {
      const info = experimental_getQueryStartInfo(event.query)
      if (info && !info.observed) {
        setStartInfo(event.query, { ...info, observed: true })
      }
    }
  })
}

/**
 * Records how a query started, for the devtools. A query that an observer has read stays read.
 * Only call it in development.
 * @internal
 * @param queryCache - The cache the query belongs to.
 * @param query - The query that started.
 * @param info - How it started.
 */
export function recordQueryStart(
  queryCache: QueryCache,
  query: Query<any, any, any, any>,
  info: Omit<QueryStartInfo, 'observed'> & { observed?: boolean },
): void {
  watchObservers(queryCache)
  const observed =
    info.observed ||
    experimental_getQueryStartInfo(query)?.observed ||
    query.getObserversCount() > 0
  setStartInfo(query, { ...info, observed })
  // A start on fresh data doesn't fetch, so nothing else tells the devtools to read the record
  queryCache.notify({ type: 'observerResultsUpdated', query })
}

/**
 * Records a query's first fetch with the verb `observer` when an observer, like `useQuery`, starts
 * it: no handle function started the query, so a component that rendered started it, which makes
 * it a request waterfall. It only records on a cache where a handle function or `hydrate` has
 * recorded a start, so apps that don't use handles see no change. Only call it in development.
 * @internal
 * @param queryCache - The cache the query belongs to.
 * @param query - The query the observer is about to fetch.
 */
export function recordObserverFetch(
  queryCache: QueryCache,
  query: Query<any, any, any, any>,
): void {
  const { dataUpdatedAt, errorUpdatedAt, fetchStatus } = query.state
  if (
    watchedCaches.has(queryCache) &&
    !experimental_getQueryStartInfo(query) &&
    dataUpdatedAt === 0 &&
    errorUpdatedAt === 0 &&
    fetchStatus === 'idle'
  ) {
    recordQueryStart(queryCache, query, {
      verb: 'observer',
      environment: environmentManager.isServer() ? 'server' : 'client',
      startedAt: Date.now(),
      observed: true,
    })
  }
}

/**
 * Returns how a query started: the last `experimental_queryHandle`, `experimental_queryHandleAsync`
 * or `experimental_ensureQueryHandle` call, or, with the verb `observer`, a first fetch that a
 * query hook started on a client that uses handles. A query that `hydrate` restores from a server
 * render keeps the server's record. Core only records start info in development.
 * @param query - The query to look up.
 * @returns The start info, or `undefined` in production and for queries that other APIs started.
 */
export function experimental_getQueryStartInfo(
  query: Query<any, any, any, any>,
): QueryStartInfo | undefined {
  return (query as QueryWithStartInfo)[startInfoKey]
}

// FUNCTIONS

/**
 * Tells `infiniteQueryOptions` results apart from `queryOptions` results.
 * @param options - Options a query factory returned.
 * @returns Whether they describe an infinite query.
 */
function isInfiniteOptions(options: QueryFactoryOptions): boolean {
  return 'initialPageParam' in options
}

/**
 * Starts a factory's query without waiting. In development, it records the start for the devtools.
 * @param client - The client to start the query on.
 * @param options - Options a query factory returned.
 * @param verb - The handle function that starts it.
 * @returns The promise of the query's data.
 */
function startQueryFromFactory(
  client: QueryClient,
  options: QueryFactoryOptions & { staleTime?: StaleTime },
  verb: Exclude<QueryStartInfo['verb'], 'observer'>,
): Promise<unknown> {
  const promise = isInfiniteOptions(options)
    ? client.infiniteQuery(options as never)
    : client.query(options)
  if (process.env.NODE_ENV !== 'production') {
    const query = client
      .getQueryCache()
      .get(client.defaultQueryOptions(options).queryHash)
    if (query) {
      recordQueryStart(client.getQueryCache(), query, {
        verb,
        environment: environmentManager.isServer() ? 'server' : 'client',
        startedAt: Date.now(),
      })
    }
  }
  return promise
}

/**
 * Builds a handle.
 * @param options - Options a query factory returned.
 * @param input - The factory's input.
 * @returns A handle with their key and the input.
 */
function toHandle(options: QueryFactoryOptions, input: unknown) {
  return { queryKey: options.queryKey, input }
}

/**
 * Starts a query without waiting and returns a serializable handle for it. A route loader, server
 * component or server render passes the handle to the component that reads the query. Like
 * `queryClient.query`, it fetches only if the cache has no fresh data. It never rejects, even when
 * the `queryFn` fails at once: fetch errors show up where a component reads the handle.
 * @param queryClient - The client to start the query on.
 * @param factory - The query factory, a function of the query's input that returns its options.
 * @param input - The input to pass to the factory, if it takes one.
 * @returns A handle with the query's key and input.
 * @example
 * ```ts
 * const commentsQuery = (input: { postId: string }) =>
 *   infiniteQueryOptions({
 *     queryKey: ['comments', input.postId] as const,
 *     queryFn: ({ pageParam }) => fetchComments(input.postId, pageParam),
 *     initialPageParam: 1,
 *     getNextPageParam: (lastPage) => lastPage.nextPage,
 *   })
 *
 * // in a route loader: start the comments, and stream them in
 * const comments = experimental_queryHandle(queryClient, commentsQuery, { postId: id })
 * ```
 */
export function experimental_queryHandle<TFactory extends QueryHandleFactory>(
  queryClient: QueryClient,
  factory: TFactory,
  ...input: QueryHandleArgs<TFactory>
): QueryHandle<TFactory> {
  const options = factory(...input)
  void startQueryFromFactory(queryClient, options, 'queryHandle').catch(noop)
  return toHandle(options, input[0]) as QueryHandle<TFactory>
}

/**
 * Starts a query and waits for it like `queryClient.query`, then returns a serializable handle for
 * it. It uses cached data only if it isn't stale. Rejects if the fetch fails, so a loader can
 * redirect or show an error page. The handle carries no data; read it with `useSuspenseQuery` to
 * get defined data.
 * @param queryClient - The client to start the query on.
 * @param factory - The query factory, a function of the query's input that returns its options.
 * @param input - The input to pass to the factory, if it takes one.
 * @returns A promise of a handle with the query's key and input.
 * @example
 * ```ts
 * // in a route loader
 * const post = await experimental_queryHandleAsync(queryClient, postQuery, { id })
 * ```
 */
export async function experimental_queryHandleAsync<
  TFactory extends QueryHandleFactory,
>(
  queryClient: QueryClient,
  factory: TFactory,
  ...input: QueryHandleArgs<TFactory>
): Promise<DefinedQueryHandle<TFactory>> {
  const options = factory(...input)
  await startQueryFromFactory(queryClient, options, 'queryHandleAsync')
  return toHandle(options, input[0]) as DefinedQueryHandle<TFactory>
}

/**
 * Waits for any data, even stale data, then returns a serializable handle for the query. If the
 * cache has data, it resolves at once without fetching. If not, it fetches once and waits, and
 * rejects if that fetch fails. Readers use the factory's `staleTime`, so a reader refetches stale
 * data in the background when it mounts.
 * @param queryClient - The client to start the query on.
 * @param factory - The query factory, a function of the query's input that returns its options.
 * @param input - The input to pass to the factory, if it takes one.
 * @returns A promise of a handle with the query's key and input.
 * @example
 * ```ts
 * // in a route loader: use any cached post, and wait only if there is none
 * const post = await experimental_ensureQueryHandle(queryClient, postQuery, { id })
 * ```
 */
export async function experimental_ensureQueryHandle<
  TFactory extends QueryHandleFactory,
>(
  queryClient: QueryClient,
  factory: TFactory,
  ...input: QueryHandleArgs<TFactory>
): Promise<DefinedQueryHandle<TFactory>> {
  const options = factory(...input)
  await startQueryFromFactory(
    queryClient,
    { ...options, staleTime: 'static' },
    'ensureQueryHandle',
  )
  return toHandle(options, input[0]) as DefinedQueryHandle<TFactory>
}

/**
 * Rebuilds a query's options from its handle: the options its factory returns for the handle's
 * input. Pass them to `useQuery`, `useSuspenseQuery`, `useSuspenseInfiniteQuery` or any other API
 * that takes query options, and spread them to add read-site options like `select`. They share the
 * cache entry the handle's verb started. They add no `initialData`, so `useQuery` may return
 * undefined data, and `useSuspenseQuery` waits for the query's data.
 * @param factory - The factory that started the query.
 * @param handle - The handle the factory's verb returned.
 * @returns The query's options.
 * @example
 * ```tsx
 * function Post(props: { post: QueryHandle<typeof postQuery> }) {
 *   const { data } = useSuspenseQuery({
 *     ...experimental_fromHandle(postQuery, props.post),
 *     select: (post) => post.title,
 *   })
 * }
 * ```
 */
export function experimental_fromHandle<TFactory extends QueryHandleFactory>(
  factory: TFactory,
  handle: QueryHandle<NoInfer<TFactory>>,
): FromHandleOptions<TFactory> {
  return factory(handle.input) as FromHandleOptions<TFactory>
}

/**
 * Reads the data of an awaited handle from the cache, for a loader that decides what to do with
 * it, like throwing `notFound()`. It takes only handles from `experimental_queryHandleAsync` and
 * `experimental_ensureQueryHandle`, so it can't read a query that was only started. It never
 * fetches, waits or creates a query. It returns what the factory's `select` returns, or else the
 * `queryFn`'s data, like `useSuspenseQuery`'s `data`.
 * @param queryClient - The client that has the query's data.
 * @param factory - The function of the query's input that the handle came from.
 * @param handle - A handle from `experimental_queryHandleAsync` or `experimental_ensureQueryHandle`.
 * @returns The data a reader of the handle gets from the cache.
 * @example
 * ```ts
 * // in a route loader: start the comments first, so they load while the loader waits
 * const comments = experimental_queryHandle(queryClient, commentsQuery, { postId: id })
 * const post = await experimental_ensureQueryHandle(queryClient, postQuery, { id })
 * if (!experimental_getQueryHandleData(queryClient, postQuery, post)) throw notFound()
 * return { post, comments }
 * ```
 */
export function experimental_getQueryHandleData<
  TFactory extends QueryHandleFactory,
>(
  queryClient: QueryClient,
  factory: TFactory,
  handle: DefinedQueryHandle<NoInfer<TFactory>>,
): InferQueryHandleData<TFactory> {
  const options = factory(handle.input)
  const { queryHash } = queryClient.defaultQueryOptions(options)
  const data = queryClient.getQueryCache().get(queryHash)?.state.data
  return (
    options.select ? options.select(data) : data
  ) as InferQueryHandleData<TFactory>
}
