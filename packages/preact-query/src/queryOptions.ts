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
  initialData:
    | NonUndefinedGuard<TQueryFnData>
    | (() => NonUndefinedGuard<TQueryFnData>)
  queryFn?: QueryFunction<TQueryFnData, TQueryKey>
}

/**
 * You can generally pass everything to `queryOptions` that you can also pass to `useQuery`. These options can
 * be shared across hooks and imperative APIs such as `queryClient.query`. `options.queryKey` is required and
 * is the query key to generate options for.
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
