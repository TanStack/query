import { noop } from '@tanstack/query-core'
import type {
  DefaultError,
  QueryClient,
  QueryKey,
  QueryExecuteOptions,
} from '@tanstack/query-core'

import { useQueryClient } from './QueryClientProvider'

export function usePrefetchQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: QueryExecuteOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
) {
  const client = useQueryClient(queryClient)

  if (!client.getQueryState(options.queryKey)) {
    void client.fetchQuery(options).then(noop).catch(noop)
  }
}
