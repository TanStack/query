import type { DefaultError, QueryKey } from '@tanstack/query-core'
import type { UseQueryOptions } from './types'

export type UndefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
  initialData?: undefined
}

type NonUndefinedGuard<T> = T extends undefined ? never : T

export type DefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
  initialData:
    | NonUndefinedGuard<TQueryFnData>
    | (() => NonUndefinedGuard<TQueryFnData>)
}

export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TOptions extends UndefinedInitialDataOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey
  > = UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
>(options: TOptions): TOptions

export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TOptions extends DefinedInitialDataOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey
  > = DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
>(options: TOptions): TOptions

export function queryOptions(options: unknown) {
  return options
}
