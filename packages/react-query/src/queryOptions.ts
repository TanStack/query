import type { DataTag, DefaultError, QueryKey } from '@tanstack/query-core'
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
>(
  options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
): UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & {
  queryKey: TypedQueryKey<TQueryFnData>
}

export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: ValidateQueryOptions<TOptions>,
): Omit<TOptions, 'queryKey'> & {
  queryKey: DataTag<
    TOptions['queryKey'],
    TOptions['queryFn'] extends () => any
      ? Awaited<ReturnType<NonNullable<TOptions['queryFn']>>>
      : unknown
  >
}

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
>(
  options: ValidateQueryOptions<TOptions>,
): Omit<TOptions, 'queryKey'> & {
  queryKey: DataTag<
    TOptions['queryKey'],
    TOptions['queryFn'] extends () => any
      ? Awaited<ReturnType<NonNullable<TOptions['queryFn']>>>
      : unknown
  >
}

export function queryOptions(options: unknown) {
  return options
}
