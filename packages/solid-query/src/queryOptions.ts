import type { DataTag, DefaultError, QueryKey } from '@tanstack/query-core'
import type { QueryOptions } from './types'
import type { Accessor } from 'solid-js'

export type UndefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = Accessor<
  QueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
    initialData?: undefined
  }
>

export type DefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = Accessor<
  QueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
    initialData: TQueryFnData | (() => TQueryFnData)
  }
>

export type UndefinedInitialDataOptionsResult<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = ReturnType<
  UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
> & {
  queryKey: DataTag<TQueryKey, TQueryFnData, TError>
}

export type DefinedInitialDataOptionsResult<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = ReturnType<
  DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
> & {
  queryKey: DataTag<TQueryKey, TQueryFnData, TError>
}

export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: ReturnType<
    UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
  >,
): UndefinedInitialDataOptionsResult<TQueryFnData, TError, TData, TQueryKey>

export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: ReturnType<
    DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
  >,
): DefinedInitialDataOptionsResult<TQueryFnData, TError, TData, TQueryKey>

export function queryOptions(options: unknown) {
  return options
}
