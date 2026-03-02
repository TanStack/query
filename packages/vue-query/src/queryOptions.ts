import type { DataTag, DefaultError, QueryKey } from '@tanstack/query-core'
import type {
  DefinedInitialQueryOptions,
  DefinedInitialQueryOptionsBase,
  DefinedInitialQueryOptionsRef,
  UndefinedInitialQueryOptions,
  UndefinedInitialQueryOptionsBase,
  UndefinedInitialQueryOptionsRef,
} from './useQuery'

export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TOptions = DefinedInitialQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  TReturnQueryKey = {
    queryKey: DataTag<TQueryKey, TQueryFnData, TError>
  },
>(
  options: TOptions,
): TOptions extends { value: unknown }
  ? DefinedInitialQueryOptionsRef<TQueryFnData, TError, TData, TQueryKey> &
      TOptions
  : DefinedInitialQueryOptionsBase<TQueryFnData, TError, TData, TQueryKey> &
      TOptions

export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TOptions = UndefinedInitialQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey
  >,
>(
  options: TOptions,
): TOptions extends { value: unknown }
  ? UndefinedInitialQueryOptionsRef<TQueryFnData, TError, TData, TQueryKey> &
      TOptions
  : UndefinedInitialQueryOptionsBase<TQueryFnData, TError, TData, TQueryKey> &
      TOptions

export function queryOptions(options: unknown) {
  return options
}
