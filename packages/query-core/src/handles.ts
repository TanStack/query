import { hashQueryKeyByOptions, noop } from './utils'
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
 * `experimental_queryHandleAsync`, `experimental_ensureQueryHandle` or
 * `experimental_waterfallHandle`. Pass
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
 * Starts a factory's query without waiting.
 * @param client - The client to start the query on.
 * @param options - Options a query factory returned.
 * @returns The promise of the query's data.
 */
function startQueryFromFactory(
  client: QueryClient,
  options: QueryFactoryOptions & { staleTime?: StaleTime },
): Promise<unknown> {
  return isInfiniteOptions(options)
    ? client.infiniteQuery(options as never)
    : client.query(options)
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
 * const postQuery = (input: { id: string }) =>
 *   queryOptions({
 *     queryKey: ['post', input.id] as const,
 *     queryFn: () => fetchPost(input.id),
 *   })
 *
 * // in a route loader
 * const post = experimental_queryHandle(queryClient, postQuery, { id })
 * ```
 */
export function experimental_queryHandle<TFactory extends QueryHandleFactory>(
  queryClient: QueryClient,
  factory: TFactory,
  ...input: QueryHandleArgs<TFactory>
): QueryHandle<TFactory> {
  const options = factory(...input)
  void startQueryFromFactory(queryClient, options).catch(noop)
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
  await startQueryFromFactory(queryClient, options)
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
  await startQueryFromFactory(queryClient, { ...options, staleTime: 'static' })
  return toHandle(options, input[0]) as DefinedQueryHandle<TFactory>
}

/**
 * Builds the handle of a query whose input you only know during render, like a search term or a
 * page a user clicks to. It doesn't start the query: the component that reads the handle does,
 * when it renders, which makes it a request waterfall. The name keeps that visible. Prefer
 * starting queries in a route loader or server component with `experimental_queryHandle`.
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
    return toHandle(
      factory(inputOrHandle),
      inputOrHandle,
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
  return toHandle(options, input) as QueryHandle<TFactory>
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
 * // in a route loader
 * const post = await experimental_queryHandleAsync(queryClient, postQuery, { id })
 * if (!experimental_getQueryHandleData(queryClient, postQuery, post)) throw notFound()
 * return { post }
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
