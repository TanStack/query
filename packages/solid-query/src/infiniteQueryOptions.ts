import type {
  DataTag,
  DefaultError,
  InfiniteData,
  NonUndefinedGuard,
  QueryKey,
} from '@tanstack/query-core'
import type { InfiniteQueryOptions } from './types'
import type { Accessor } from 'solid-js'

export type UndefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = Accessor<
  InfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & {
    initialData?: undefined
  }
>

export type DefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError = DefaultError,
  // should we handle page param correctly
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = Accessor<
  InfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & {
    initialData:
      | NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>
      | (() => NonUndefinedGuard<InfiniteData<TQueryFnData, TPageParam>>)
  }
>

export type DefinedInitialDataInfiniteOptionsResult<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = ReturnType<
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

export type UndefinedInitialDataInfiniteOptionsResult<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = ReturnType<
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
): DefinedInitialDataInfiniteOptionsResult<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
>
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
): UndefinedInitialDataInfiniteOptionsResult<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
>

export function infiniteQueryOptions(options: unknown) {
  return options
}
