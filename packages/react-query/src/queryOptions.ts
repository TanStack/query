import type {
  DefaultError,
  QueryKey,
  TaggedQueryKey,
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

type ValidateQueryOptions<T> = {
  [K in keyof T]: K extends keyof UseQueryOptions ? T[K] : never
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
>(
  options: ValidateQueryOptions<TOptions>,
): Omit<TOptions, 'queryKey'> & {
  queryKey: TaggedQueryKey<
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
  queryKey: TaggedQueryKey<
    TOptions['queryKey'],
    TOptions['queryFn'] extends () => any
      ? Awaited<ReturnType<NonNullable<TOptions['queryFn']>>>
      : unknown
  >
}

export function queryOptions(options: unknown) {
  return options
}
