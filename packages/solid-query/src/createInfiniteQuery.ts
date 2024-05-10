import { InfiniteQueryObserver } from "@tanstack/query-core";
import { createMemo } from "solid-js";
import { createBaseQuery } from "./createBaseQuery";
import type {
  DataTag,
  DefaultError,
  InfiniteData,
  QueryKey,
  QueryObserver,
} from "@tanstack/query-core";
import type { QueryClient } from "./QueryClient";
import type {
  CreateInfiniteQueryOptions,
  CreateInfiniteQueryResult,
  DefinedCreateInfiniteQueryResult,
  FunctionedParams,
  SolidInfiniteQueryOptions,
} from "./types";
import type { Accessor } from "solid-js";

export type UndefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = FunctionedParams<
  SolidInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryFnData,
    TQueryKey,
    TPageParam
  > & {
    initialData?: undefined;
  }
>;
type NonUndefinedGuard<T> = T extends undefined ? never : T;
export type DefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError = DefaultError,
  // should we handle page param correctly
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = FunctionedParams<
  SolidInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryFnData,
    TQueryKey,
    TPageParam
  > & {
    initialData:
      | NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>
      | (() => NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>);
  }
>;
function infiniteQueryOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
  // I do not see any sense in this param
  TOptions extends ReturnType<
    DefinedInitialDataInfiniteOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >
  > = ReturnType<
    DefinedInitialDataInfiniteOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >
  >,
>(
  options: ReturnType<
    DefinedInitialDataInfiniteOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >
  >,
): ReturnType<
  DefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >
> & {
  queryKey: DataTag<TQueryKey, InfiniteData<TQueryFnData>>;
};
function infiniteQueryOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
  // I do not see any sense in this param
  TOptions extends ReturnType<
    UndefinedInitialDataInfiniteOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >
  > = ReturnType<
    UndefinedInitialDataInfiniteOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >
  >,
>(
  options: ReturnType<
    UndefinedInitialDataInfiniteOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >
  >,
): ReturnType<
  UndefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >
> & {
  queryKey: DataTag<TQueryKey, InfiniteData<TQueryFnData>>;
};

function infiniteQueryOptions(options: unknown) {
  return options;
}

export { infiniteQueryOptions };

export function createInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: DefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  queryClient?: Accessor<QueryClient>,
): DefinedCreateInfiniteQueryResult<TData, TError>;
export function createInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: UndefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  queryClient?: Accessor<QueryClient>,
): CreateInfiniteQueryResult<TData, TError>;

export function createInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: CreateInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  queryClient?: Accessor<QueryClient>,
): CreateInfiniteQueryResult<TData, TError> {
  return createBaseQuery(
    createMemo(() => options()),
    InfiniteQueryObserver as typeof QueryObserver,
    queryClient,
  ) as CreateInfiniteQueryResult<TData, TError>;
}
