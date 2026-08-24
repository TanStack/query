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
 *
 * @example
 * ```tsx
 * import { queryOptions, useQuery } from '@tanstack/preact-query'
 *
 * const postsOptions = queryOptions({
 *   queryKey: ['posts'],
 *   queryFn: async () => {
 *     const response = await fetch('https://jsonplaceholder.typicode.com/posts')
 *     return await response.json()
 *   },
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
