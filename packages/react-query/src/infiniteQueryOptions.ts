import type { InfiniteData, TypedQueryKey } from '@tanstack/query-core'
import type { UseInfiniteQueryOptions } from './types'
import type { DefaultError, QueryKey } from '@tanstack/query-core'

export type UndefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = UseInfiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryFnData,
  TQueryKey,
  TPageParam
> & {
  initialData?: undefined
}

type NonUndefinedGuard<T> = T extends undefined ? never : T

export type DefinedInitialDataInfiniteOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = UseInfiniteQueryOptions<
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

type ValidateInfiniteQueryOptions<T> = {
  [K in keyof T]: K extends keyof UseInfiniteQueryOptions ? T[K] : never
}

export function infiniteQueryOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TPageParam = unknown,
>(
  options: ValidateInfiniteQueryOptions<
    UndefinedInitialDataInfiniteOptions<
      TQueryFnData,
      TError,
      TData,
      QueryKey,
      TPageParam
    >
  >,
): Omit<
  UndefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    QueryKey,
    TPageParam
  >,
  'queryKey'
> & {
  queryKey: TypedQueryKey<InfiniteData<TQueryFnData> | undefined>
}

export function infiniteQueryOptions<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TPageParam = unknown,
>(
  options: ValidateInfiniteQueryOptions<
    DefinedInitialDataInfiniteOptions<
      TQueryFnData,
      TError,
      TData,
      QueryKey,
      TPageParam
    >
  >,
): Omit<
  DefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    QueryKey,
    TPageParam
  >,
  'queryKey'
> & {
  queryKey: TypedQueryKey<InfiniteData<TQueryFnData>>
}

export function infiniteQueryOptions(options: unknown) {
  return options
}
