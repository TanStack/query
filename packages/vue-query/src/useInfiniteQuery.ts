import { InfiniteQueryObserver } from '@tanstack/query-core'
import type {
  QueryObserver,
  WithRequired,
  QueryKey,
  InfiniteQueryObserverResult,
} from '@tanstack/query-core'

import { useBaseQuery } from './useBaseQuery'
import type { UseQueryReturnType } from './useBaseQuery'

import type { VueInfiniteQueryObserverOptions, DistributiveOmit } from './types'
import type { QueryClient } from './queryClient'

export type UseInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = WithRequired<
  VueInfiniteQueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryFnData,
    TQueryKey
  >,
  'queryKey'
>

type InfiniteQueryReturnType<TData, TError> = UseQueryReturnType<
  TData,
  TError,
  InfiniteQueryObserverResult<TData, TError>
>
export type UseInfiniteQueryReturnType<TData, TError> = DistributiveOmit<
  InfiniteQueryReturnType<TData, TError>,
  'fetchNextPage' | 'fetchPreviousPage' | 'refetch'
> & {
  fetchNextPage: InfiniteQueryObserverResult<TData, TError>['fetchNextPage']
  fetchPreviousPage: InfiniteQueryObserverResult<
    TData,
    TError
  >['fetchPreviousPage']
  refetch: InfiniteQueryObserverResult<TData, TError>['refetch']
}

export function useInfiniteQuery<
  TQueryFnData,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): UseInfiniteQueryReturnType<TData, TError> {
  const result = useBaseQuery(
    InfiniteQueryObserver as typeof QueryObserver,
    options,
    queryClient,
  ) as InfiniteQueryReturnType<TData, TError>
  return {
    ...result,
    fetchNextPage: result.fetchNextPage.value,
    fetchPreviousPage: result.fetchPreviousPage.value,
    refetch: result.refetch.value,
  }
}
