import type {
  InitialDataFunction,
  QueryFunction,
  QueryKey,
} from '@tanstack/query-core'
import type { UseQueryOptions } from './types'

export type UndefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
  initialData?:
    | undefined
    | InitialDataFunction<NonUndefinedGuard<TQueryFnData>>
    | NonUndefinedGuard<TQueryFnData>
}

type NonUndefinedGuard<T> = T extends undefined ? never : T

export type DefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryFn'> & {
  initialData:
    | NonUndefinedGuard<TQueryFnData>
    | (() => NonUndefinedGuard<TQueryFnData>)
  queryFn?: QueryFunction<TQueryFnData, TQueryKey>
}

export function queryOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
): DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & {
  queryKey: TQueryKey
}

export function queryOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
): UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & {
  queryKey: TQueryKey
}

export function queryOptions(options: unknown) {
  return options
}
