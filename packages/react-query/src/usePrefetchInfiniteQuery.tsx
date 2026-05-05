import { noop } from '@tanstack/query-core'
import { useQueryClient } from './QueryClientProvider'

import type {
  DefaultError,
  InfiniteQueryExecuteOptions,
  QueryClient,
  QueryKey,
} from '@tanstack/query-core'

export function usePrefetchInfiniteQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: InfiniteQueryExecuteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  queryClient?: QueryClient,
) {
  const client = useQueryClient(queryClient)

  if (!client.getQueryState(options.queryKey)) {
    void client.infiniteQuery(options).then(noop).catch(noop)
  }
}
