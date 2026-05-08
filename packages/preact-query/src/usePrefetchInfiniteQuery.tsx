import { noop } from '@tanstack/query-core'
import type {
  DefaultError,
  QueryClient,
  QueryKey,
  InfiniteQueryExecuteOptions,
} from '@tanstack/query-core'

import { useQueryClient } from './QueryClientProvider'

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
