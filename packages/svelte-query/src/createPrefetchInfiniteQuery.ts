import { useQueryClient } from "./useQueryClient.js";
import type { DefaultError, FetchInfiniteQueryOptions, QueryKey } from "@tanstack/query-core";

export function createPrefetchInfiniteQuery<
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
