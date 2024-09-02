import { useQueryClient } from "./useQueryClient.js";
import type { DefaultError, FetchQueryOptions, QueryKey } from "@tanstack/query-core";

export function createPrefetchQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(options: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>) {
  const queryClient = useQueryClient()

  if (!queryClient.getQueryState(options.queryKey)) {
    queryClient.prefetchQuery(options)
  }
}
