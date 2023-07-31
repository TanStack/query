import type { InfiniteData } from '@tanstack/query-core'
import type { UseInfiniteQueryOptions } from './types'
import type { DefaultError, QueryKey } from '@tanstack/query-core'

export type UndefinedInitialDataInfiniteOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = UseInfiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey,
  TPageParam
> & {
  initialData?: undefined
}

export type DefinedInitialDataInfiniteOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = UseInfiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey,
  TPageParam
> & {
  initialData:
    | InfiniteData<TQueryData, TPageParam>
    | (() => InfiniteData<TQueryData, TPageParam>)
}

export function infiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: UndefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryFnData,
    TQueryKey,
    TPageParam
  >,
): UndefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryFnData,
  TQueryKey,
  TPageParam
>

export function infiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: DefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryFnData,
    TQueryKey,
    TPageParam
  >,
): DefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryFnData,
  TQueryKey,
  TPageParam
>

export function infiniteQueryOptions(options: unknown) {
  return options
}
