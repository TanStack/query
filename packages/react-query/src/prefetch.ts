import { useQueryClient } from './QueryClientProvider'
import type { DefaultError, QueryKey } from '@tanstack/query-core'
import type { UseInfiniteQueryOptions, UseQueryOptions } from './types'

export function usePrefetchQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>) {
  const queryClient = useQueryClient()

  if (!queryClient.getQueryState(options.queryKey)) {
    queryClient.ensureQueryData(options).catch(() => {})
  }
}

export function usePrefetchInfiniteQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
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
) {
  const queryClient = useQueryClient()

  if (!queryClient.getQueryState(options.queryKey)) {
    queryClient.ensureInfiniteQueryData(options).catch(() => {})
  }
}
