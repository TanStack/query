import { useQueryClient } from './QueryClientProvider'
import type {
  DefaultError,
  FetchQueryOptions,
  QueryClient,
  QueryKey,
} from '@tanstack/query-core'

export function usePrefetchQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
) {
  const client = useQueryClient(queryClient)

  if (!client.getQueryState(options.queryKey)) {
    client.prefetchQuery(options)
  }
}
