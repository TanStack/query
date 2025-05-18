import type {
  InitialDataFunction,
  OmitKeyof,
  QueryKey,
} from '@tanstack/query-core'
import type { UseQueryOptions } from './types'

type UseQueryOptionsOmitted<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = OmitKeyof<
  UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  'onSuccess' | 'onError' | 'onSettled' | 'refetchInterval'
>

type ProhibitedQueryOptionsKeyInV5 = keyof Pick<
  UseQueryOptionsOmitted,
  'useErrorBoundary' | 'suspense' | 'getNextPageParam' | 'getPreviousPageParam'
>

export type UndefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = UseQueryOptionsOmitted<TQueryFnData, TError, TData, TQueryKey> & {
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
> = UseQueryOptionsOmitted<TQueryFnData, TError, TData, TQueryKey> & {
  initialData:
    | NonUndefinedGuard<TQueryFnData>
    | (() => NonUndefinedGuard<TQueryFnData>)
}

export function queryOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: OmitKeyof<
    DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
    ProhibitedQueryOptionsKeyInV5
  >,
): DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>

export function queryOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: OmitKeyof<
    UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
    ProhibitedQueryOptionsKeyInV5
  >,
): UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>

export function queryOptions(options: unknown) {
  return options
}
