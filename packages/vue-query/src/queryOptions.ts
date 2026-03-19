import type { DataTag, DefaultError, QueryKey } from '@tanstack/query-core'
import type {
  DefinedInitialQueryOptions,
  UndefinedInitialQueryOptions,
} from './useQuery'

export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TOptions extends DefinedInitialQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey
  > = DefinedInitialQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
>(
  options: TOptions,
): TOptions & {
  queryKey: DataTag<TQueryKey, TQueryFnData, TError>
}

export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TOptions extends UndefinedInitialQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey
  > = UndefinedInitialQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
>(
  options: TOptions,
): TOptions & {
  queryKey: DataTag<TQueryKey, TQueryFnData, TError>
}

export function queryOptions(options: unknown) {
  return options
}
