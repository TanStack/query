// Type definitions for react-query 0.3
// Project: https://github.com/tannerlinsley/react-query
// Definitions by: Lukasz Fiszer <https://github.com/lukaszfiszer>
//                 Jace Hensley <https://github.com/jacehensley>
//                 Matteo Frana <https://github.com/matteofrana>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

import { ComponentType } from "react";

export function useInfiniteQuery<TResult, TVariables extends object>(
  queryKey: QueryKey<TVariables>,
  queryFn: QueryFunctionInfinte<TResult, TVariables>,
  options: QueryOptionsInfinite<TResult>
): QueryResultInfinite<TResult, TVariables>;

// overloaded useQuery function with pagination
export function usePaginatedQuery<TResult, TVariables extends object>(
  queryKey: QueryKey<TVariables>,
  queryFn: QueryFunction<TResult, TVariables>,
  options: QueryOptions<TResult>
): QueryResultPaginated<TResult, TVariables>;

export function useQuery<TResult, TVariables extends object>(
  queryKey: QueryKey<TVariables>,
  queryFn: QueryFunction<TResult, TVariables>,
  options?: QueryOptions<TResult>
): QueryResult<TResult, TVariables>;

export type QueryKey<TVariables> =
  | string
  | [string, TVariables]
  | false
  | null
  | QueryKeyFunction<TVariables>;
export type QueryKeyFunction<TVariables> = () =>
  | string
  | [string, TVariables]
  | false
  | null;

export type QueryFunction<TResult, TVariables extends object> = (
  queryKey: string,
  variables: TVariables
) => Promise<TResult>;
export type QueryFunctionInfinte<TResult, TVariables extends object> = (
  queryKey: string,
  variables: TVariables,
  fetchMoreVariable: any[]
) => Promise<TResult>;

export interface QueryOptions<TResult> {
  manual?: boolean;
  retry?: boolean | number;
  retryDelay?: (retryAttempt: number) => number;
  staleTime?: number;
  cacheTime?: number;
  refetchInterval?: false | number;
  refetchIntervalInBackground?: boolean;
  refetchOnWindowFocus?: boolean;
  onError?: (err: any) => void;
  onSuccess?: (data: TResult) => void;
  onSettled?: (data: TResult, error: any) => void;
  suspense?: boolean;
  initialData?: TResult | (() => TResult);
  refetchOnMount?: boolean;
}

export interface QueryOptionsInfinite<TResult> extends QueryOptions<TResult> {
  getFetchMore?: (lastPage: any, allPages: any[]) => any;
}

export interface QueryResult<TResult, TVariables> {
  data: undefined | TResult;
  error: undefined | Error;
  status: "loading" | "success" | "error";
  isFetching: boolean;
  failureCount: number;
  refetch: (arg?: {
    variables?: TVariables;
    force?: boolean;
    throwOnError?: boolean;
  }) => Promise<void>;
}

export interface QueryResultInfinite<TResult, TVariables>
  extends QueryResult<TResult, TVariables> {
  fetchMore: (variables: TVariables) => Promise<any>;
  isFetchingMore: boolean;
  canFetchMore: boolean;
}

export interface QueryResultPaginated<TResult, TVariables>
  extends QueryResult<TResult[], TVariables> {
  resolvedData: TResult;
  latestData: TResult;
}

export function prefetchQuery<TResult, TVariables extends object>(
  queryKey: QueryKey<TVariables>,
  queryFn: QueryFunction<TResult, TVariables>,
  options?: PrefetchQueryOptions<TResult>
): Promise<TResult>;

export interface PrefetchQueryOptions<TResult> extends QueryOptions<TResult> {
  force?: boolean;
}

export function useMutation<TResult, TVariables extends object>(
  mutationFn: MutationFunction<TResult, TVariables>,
  mutationOptions?: MutationOptions<TResult> & { useErrorBoundary?: boolean; }
): [MutateFunction<TResult, TVariables>, MutationResult<TResult>];

export type MutationFunction<TResult, TVariables extends object> = (
  variables: TVariables,
  options: MutationOptions<TResult>
) => Promise<TResult>;

export interface MutationOptions<TResult> {
  onError?: (err: any) => void;
  onSuccess?: (data: TResult) => void;
  throwOnError?: boolean;
  onSettled?: (data: TResult, error: any) => void;
}

export type MutateFunction<TResults, TVariables extends object> = (
  variables?: TVariables,
  options?: {
    updateQuery?: string | [string, object];
    waitForRefetchQueries?: boolean;
  }
) => Promise<TResults>;

export interface MutationResult<TResults> {
  data: TResults | null;
  error: null | Error;
  promise: Promise<TResults>;
  status: "loading" | "success" | "error" | "idle";
}

export type QueryObject = any;

export interface QueryCache<TResult, TVariables extends object, TCache> {

  prefetchQuery: (
    queryKey: QueryKey<TVariables>,
    queryFn: QueryFunction<TResult, TVariables>,
    options?: QueryOptions<TResult> & { throwOnError?: boolean }
  ) => Promise<TResult | undefined>;

  getQueryData: (key: QueryKey<TVariables>) => TResult | undefined;

  setQueryData: (
    key: QueryKey<TVariables>,
    updater: TResult | ((oldData: TResult) => TResult)
  ) => TResult | undefined;

  refetchQueries: (
    queryKeyOrPredicateFn:
      | QueryKey<TVariables>
      | ((query: QueryObject) => boolean),
    config: {
        exact?: boolean;
        throwOnError?: boolean;
        force?: boolean;
    }
  ) => Promise<any>;

  removeQueries: (
    queryKeyOrPredicateFn:
      | QueryKey<TVariables>
      | ((query: QueryObject) => boolean),
    config: {
        exact?: boolean;
    }
  ) => void;

  getQuery: (key: QueryKey<TVariables>) => QueryObject;

  isFetching: boolean;

  subscribe: (cb: (cache: TCache) => void) => () => void;

  clear: () => QueryObject[];
}

export function useIsFetching(): boolean;

export const ReactQueryConfigProvider: React.ComponentType<{
  config?: ReactQueryProviderConfig;
}>;

export interface ReactQueryProviderConfig {
  suspense: boolean;
  useErrorBoundary: boolean; // Defaults to the value of `suspense` if not defined otherwise
  throwOnError: boolean;
  refetchAllOnWindowFocus: boolean;
  queryKeySerializerFn: (queryKey: QueryKey<any>) => [string, any];
  onSuccess: () => {};
  onError: () => {};
  onSettled: () => {};

  retry?: boolean | number;
  retryDelay?: (retryAttempt: number) => number;
  staleTime?: number;
  cacheTime?: number;
  refetchInterval?: false | number;
  refetchOnMount: boolean;
}
