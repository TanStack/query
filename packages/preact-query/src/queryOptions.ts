import type {
  DefaultError,
  InitialDataFunction,
  NonUndefinedGuard,
  OmitKeyof,
  QueryFunction,
  QueryKey,
  QueryKeyWithDataTag,
  SkipToken,
} from '@tanstack/query-core'

import type { UseQueryOptions } from './types'

/**
 * The options accepted by the `queryOptions` overload selected when no `initialData` is set — `data` may be
 * `undefined` while the query is `pending`.
 *
 * @template TQueryFnData - The type your `queryFn` resolves to.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TQueryKey - The type of your `queryKey`.
 */
export type UndefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
  /**
   * If set, this value will be used as the initial data for the query cache (as long as the query hasn't been
   * created or cached yet). If set to a function, the function will be called **once** during the shared/root
   * query initialization, and be expected to synchronously return the initial data. Initial data is
   * considered stale by default unless a `staleTime` has been set. `initialData` **is persisted** to the
   * cache.
   */
  initialData?:
    | undefined
    | InitialDataFunction<NonUndefinedGuard<TQueryFnData>>
    | NonUndefinedGuard<TQueryFnData>
}

/**
 * The options accepted by the `queryOptions` overload selected when no `initialData` is set and `queryFn` is
 * not `skipToken` — same as {@link UndefinedInitialDataOptions}, but `queryFn` may not be `skipToken`.
 *
 * @template TQueryFnData - The type your `queryFn` resolves to.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TQueryKey - The type of your `queryKey`.
 */
export type UnusedSkipTokenOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = OmitKeyof<
  UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  'queryFn'
> & {
  /**
   * `skipToken` is not allowed as a value here — this overload is selected when no `initialData` is set. If
   * you don't intend to run the query yet, omit `queryFn` or use a default query function instead.
   */
  queryFn?: Exclude<
    UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>['queryFn'],
    SkipToken | undefined
  >
}

/**
 * The options accepted by the `queryOptions` overload selected when `initialData` is set — `data` is never
 * `undefined`.
 *
 * @template TQueryFnData - The type your `queryFn` resolves to.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TQueryKey - The type of your `queryKey`.
 */
export type DefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryFn'> & {
  /**
   * If set, this value will be used as the initial data for the query cache (as long as the query hasn't been
   * created or cached yet). If set to a function, the function will be called **once** during the shared/root
   * query initialization, and be expected to synchronously return the initial data. Initial data is
   * considered stale by default unless a `staleTime` has been set. `initialData` **is persisted** to the
   * cache.
   */
  initialData:
    | NonUndefinedGuard<TQueryFnData>
    | (() => NonUndefinedGuard<TQueryFnData>)
  /**
   * Optional here, but omitting it is only safe when no fetch will be attempted — for example with
   * `enabled: false`, or when a default query function has been defined. Otherwise, an enabled query with no
   * `queryFn` still tries to fetch and fails with a "Missing queryFn" error; `initialData` does not prevent this.
   */
  queryFn?: QueryFunction<TQueryFnData, TQueryKey>
}

/**
 * You can generally pass everything to `queryOptions` that you can also pass to `useQuery`. These options can
 * be shared across hooks and imperative APIs such as `queryClient.query`. `options.queryKey` is required and
 * is the query key to generate options for.
 *
 * This overload is selected when `initialData` is set, so the resulting `data` is never `undefined`.
 *
 * @see {@link useQuery} to run a query with these options.
 * @param options - The {@link DefinedInitialDataOptions} to use — everything you can pass to `useQuery`, with `initialData` set.
 * @returns The same options object, typed so that `queryKey` carries the inferred data type.
 *
 * @example
 * ```tsx
 * import { queryOptions, useQuery } from '@tanstack/preact-query'
 *
 * export const postsOptions = queryOptions({
 *   queryKey: ['posts'],
 *   queryFn: fetchPosts,
 *   initialData: [],
 * })
 *
 * function Posts() {
 *   // `data` is `Post[]`, never `undefined`, thanks to `initialData`.
 *   const { data } = useQuery(postsOptions)
 *   return (
 *     <ul>
 *       {data.map((post) => <li key={post.id}>{post.title}</li>)}
 *     </ul>
 *   )
 * }
 * ```
 */
export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
): DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> &
  QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>

/**
 * You can generally pass everything to `queryOptions` that you can also pass to `useQuery`. These options can
 * be shared across hooks and imperative APIs such as `queryClient.query`. `options.queryKey` is required and
 * is the query key to generate options for.
 *
 * @see {@link useQuery} to run a query with these options.
 * @param options - The {@link UnusedSkipTokenOptions} to use — everything you can pass to `useQuery`.
 * @returns The same options object, typed so that `queryKey` carries the inferred data type.
 *
 * @example
 * ```tsx
 * import { queryOptions, useQuery } from '@tanstack/preact-query'
 *
 * export const postsOptions = queryOptions({
 *   queryKey: ['posts'],
 *   queryFn: fetchPosts,
 * })
 *
 * function Posts() {
 *   const { data } = useQuery(postsOptions)
 *   return (
 *     <ul>
 *       {data?.map((post) => <li key={post.id}>{post.title}</li>)}
 *     </ul>
 *   )
 * }
 * ```
 *
 * @example
 * A parameterized factory, reused across a hook and an imperative call with the same cache entry:
 * ```tsx
 * import { noop, queryOptions, useQuery } from '@tanstack/preact-query'
 *
 * export const postOptions = (id: string) =>
 *   queryOptions({
 *     queryKey: ['post', id],
 *     queryFn: () => fetchPost(id),
 *   })
 *
 * function Post({ id }: { id: string }) {
 *   const { data } = useQuery(postOptions(id))
 *   return <h1>{data?.title}</h1>
 * }
 *
 * // `postOptions` also works with imperative APIs like `queryClient.query` —
 * // see `useQuery` for an example that warms the cache this way before rendering `<Post>`.
 * const postId = '1'
 * queryClient.query(postOptions(postId)).catch(noop)
 * ```
 *
 * @example
 * The same options object works with every API that accepts query options:
 * ```tsx
 * import { noop, queryOptions, useQuery } from '@tanstack/preact-query'
 *
 * const todosOptions = queryOptions({
 *   queryKey: ['todos'],
 *   queryFn: fetchTodos,
 * })
 *
 * function Todos() {
 *   const { data } = useQuery(todosOptions)
 *   return (
 *     <ul>
 *       {data?.map((todo) => <li key={todo.id}>{todo.title}</li>)}
 *     </ul>
 *   )
 * }
 *
 * // The same options object works with the imperative APIs too:
 * queryClient.query(todosOptions).catch(noop)
 * queryClient.getQueryData(todosOptions.queryKey) // typed as Array<Todo> | undefined
 * ```
 */
export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UnusedSkipTokenOptions<TQueryFnData, TError, TData, TQueryKey>,
): UnusedSkipTokenOptions<TQueryFnData, TError, TData, TQueryKey> &
  QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>

/**
 * You can generally pass everything to `queryOptions` that you can also pass to `useQuery`. These options can
 * be shared across hooks and imperative APIs such as `queryClient.query`. `options.queryKey` is required and
 * is the query key to generate options for.
 *
 * @see {@link useQuery} to run a query with these options.
 * @param options - The {@link UndefinedInitialDataOptions} to use — everything you can pass to `useQuery`.
 * @returns The same options object, typed so that `queryKey` carries the inferred data type.
 *
 * @example
 * ```tsx
 * import { queryOptions, useQuery } from '@tanstack/preact-query'
 *
 * export const postsOptions = queryOptions({
 *   queryKey: ['posts'],
 *   queryFn: fetchPosts,
 * })
 *
 * function Posts() {
 *   const { data } = useQuery(postsOptions)
 *   return (
 *     <ul>
 *       {data?.map((post) => <li key={post.id}>{post.title}</li>)}
 *     </ul>
 *   )
 * }
 * ```
 *
 * @example
 * A parameterized factory, reused across a hook and an imperative call with the same cache entry:
 * ```tsx
 * import { noop, queryOptions, useQuery } from '@tanstack/preact-query'
 *
 * export const postOptions = (id: string) =>
 *   queryOptions({
 *     queryKey: ['post', id],
 *     queryFn: () => fetchPost(id),
 *   })
 *
 * function Post({ id }: { id: string }) {
 *   const { data } = useQuery(postOptions(id))
 *   return <h1>{data?.title}</h1>
 * }
 *
 * // `postOptions` also works with imperative APIs like `queryClient.query` —
 * // see `useQuery` for an example that warms the cache this way before rendering `<Post>`.
 * const postId = '1'
 * queryClient.query(postOptions(postId)).catch(noop)
 * ```
 *
 * @example
 * The same options object works with every API that accepts query options:
 * ```tsx
 * import { noop, queryOptions, useQuery } from '@tanstack/preact-query'
 *
 * const todosOptions = queryOptions({
 *   queryKey: ['todos'],
 *   queryFn: fetchTodos,
 * })
 *
 * function Todos() {
 *   const { data } = useQuery(todosOptions)
 *   return (
 *     <ul>
 *       {data?.map((todo) => <li key={todo.id}>{todo.title}</li>)}
 *     </ul>
 *   )
 * }
 *
 * // The same options object works with the imperative APIs too:
 * queryClient.query(todosOptions).catch(noop)
 * queryClient.getQueryData(todosOptions.queryKey) // typed as Array<Todo> | undefined
 * ```
 */
export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
): UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> &
  QueryKeyWithDataTag<TQueryKey, TQueryFnData, TError>

export function queryOptions(options: unknown) {
  return options
}
