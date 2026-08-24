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
   * `skipToken` is not allowed here — this overload is selected when no `initialData` is set, so the query
   * always needs a function to actually run.
   */
  queryFn?: Exclude<
    UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>['queryFn'],
    SkipToken | undefined
  >
}

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
   * Optional here — since `initialData` is set, the query already has data to display without a query function.
   */
  queryFn?: QueryFunction<TQueryFnData, TQueryKey>
}

/**
 * You can generally pass everything to `queryOptions` that you can also pass to `useQuery`. These options can
 * be shared across hooks and imperative APIs such as `queryClient.query`. `options.queryKey` is required and
 * is the query key to generate options for.
 *
 * @returns The same options object, typed so that `queryKey` carries the inferred data type.
 *
 * @example
 * ```tsx
 * import { queryOptions } from '@tanstack/preact-query'
 *
 * export const postsOptions = queryOptions({
 *   queryKey: ['posts'],
 *   queryFn: fetchPosts,
 * })
 * ```
 *
 * @example
 * A parameterized factory, reused across a hook and an imperative call with the same cache entry:
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
 *   const { data } = useQuery(postOptions(id))
 *   return <h1>{data?.title}</h1>
 * }
 *
 * // Elsewhere, e.g. to warm the cache before rendering `<Post>`:
 * queryClient.prefetchQuery(postOptions(id))
 * ```
 *
 * @example
 * The same options object works with every API that accepts query options:
 * ```tsx
 * import { queryOptions, useQuery, useSuspenseQuery } from '@tanstack/preact-query'
 *
 * const todosOptions = queryOptions({
 *   queryKey: ['todos'],
 *   queryFn: fetchTodos,
 * })
 *
 * useQuery(todosOptions)
 * useSuspenseQuery(todosOptions)
 * queryClient.prefetchQuery(todosOptions)
 * queryClient.getQueryData(todosOptions.queryKey) // typed as Array<Todo> | undefined
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
 * @returns The same options object, typed so that `queryKey` carries the inferred data type.
 *
 * @example
 * ```tsx
 * import { queryOptions } from '@tanstack/preact-query'
 *
 * export const postsOptions = queryOptions({
 *   queryKey: ['posts'],
 *   queryFn: fetchPosts,
 * })
 * ```
 *
 * @example
 * A parameterized factory, reused across a hook and an imperative call with the same cache entry:
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
 *   const { data } = useQuery(postOptions(id))
 *   return <h1>{data?.title}</h1>
 * }
 *
 * // Elsewhere, e.g. to warm the cache before rendering `<Post>`:
 * queryClient.prefetchQuery(postOptions(id))
 * ```
 *
 * @example
 * The same options object works with every API that accepts query options:
 * ```tsx
 * import { queryOptions, useQuery, useSuspenseQuery } from '@tanstack/preact-query'
 *
 * const todosOptions = queryOptions({
 *   queryKey: ['todos'],
 *   queryFn: fetchTodos,
 * })
 *
 * useQuery(todosOptions)
 * useSuspenseQuery(todosOptions)
 * queryClient.prefetchQuery(todosOptions)
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
 * @returns The same options object, typed so that `queryKey` carries the inferred data type.
 *
 * @example
 * ```tsx
 * import { queryOptions } from '@tanstack/preact-query'
 *
 * export const postsOptions = queryOptions({
 *   queryKey: ['posts'],
 *   queryFn: fetchPosts,
 * })
 * ```
 *
 * @example
 * A parameterized factory, reused across a hook and an imperative call with the same cache entry:
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
 *   const { data } = useQuery(postOptions(id))
 *   return <h1>{data?.title}</h1>
 * }
 *
 * // Elsewhere, e.g. to warm the cache before rendering `<Post>`:
 * queryClient.prefetchQuery(postOptions(id))
 * ```
 *
 * @example
 * The same options object works with every API that accepts query options:
 * ```tsx
 * import { queryOptions, useQuery, useSuspenseQuery } from '@tanstack/preact-query'
 *
 * const todosOptions = queryOptions({
 *   queryKey: ['todos'],
 *   queryFn: fetchTodos,
 * })
 *
 * useQuery(todosOptions)
 * useSuspenseQuery(todosOptions)
 * queryClient.prefetchQuery(todosOptions)
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
