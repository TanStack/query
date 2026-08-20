import { noop } from '@tanstack/query-core'
import { useQueryClient } from './QueryClientProvider'

import type {
  DefaultError,
  InfiniteData,
  QueryClient,
  QueryKey,
} from '@tanstack/query-core'
import type { UsePrefetchInfiniteQueryOptions } from './types'

export function usePrefetchInfiniteQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: UsePrefetchInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  queryClient?: QueryClient,
): void {
  const client = useQueryClient(queryClient)

  if (!client.getQueryState(options.queryKey)) {
    void client.infiniteQuery(options).catch(noop)
  }
}
