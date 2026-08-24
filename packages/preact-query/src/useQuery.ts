import { QueryObserver } from '@tanstack/query-core'
import type { DefaultError, QueryClient, QueryKey } from '@tanstack/query-core'

import type {
  DefinedInitialDataOptions,
  UndefinedInitialDataOptions,
} from './queryOptions'
import type {
  DefinedUseQueryResult,
  UseQueryOptions,
  UseQueryResult,
} from './types'
import { useBaseQuery } from './useBaseQuery'

/**
 * @param queryClient - Use this to use a custom QueryClient. Otherwise, the one from the nearest context will
 * be used.
 * @returns The current query result. `status` is `pending` if there is no cached data and no query attempt
 * has finished yet, `error` if the query attempt resulted in an error, or `success` if the query has data to
 * display. `isPending`/`isSuccess`/`isError` are derived booleans for convenience.
 */
export function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): DefinedUseQueryResult<TData, TError>

/**
 * @param queryClient - Use this to use a custom QueryClient. Otherwise, the one from the nearest context will
 * be used.
 * @returns The current query result. `status` is `pending` if there is no cached data and no query attempt
 * has finished yet, `error` if the query attempt resulted in an error, or `success` if the query has data to
 * display. `isPending`/`isSuccess`/`isError` are derived booleans for convenience.
 */
export function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): UseQueryResult<TData, TError>

/**
 * @param queryClient - Use this to use a custom QueryClient. Otherwise, the one from the nearest context will
 * be used.
 * @returns The current query result. `status` is `pending` if there is no cached data and no query attempt
 * has finished yet, `error` if the query attempt resulted in an error, or `success` if the query has data to
 * display. `isPending`/`isSuccess`/`isError` are derived booleans for convenience.
 *
 * @example
 * ```tsx
 * import { queryOptions, useQuery } from '@tanstack/preact-query'
 *
 * const postsOptions = queryOptions({
 *   queryKey: ['posts'],
 *   queryFn: fetchPosts,
 * })
 *
 * function Posts() {
 *   const { status, data, error, isFetching } = useQuery(postsOptions)
 *
 *   if (status === 'pending') return 'Loading...'
 *   if (status === 'error') return <span>Error: {error.message}</span>
 *
 *   return (
 *     <div>
 *       {data.map((post) => (
 *         <p key={post.id}>{post.title}</p>
 *       ))}
 *       <div>{isFetching ? 'Background Updating...' : ' '}</div>
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * A dependent query, only enabled once `postId` is set:
 * ```tsx
 * import { useQuery } from '@tanstack/preact-query'
 *
 * function Post({ postId }: { postId: number }) {
 *   const { data } = useQuery({
 *     queryKey: ['post', postId],
 *     queryFn: () => fetchPost(postId),
 *     enabled: !!postId,
 *   })
 *
 *   return <h1>{data?.title}</h1>
 * }
 * ```
 *
 * @example
 * Seeding a detail query from an already-cached list, to skip the loading state:
 * ```tsx
 * import { useQuery, useQueryClient } from '@tanstack/preact-query'
 *
 * function Post({ postId }: { postId: number }) {
 *   const queryClient = useQueryClient()
 *
 *   const { data } = useQuery({
 *     queryKey: ['post', postId],
 *     queryFn: () => fetchPost(postId),
 *     initialData: () =>
 *       queryClient
 *         .getQueryData(['posts'])
 *         ?.find((post) => post.id === postId),
 *   })
 *
 *   return <h1>{data?.title}</h1>
 * }
 * ```
 */
export function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): UseQueryResult<TData, TError>

export function useQuery(options: UseQueryOptions, queryClient?: QueryClient) {
  return useBaseQuery(options, QueryObserver, queryClient)
}
