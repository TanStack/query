import { environmentManager } from './environmentManager'
import { hashQueryKeyByOptions, noop } from './utils'
import type { QueryCache } from './queryCache'
import type { QueryClient } from './queryClient'
import type { Query } from './query'
import type {
  InferDataFromTag,
  QueryFunctionContext,
  QueryKey,
  QueryKeyHashFunction,
} from './types'

// TYPES

/**
 * The options a query factory returns, usually from `queryOptions` or `infiniteQueryOptions`.
 */
interface QueryFactoryOptions {
  queryKey: QueryKey
  queryKeyHashFn?: QueryKeyHashFunction<any>
}

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
 * A small serializable reference to a query, from `experimental_prefetchHandle`,
 * `experimental_ensureHandle`, `experimental_fetchHandle` or `experimental_waterfallHandle`. Pass
 * it to the component that reads the query, and rebuild the query's options there with
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
  : T extends QueryHandle<infer TFactory>
    ? FactoryData<ReturnType<TFactory>>
    : never

/**
 * How a query was last started through the handle APIs, as shown by the devtools.
 */
export interface QueryStartInfo {
  /**
   * The API that started the query.
   */
  verb: 'prefetchHandle' | 'ensureHandle' | 'fetchHandle' | 'waterfallHandle'
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
 * Stores how a query was started on the query, hidden from enumeration.
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
 * Records how a query was started, for the devtools. A query that an observer has read stays read.
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
}

/**
 * Returns how a query was last started through `experimental_prefetchHandle`,
 * `experimental_ensureHandle` or `experimental_fetchHandle`, or first fetched by a reader of an
 * `experimental_waterfallHandle` handle, if it was. A query hydrated from a server render in
 * development keeps the server's record.
 * @param query - The query to look up.
 * @returns The start info, or `undefined` if the query wasn't started through those APIs.
 */
export function experimental_getQueryStartInfo(
  query: Query<any, any, any, any>,
): QueryStartInfo | undefined {
  return (query as QueryWithStartInfo)[startInfoKey]
}

const waterfallKey = Symbol.for('@tanstack/query-core/experimental_waterfall')

/**
 * Marks a handle from `experimental_waterfallHandle`, hidden from enumeration so the handle still
 * equals and serializes as `{ queryKey, input }`.
 * @param handle - The handle to mark.
 * @returns The handle.
 */
function markWaterfall<THandle extends object>(handle: THandle): THandle {
  Object.defineProperty(handle, waterfallKey, { value: true })
  return handle
}

/**
 * Wraps the `queryFn` of a waterfall handle's options so the query's first fetch is recorded with
 * the verb `waterfallHandle`, since that fetch is the waterfall.
 * @param options - Options a query factory returned for the handle's input.
 * @returns The options, with the wrapped `queryFn`.
 */
function recordWaterfallStart(
  options: QueryFactoryOptions & { queryFn?: unknown },
): QueryFactoryOptions {
  const queryFn = options.queryFn
  if (typeof queryFn !== 'function') {
    return options
  }
  return {
    ...options,
    queryFn: (context: QueryFunctionContext) => {
      const queryCache = context.client.getQueryCache()
      const query = getQuery(context.client, options)
      if (query && !experimental_getQueryStartInfo(query)) {
        recordQueryStart(queryCache, query, {
          verb: 'waterfallHandle',
          environment: environmentManager.isServer() ? 'server' : 'client',
          startedAt: Date.now(),
        })
      }
      return queryFn(context)
    },
  } as QueryFactoryOptions
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
 * Starts a factory's query without waiting, and records the start for the devtools.
 * @param client - The client to start the query on.
 * @param options - Options a query factory returned.
 * @param verb - The API that starts it.
 * @returns The promise of the query's data.
 */
function startQueryFromFactory(
  client: QueryClient,
  options: QueryFactoryOptions,
  verb: QueryStartInfo['verb'],
): Promise<unknown> {
  const promise: Promise<unknown> = isInfiniteOptions(options)
    ? client.infiniteQuery(options as never)
    : client.query(options)
  const queryCache = client.getQueryCache()
  const query = getQuery(client, options)
  if (query) {
    recordQueryStart(queryCache, query, {
      verb,
      environment: environmentManager.isServer() ? 'server' : 'client',
      startedAt: Date.now(),
    })
  }
  return promise
}

/**
 * Looks up the cache entry of a factory's options.
 * @param client - The client whose cache to look in.
 * @param options - Options a query factory returned.
 * @returns The query, if the cache has it.
 */
function getQuery(
  client: QueryClient,
  options: QueryFactoryOptions,
): Query<any, any, any, any> | undefined {
  return client
    .getQueryCache()
    .get(client.defaultQueryOptions(options).queryHash)
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
 * `queryClient.query`, it fetches only if the cache has no fresh data. It doesn't reject: fetch
 * errors show up where a component reads the handle.
 * @param queryClient - The client to start the query on.
 * @param factory - The query factory, a function of the query's input that returns its options.
 * @param input - The input to pass to the factory, if it takes one.
 * @returns A handle with the query's key and input.
 * @example
 * ```ts
 * const postQuery = (input: { id: string }) =>
 *   queryOptions({
 *     queryKey: ['post', input.id] as const,
 *     queryFn: () => fetchPost(input.id),
 *   })
 *
 * // in a route loader
 * const post = experimental_prefetchHandle(queryClient, postQuery, { id })
 * ```
 */
export function experimental_prefetchHandle<
  TFactory extends QueryHandleFactory,
>(
  queryClient: QueryClient,
  factory: TFactory,
  ...input: QueryHandleArgs<TFactory>
): QueryHandle<TFactory> {
  const options = factory(...input)
  void startQueryFromFactory(queryClient, options, 'prefetchHandle').catch(noop)
  return toHandle(options, input[0]) as QueryHandle<TFactory>
}

/**
 * Starts a query and waits until the cache has data for it, then returns a serializable handle for
 * it. It resolves at once with cached data, even stale data, and refetches stale data in the
 * background. Rejects if the query has no data and its fetch fails. The handle carries no data;
 * read it with `useSuspenseQuery` to get defined data.
 * @param queryClient - The client to start the query on.
 * @param factory - The query factory, a function of the query's input that returns its options.
 * @param input - The input to pass to the factory, if it takes one.
 * @returns A promise of a handle with the query's key and input.
 * @example
 * ```ts
 * // in a route loader
 * const viewer = await experimental_ensureHandle(queryClient, viewerQuery)
 * ```
 */
export async function experimental_ensureHandle<
  TFactory extends QueryHandleFactory,
>(
  queryClient: QueryClient,
  factory: TFactory,
  ...input: QueryHandleArgs<TFactory>
): Promise<QueryHandle<TFactory>> {
  const options = factory(...input)
  const promise = startQueryFromFactory(queryClient, options, 'ensureHandle')
  if (getQuery(queryClient, options)?.state.data === undefined) {
    await promise
  } else {
    promise.catch(noop)
  }
  return toHandle(options, input[0]) as QueryHandle<TFactory>
}

/**
 * Starts a query and waits for fresh data, then returns a serializable handle for it. Like
 * `queryClient.query`, it uses cached data only if it isn't stale. Rejects if the fetch fails. The
 * handle carries no data; read it with `useSuspenseQuery` to get defined data.
 * @param queryClient - The client to start the query on.
 * @param factory - The query factory, a function of the query's input that returns its options.
 * @param input - The input to pass to the factory, if it takes one.
 * @returns A promise of a handle with the query's key and input.
 * @example
 * ```ts
 * // in a route loader
 * const post = await experimental_fetchHandle(queryClient, postQuery, { id })
 * ```
 */
export async function experimental_fetchHandle<
  TFactory extends QueryHandleFactory,
>(
  queryClient: QueryClient,
  factory: TFactory,
  ...input: QueryHandleArgs<TFactory>
): Promise<QueryHandle<TFactory>> {
  const options = factory(...input)
  await startQueryFromFactory(queryClient, options, 'fetchHandle')
  return toHandle(options, input[0]) as QueryHandle<TFactory>
}

/**
 * Builds the handle of a query whose input you only know during render, like a search term or a
 * page a user clicks to. It doesn't start the query: the component that reads the handle does,
 * when it renders, which makes it a request waterfall. The name keeps that visible. Prefer
 * starting queries in a route loader or server component with `experimental_prefetchHandle`.
 * @param factory - The query factory, a function of the query's input that returns its options.
 * @param input - The input to pass to the factory, if it takes one.
 * @returns A handle with the query's key and input.
 * @example
 * ```tsx
 * function Search(props: { term: string }) {
 *   const results = experimental_waterfallHandle(searchQuery, { term: props.term })
 *   const { data } = useQuery(experimental_fromHandle(searchQuery, results))
 * }
 * ```
 */
export function experimental_waterfallHandle<
  TFactory extends QueryHandleFactory,
>(factory: TFactory, ...input: QueryHandleArgs<TFactory>): QueryHandle<TFactory>
/**
 * Switches a handle, like one a loader passed down, to a new input, like the next page, and
 * returns the handle for that input. It doesn't start the query: the component that reads the
 * handle does, when it renders, which makes it a request waterfall. Prefer passing the new input
 * to the loader through the URL.
 *
 * While the new input maps to the handle's own query, it returns the handle as is, so the first
 * page reads what the loader started. That also keeps the old input when only fields outside the
 * key change, so put everything the `queryFn` reads in the key.
 * @param factory - The factory that started the handle's query.
 * @param handle - The handle to switch from.
 * @param switchInput - Returns the new input, given the handle's input.
 * @returns `handle` while the switched input maps to its query, otherwise a handle for the new
 * input.
 * @example
 * ```tsx
 * function Posts(props: { posts: experimental_QueryHandle<typeof postsQuery> }) {
 *   const [page, setPage] = React.useState(1)
 *   const posts = experimental_waterfallHandle(postsQuery, props.posts, (input) => ({
 *     ...input,
 *     page,
 *   }))
 *   const { data } = useQuery(experimental_fromHandle(postsQuery, posts))
 * }
 * ```
 */
export function experimental_waterfallHandle<
  TFactory extends QueryHandleFactory,
>(
  factory: TFactory,
  handle: QueryHandle<TFactory>,
  switchInput: (
    input: QueryHandleInput<TFactory>,
  ) => QueryHandleInput<TFactory>,
): QueryHandle<TFactory>
export function experimental_waterfallHandle<
  TFactory extends QueryHandleFactory,
>(factory: TFactory, ...args: Array<any>): QueryHandle<TFactory> {
  const [inputOrHandle, switchInput] = args as [
    unknown,
    ((input: QueryHandleInput<TFactory>) => QueryHandleInput<TFactory>)?,
  ]
  if (typeof switchInput !== 'function') {
    return markWaterfall(
      toHandle(factory(inputOrHandle), inputOrHandle),
    ) as QueryHandle<TFactory>
  }
  const previous = inputOrHandle as QueryHandle<TFactory>
  const input = switchInput(previous.input)
  const options = factory(input)
  if (
    hashQueryKeyByOptions(options.queryKey, options) ===
    hashQueryKeyByOptions(previous.queryKey as QueryKey, options)
  ) {
    return previous
  }
  return markWaterfall(toHandle(options, input)) as QueryHandle<TFactory>
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
  const options =
    waterfallKey in handle
      ? recordWaterfallStart(factory(handle.input))
      : factory(handle.input)
  return options as FromHandleOptions<TFactory>
}
