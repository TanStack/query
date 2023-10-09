import type {
  DefaultError,
  QueryKey,
  TypedQueryKey,
} from '@tanstack/query-core'
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
>(
  options: ValidateQueryOptions<
    UndefinedInitialDataOptions<TQueryFnData, TError, TData, QueryKey>
  >,
): Omit<
  UndefinedInitialDataOptions<TQueryFnData, TError, TData, QueryKey>,
  'queryKey'
> & {
  queryKey: TypedQueryKey<TQueryFnData | undefined>
}

export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
>(
  options: ValidateQueryOptions<
    DefinedInitialDataOptions<TQueryFnData, TError, TData, QueryKey>
  >,
): Omit<
  DefinedInitialDataOptions<TQueryFnData, TError, TData, QueryKey>,
  'queryKey'
> & {
  queryKey: TypedQueryKey<TQueryFnData>
}

export function queryOptions(options: unknown) {
  return options
}
