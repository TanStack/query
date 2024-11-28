import type { DataTag, DefaultError, QueryKey } from '@tanstack/query-core'
import type {
  DefinedInitialQueryOptions,
  NonUndefinedGuard,
  UndefinedInitialQueryOptions,
} from './useQuery'
import type { UnwrapRef } from 'vue-demi'

export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UndefinedInitialQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): UnwrapRef<
  UndefinedInitialQueryOptions<TQueryFnData, TError, TData, TQueryKey>
> & {
  queryKey: DataTag<TQueryKey, TQueryFnData>
}

export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: DefinedInitialQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): UnwrapRef<
  DefinedInitialQueryOptions<TQueryFnData, TError, TData, TQueryKey>
> & {
  queryKey: DataTag<TQueryKey, TQueryFnData>
  initialData:
    | NonUndefinedGuard<TQueryFnData>
    | (() => NonUndefinedGuard<TQueryFnData>)
}

export function queryOptions(options: unknown) {
  return options
}
