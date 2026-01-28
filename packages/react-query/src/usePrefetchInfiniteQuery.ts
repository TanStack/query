import { useQueryClient } from './QueryClientProvider'
import type {
  FetchInfiniteQueryOptions,
  QueryKey,
  WithRequired,
} from '@tanstack/query-core'

export function usePrefetchInfiniteQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: WithRequired<
    FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    'queryKey'
  >,
) {
  const client = useQueryClient()
  if (!client.getQueryState(options.queryKey)) {
    client.prefetchInfiniteQuery(options)
  }
}
