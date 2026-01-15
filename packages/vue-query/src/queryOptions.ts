import type {
  DataTag,
  DefaultError,
  InitialDataFunction,
  NonUndefinedGuard,
  QueryKey,
  QueryObserverOptions,
} from '@tanstack/query-core'
import type { DeepUnwrapRef, ShallowOption } from './types'

/**
 * Options for queryOptions with defined initial data.
 * These are unwrapped types (not MaybeRef) so that properties like queryFn are directly accessible.
 */
export type DefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = QueryObserverOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryFnData,
  DeepUnwrapRef<TQueryKey>
> &
  ShallowOption & {
    initialData:
      | NonUndefinedGuard<TQueryFnData>
      | (() => NonUndefinedGuard<TQueryFnData>)
  }

/**
 * Options for queryOptions with undefined initial data.
 * These are unwrapped types (not MaybeRef) so that properties like queryFn are directly accessible.
 */
export type UndefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = QueryObserverOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryFnData,
  DeepUnwrapRef<TQueryKey>
> &
  ShallowOption & {
    initialData?:
      | undefined
      | InitialDataFunction<NonUndefinedGuard<TQueryFnData>>
      | NonUndefinedGuard<TQueryFnData>
  }

export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
): DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & {
  queryKey: DataTag<TQueryKey, TQueryFnData, TError>
}

export function queryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
): UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> & {
  queryKey: DataTag<TQueryKey, TQueryFnData, TError>
}

export function queryOptions(options: unknown) {
  return options
}
