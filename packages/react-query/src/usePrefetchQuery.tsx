import { noop } from '@tanstack/query-core'
import { useQueryClient } from './QueryClientProvider'

import type { DefaultError, QueryClient, QueryKey } from '@tanstack/query-core'
import type { UsePrefetchQueryOptions } from './types'

export function usePrefetchQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UsePrefetchQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >,
  queryClient?: QueryClient,
): void {
  const client = useQueryClient(queryClient)

  if (!client.getQueryState(options.queryKey)) {
    void client.query(options).catch(noop)
  }
}
