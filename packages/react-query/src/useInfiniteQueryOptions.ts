import type {InfiniteQueryObserverOptions, QueryClient, QueryKey} from "@tanstack/query-core";
import type React from "react";
import type { DependencyList } from "react";
import {useQueryOptions} from "./useQueryOptions";

export function useInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  callback: () => InfiniteQueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >,
  deps: DependencyList = [],
  context?: React.Context<QueryClient | undefined>,
): InfiniteQueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey> {
  return useQueryOptions(callback, deps, context);
}
