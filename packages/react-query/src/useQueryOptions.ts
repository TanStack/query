import type {DefaultedQueryObserverOptions, QueryClient, QueryKey, QueryObserverOptions} from "@tanstack/query-core";
import {useQueryClient} from "./QueryClientProvider";
import type React from "react";
import type { DependencyList } from "react";
import {useMemo} from "react";

export function useQueryOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  callback: () =>
    | QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
    | DefaultedQueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >,
  deps: DependencyList = [],
  context?: React.Context<QueryClient | undefined>,
): DefaultedQueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey> {
  const queryClient = useQueryClient({context})
  return useMemo(() => {
    return queryClient.defaultQueryOptions(callback());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, ...deps]);
}
