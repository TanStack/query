'use client'
import { InfiniteQueryObserver } from '@tanstack/query-core'
import { useBaseQuery } from './useBaseQuery'
import type {
  DefaultError,
  InfiniteData,
  QueryClient,
  QueryKey,
  QueryObserver,
} from '@tanstack/query-core'
import type { UseInfiniteQueryOptions, UseInfiniteQueryResult } from './types'

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
    TQueryFnData,
    TQueryKey,
    TPageParam
  >,
  queryClient?: QueryClient,
): UseInfiniteQueryResult<TData, TError> {
  return useBaseQuery(
    options,
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    InfiniteQueryObserver as typeof QueryObserver,
    queryClient,
  ) as UseInfiniteQueryResult<TData, TError>
}
