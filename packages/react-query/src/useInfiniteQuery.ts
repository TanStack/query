import type { QueryObserver, QueryKey, QueryClient } from '@tanstack/query-core'
import { InfiniteQueryObserver } from '@tanstack/query-core'
import type { UseInfiniteQueryOptions, UseInfiniteQueryResult } from './types'
import { useBaseQuery } from './useBaseQuery'

// HOOK
export function useInfiniteQuery<
  TQueryFnData,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryFnData,
    TQueryKey
  >,
  queryClient?: QueryClient,
): UseInfiniteQueryResult<TData, TError> {
  return useBaseQuery(
    options,
    InfiniteQueryObserver as typeof QueryObserver,
    queryClient,
  ) as UseInfiniteQueryResult<TData, TError>
}
