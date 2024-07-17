import { useQueryClient } from './QueryClientProvider'
import type {
  DefaultError,
  FetchInfiniteQueryOptions,
  FetchQueryOptions,
  QueryKey,
} from '@tanstack/query-core'

export function usePrefetchQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(options: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>) {
  const queryClient = useQueryClient()

  if (!queryClient.getQueryState(options.queryKey)) {
    queryClient.prefetchQuery(options)
  }
}

export function usePrefetchInfiniteQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: FetchInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
) {
  const queryClient = useQueryClient()

  if (!queryClient.getQueryState(options.queryKey)) {
    queryClient.prefetchInfiniteQuery(options)
  }
}
