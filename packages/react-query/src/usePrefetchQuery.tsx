import { noop } from '@tanstack/query-core'
import { useQueryClient } from './QueryClientProvider'

import type {
  DefaultError,
  QueryClient,
  QueryExecuteOptions,
  QueryKey,
} from '@tanstack/query-core'

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
    void client.query(options).then(noop).catch(noop)
  }
}
