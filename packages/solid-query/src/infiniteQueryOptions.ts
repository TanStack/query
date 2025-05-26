import type {
  DataTag,
  DefaultError,
  InfiniteData,
  NonUndefinedGuard,
  QueryKey,
} from '@tanstack/query-core'
import type { SolidInfiniteQueryOptions } from './types'
import type { Accessor } from 'solid-js'

export type UndefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = Accessor<
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

export type DefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError = DefaultError,
  // should we handle page param correctly
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = Accessor<
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
