import type { DataTag, DefaultError, QueryKey } from '@tanstack/query-core'
import type { FunctionedParams, SolidQueryOptions } from './types'

export type UndefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = FunctionedParams<
  SolidQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
    initialData?: undefined
  }
>

export type DefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = FunctionedParams<
  SolidQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
    initialData: TQueryFnData | (() => TQueryFnData)
  }
>

export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TOptions extends ReturnType<
    UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
  > = ReturnType<
    UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
  >,
>(
  options: ReturnType<
    UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
  >,
): ReturnType<
  UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
> & {
  queryKey: DataTag<TQueryKey, TQueryFnData>
}

export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TOptions extends ReturnType<
    DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
  > = ReturnType<
    DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
  >,
>(
  options: ReturnType<
    DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
  >,
): ReturnType<
  DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
> & {
  queryKey: DataTag<TQueryKey, TQueryFnData>
}

export function queryOptions(options: unknown) {
  return options
}
