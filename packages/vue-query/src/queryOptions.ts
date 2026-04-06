import type {
  DataTag,
  DefaultError,
  QueryFunction,
  QueryKey,
} from '@tanstack/query-core'
import type {
  DefinedInitialQueryOptions,
  UndefinedInitialQueryOptions,
} from './useQuery'
import type { DeepUnwrapRef } from './types'

/**
 * Augmented version of UndefinedInitialQueryOptions that explicitly exposes
 * queryFn and other properties for direct TypeScript access.
 */
export type UndefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = UndefinedInitialQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
  queryKey: TQueryKey
  queryFn?: QueryFunction<TQueryFnData, DeepUnwrapRef<TQueryKey>>
}

/**
 * Augmented version of DefinedInitialQueryOptions that explicitly exposes
 * queryFn and other properties for direct TypeScript access.
 */
export type DefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = DefinedInitialQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
  queryKey: TQueryKey
  queryFn?: QueryFunction<TQueryFnData, DeepUnwrapRef<TQueryKey>>
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
