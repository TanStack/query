import type {
  DataTag,
  DefaultError,
  InfiniteData,
  QueryKey,
} from '@tanstack/query-core'
import type { FunctionedParams, SolidInfiniteQueryOptions } from './types'

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
    initialData?: undefined
  }
>

type NonUndefinedGuard<T> = T extends undefined ? never : T

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
      | (() => NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>)
  }
>
export function infiniteQueryOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
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
  queryKey: DataTag<TQueryKey, InfiniteData<TQueryFnData>>
}
export function infiniteQueryOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
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
  queryKey: DataTag<TQueryKey, InfiniteData<TQueryFnData>>
}

export function infiniteQueryOptions(options: unknown) {
  return options
}
