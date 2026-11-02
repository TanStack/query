import { hashQueryKeyByOptions, noop } from './utils'
import type { QueryClient } from './queryClient'
import type { Query } from './query'
import type {
  DefaultError,
  InferDataFromTag,
  InferErrorFromTag,
  InfiniteData,
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
export type QueryHandleInput<TFactory extends QueryHandleFactory> =
  Parameters<TFactory> extends [] ? undefined : Parameters<TFactory>[0]

/**
 * The data type of a factory's query, from the tag on its `queryKey`. For an infinite query
 * factory, this is the `InfiniteData` of its pages, with the type of its `initialPageParam`.
 */
export type QueryHandleData<TFactory extends QueryHandleFactory> =
  ReturnType<TFactory> extends { initialPageParam: infer TPageParam }
    ? InferDataFromTag<
        unknown,
        ReturnType<TFactory>['queryKey']
      > extends InfiniteData<infer TPage, any>
      ? InfiniteData<TPage, TPageParam>
      : InferDataFromTag<unknown, ReturnType<TFactory>['queryKey']>
    : InferDataFromTag<unknown, ReturnType<TFactory>['queryKey']>

/**
 * The error type of a factory's query, from the tag on its `queryKey`.
 */
export type QueryHandleError<TFactory extends QueryHandleFactory> =
  InferErrorFromTag<DefaultError, ReturnType<TFactory>['queryKey']>

type PlainQueryKey<
  TQueryKey extends ReadonlyArray<unknown>,
  TItems extends Array<unknown> = [],
> = number extends TQueryKey['length']
  ? ReadonlyArray<TQueryKey[number]>
  : TItems['length'] extends TQueryKey['length']
    ? Readonly<TItems>
    : PlainQueryKey<TQueryKey, [...TItems, TQueryKey[TItems['length']]]>

/**
 * The `queryKey` of a factory's query as a plain readonly tuple, without the data tag that
 * `queryOptions` adds, so a handle stays a plain serializable object for routers that check
 * loader data.
 */
export type QueryHandleKey<TFactory extends QueryHandleFactory> = PlainQueryKey<
  ReturnType<TFactory>['queryKey']
>

/**
 * A small serializable reference to a query, from `experimental_prefetchHandle` or
 * `experimental_waterfallHandle`. Pass it to the component that reads the query, and rebuild the
 * query's options there with `experimental_fromHandle(factory, handle)`.
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
 * A handle returned by `experimental_ensureHandle` or `experimental_fetchHandle`, which waited for
 * the query's data. It carries that data, so code that called the verb can use it, and
 * `experimental_fromHandle` passes it on as `initialData` so readers always have data.
 */
export interface QueryHandleWithData<
  TFactory extends QueryHandleFactory = QueryHandleFactory,
> extends QueryHandle<TFactory> {
  /**
   * The query's data when the verb resolved. Readers get the cache's current data instead.
   */
  readonly data: QueryHandleData<TFactory>
  /**
   * When `data` last changed. `experimental_fromHandle` passes it on as `initialDataUpdatedAt`.
   */
  readonly dataUpdatedAt: number
}

/**
 * The options `experimental_fromHandle` returns: the factory's options for the handle's input and,
 * for a handle with data, that data as `initialData`.
 */
export type FromHandleOptions<
  TFactory extends QueryHandleFactory,
  THandle extends QueryHandle<TFactory>,
> =
  THandle extends QueryHandleWithData<TFactory>
    ? Omit<ReturnType<TFactory>, 'initialData'> & {
        initialData: QueryHandleData<TFactory>
        initialDataUpdatedAt: number
      }
    : ReturnType<TFactory>

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
  options: QueryFactoryOptions,
): Promise<unknown> {
  return isInfiniteOptions(options)
    ? client.infiniteQuery(options as never)
    : client.query(options)
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
 * Builds a handle that carries the query's current data.
 * @param client - The client whose cache holds the query.
 * @param options - Options a query factory returned.
 * @param input - The factory's input.
 * @returns A handle with their key, the input and the data.
 */
function withData(
  client: QueryClient,
  options: QueryFactoryOptions,
  input: unknown,
) {
  const state = getQuery(client, options)?.state
  return {
    ...toHandle(options, input),
    data: state?.data,
    dataUpdatedAt: state?.dataUpdatedAt ?? 0,
  }
}

/**
 * Starts a query without waiting and returns a serializable handle for it. A route loader, server
 * component or server render passes the handle to the component that reads the query. Like
 * `queryClient.query`, it fetches only if the cache has no fresh data. It never throws: errors
 * show up where a component reads the handle.
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
  ...input: Parameters<TFactory>
): QueryHandle<TFactory> {
  const options = factory(...input)
  void startQueryFromFactory(queryClient, options).catch(noop)
  return toHandle(options, input[0]) as QueryHandle<TFactory>
}

/**
 * Starts a query and waits until the cache has data for it, then returns a handle that carries the
 * data. It resolves at once with cached data, even stale data, and refetches stale data in the
 * background. Rejects if the query has no data and its fetch fails.
 * @param queryClient - The client to start the query on.
 * @param factory - The query factory, a function of the query's input that returns its options.
 * @param input - The input to pass to the factory, if it takes one.
 * @returns A promise of a handle with the query's key, input and data.
 * @example
 * ```ts
 * const viewer = await experimental_ensureHandle(queryClient, viewerQuery)
 * viewer.data.name
 * ```
 */
export async function experimental_ensureHandle<
  TFactory extends QueryHandleFactory,
>(
  queryClient: QueryClient,
  factory: TFactory,
  ...input: Parameters<TFactory>
): Promise<QueryHandleWithData<TFactory>> {
  const options = factory(...input)
  const promise = startQueryFromFactory(queryClient, options)
  if (getQuery(queryClient, options)?.state.data === undefined) {
    await promise
  } else {
    promise.catch(noop)
  }
  return withData(
    queryClient,
    options,
    input[0],
  ) as QueryHandleWithData<TFactory>
}

/**
 * Starts a query and waits for fresh data, then returns a handle that carries the data. Like
 * `queryClient.query`, it uses cached data only if it isn't stale. Rejects if the fetch fails.
 * @param queryClient - The client to start the query on.
 * @param factory - The query factory, a function of the query's input that returns its options.
 * @param input - The input to pass to the factory, if it takes one.
 * @returns A promise of a handle with the query's key, input and data.
 * @example
 * ```ts
 * const post = await experimental_fetchHandle(queryClient, postQuery, { id })
 * if (!post.data.published) throw redirect({ to: '/' })
 * ```
 */
export async function experimental_fetchHandle<
  TFactory extends QueryHandleFactory,
>(
  queryClient: QueryClient,
  factory: TFactory,
  ...input: Parameters<TFactory>
): Promise<QueryHandleWithData<TFactory>> {
  const options = factory(...input)
  await startQueryFromFactory(queryClient, options)
  return withData(
    queryClient,
    options,
    input[0],
  ) as QueryHandleWithData<TFactory>
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
>(factory: TFactory, ...input: Parameters<TFactory>): QueryHandle<TFactory>
/**
 * Switches a handle, like one a loader passed down, to a new input, like the next page, and
 * returns the handle for that input. It doesn't start the query: the component that reads the
 * handle does, when it renders, which makes it a request waterfall. Prefer passing the new input
 * to the loader through the URL.
 *
 * While the new input maps to the handle's own query, it returns the handle as is, so the first
 * page reads what the loader started.
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
 * cache entry the handle's verb started.
 *
 * For a handle from `experimental_ensureHandle` or `experimental_fetchHandle`, it passes the
 * handle's data on as `initialData` and `initialDataUpdatedAt`, so readers always have data. Data
 * already in the cache wins over it.
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
export function experimental_fromHandle<
  TFactory extends QueryHandleFactory,
  THandle extends QueryHandle<TFactory>,
>(factory: TFactory, handle: THandle): FromHandleOptions<TFactory, THandle> {
  const options = factory(handle.input)
  if ('data' in handle && handle.data !== undefined) {
    return {
      ...options,
      initialData: handle.data,
      initialDataUpdatedAt: (handle as unknown as QueryHandleWithData)
        .dataUpdatedAt,
    } as FromHandleOptions<TFactory, THandle>
  }
  return options as FromHandleOptions<TFactory, THandle>
}
