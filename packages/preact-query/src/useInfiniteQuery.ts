import { InfiniteQueryObserver } from '@tanstack/query-core'
import type {
  DefaultError,
  InfiniteData,
  QueryClient,
  QueryKey,
  QueryObserver,
} from '@tanstack/query-core'

import type {
  DefinedInitialDataInfiniteOptions,
  UndefinedInitialDataInfiniteOptions,
} from './infiniteQueryOptions'
import type {
  DefinedUseInfiniteQueryResult,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
} from './types'
import { useBaseQuery } from './useBaseQuery'

/**
 * The options for `useInfiniteQuery` are identical to `useQuery`, with the addition of `queryFn`,
 * `initialPageParam`, `getNextPageParam`, `getPreviousPageParam`, and `maxPages`.
 *
 * @param queryClient - Use this to use a custom QueryClient. Otherwise, the one from the nearest context will
 * be used.
 * @returns The same properties as `useQuery`, with the addition of `data.pages`, `data.pageParams`,
 * `fetchNextPage`, `fetchPreviousPage`, `hasNextPage`, `hasPreviousPage`, `isFetchingNextPage`, and
 * `isFetchingPreviousPage`.
 */
export function useInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: DefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  queryClient?: QueryClient,
): DefinedUseInfiniteQueryResult<TData, TError>

/**
 * The options for `useInfiniteQuery` are identical to `useQuery`, with the addition of `queryFn`,
 * `initialPageParam`, `getNextPageParam`, `getPreviousPageParam`, and `maxPages`.
 *
 * @param queryClient - Use this to use a custom QueryClient. Otherwise, the one from the nearest context will
 * be used.
 * @returns The same properties as `useQuery`, with the addition of `data.pages`, `data.pageParams`,
 * `fetchNextPage`, `fetchPreviousPage`, `hasNextPage`, `hasPreviousPage`, `isFetchingNextPage`, and
 * `isFetchingPreviousPage`.
 */
export function useInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: UndefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  queryClient?: QueryClient,
): UseInfiniteQueryResult<TData, TError>

/**
 * The options for `useInfiniteQuery` are identical to `useQuery`, with the addition of `queryFn`,
 * `initialPageParam`, `getNextPageParam`, `getPreviousPageParam`, and `maxPages`.
 *
 * @param queryClient - Use this to use a custom QueryClient. Otherwise, the one from the nearest context will
 * be used.
 * @returns The same properties as `useQuery`, with the addition of `data.pages`, `data.pageParams`,
 * `fetchNextPage`, `fetchPreviousPage`, `hasNextPage`, `hasPreviousPage`, `isFetchingNextPage`, and
 * `isFetchingPreviousPage`.
 *
 * Keep in mind that imperative fetch calls, such as `fetchNextPage`, may interfere with the default refetch
 * behaviour, resulting in outdated data. Make sure to call these functions only in response to user actions,
 * or add conditions like `hasNextPage && !isFetching`.
 *
 * @example
 * ```tsx
 * import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/preact-query'
 *
 * const projectsOptions = infiniteQueryOptions({
 *   queryKey: ['projects'],
 *   queryFn: ({ pageParam }) => fetchProjects(pageParam),
 *   initialPageParam: 0,
 *   getNextPageParam: (lastPage) => lastPage.nextId,
 * })
 *
 * function Projects() {
 *   const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
 *     useInfiniteQuery(projectsOptions)
 *
 *   return (
 *     <button
 *       onClick={() => fetchNextPage()}
 *       disabled={!hasNextPage || isFetchingNextPage}
 *     >
 *       Load More
 *     </button>
 *   )
 * }
 * ```
 */
export function useInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: UseInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  queryClient?: QueryClient,
): UseInfiniteQueryResult<TData, TError>

export function useInfiniteQuery(
  options: UseInfiniteQueryOptions,
  queryClient?: QueryClient,
) {
  return useBaseQuery(
    options,
    InfiniteQueryObserver as typeof QueryObserver,
    queryClient,
  )
}
