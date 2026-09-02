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
   * you don't intend to run the query yet, set `enabled: false` — omitting `queryFn` alone still triggers a
   * fetch that fails with "Missing queryFn" unless `enabled` is `false` or a default query function has been
   * defined. A default query function only supplies `queryFn`; it doesn't defer the fetch on its own.
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
 *   // `data` is `Post[]`, never `undefined`, thanks to `initialData` — even if a refetch fails,
 *   // so the list stays visible alongside the error.
 *   const { data, isError, error } = useQuery(postsOptions)
 *
 *   return (
 *     <div>
 *       {isError ? <span>Error: {error.message}</span> : null}
 *       <ul>
 *         {data.map((post) => <li key={post.id}>{post.title}</li>)}
 *       </ul>
 *     </div>
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
 * A parameterized factory, so the same options object can be reused per `id`:
 * ```tsx
 * import { queryOptions, useQuery } from '@tanstack/preact-query'
 *
 * export const postOptions = (id: string) =>
 *   queryOptions({
 *     queryKey: ['post', id],
 *     queryFn: () => fetchPost(id),
 *   })
 *
 * function Post({ id }: { id: string }) {
 *   const { data, isPending, isError, error } = useQuery(postOptions(id))
 *
 *   if (isPending) return 'Loading...'
 *   if (isError) return <span>Error: {error.message}</span>
 *
 *   return <h1>{data.title}</h1>
 * }
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
 * @remarks This is the only overload that accepts `queryFn: skipToken`, shown below.
 *
 * @example
 * A parameterized factory, so the same options object can be reused per `id`:
 * ```tsx
 * import { queryOptions, useQuery } from '@tanstack/preact-query'
 *
 * export const postOptions = (id: string) =>
 *   queryOptions({
 *     queryKey: ['post', id],
 *     queryFn: () => fetchPost(id),
 *   })
 *
 * function Post({ id }: { id: string }) {
 *   const { data, isPending, isError, error } = useQuery(postOptions(id))
 *
 *   if (isPending) return 'Loading...'
 *   if (isError) return <span>Error: {error.message}</span>
 *
 *   return <h1>{data.title}</h1>
 * }
 * ```
 *
 * @example
 * A factory that disables the query, type safe, until `postId` is set:
 * ```tsx
 * import { queryOptions, skipToken, useQuery } from '@tanstack/preact-query'
 *
 * export const postOptions = (postId: number | undefined) =>
 *   queryOptions({
 *     queryKey: ['post', postId],
 *     queryFn: postId != null ? () => fetchPost(postId) : skipToken,
 *   })
 *
 * function Post({ postId }: { postId: number | undefined }) {
 *   const { data, isLoading, isError, error } = useQuery(postOptions(postId))
 *
 *   if (postId == null) return 'Select a post'
 *   if (isLoading) return 'Loading...'
 *   if (isError) return <span>Error: {error.message}</span>
 *
 *   return <h1>{data?.title}</h1>
 * }
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
