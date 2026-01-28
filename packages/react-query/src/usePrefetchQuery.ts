import { useQueryClient } from './QueryClientProvider'
import type {
  FetchQueryOptions,
  QueryKey,
  WithRequired,
} from '@tanstack/query-core'

export function usePrefetchQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: WithRequired<
    FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    'queryKey'
  >,
) {
  const client = useQueryClient()
  if (!client.getQueryState(options.queryKey)) {
    client.prefetchQuery(options)
  }
}
