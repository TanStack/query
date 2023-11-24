import type {
  DefaultError,
  DehydratedState,
  QueryKey,
} from '@tanstack/query-core'
import type {
  DefinedInitialDataOptions,
  UndefinedInitialDataOptions,
} from './queryOptions'
import type {
  DefinedUseQueryResult,
  UseQueryOptions
} from './types'
import { ObserverType, useBaseQuery } from './useBaseQuery'

export function useQuery(
  /*<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>*/
  options: any /*UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,*/,
  initialState?: DehydratedState,
): any /*UseQueryResult<
  TData,
  TError,
  UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
>;*/

export function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
  initialState?: DehydratedState,
): DefinedUseQueryResult<
  TData,
  TError,
  UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
>

export function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  initialState?: DehydratedState,
): any
/*UseQueryResult<
  TData,
  TError,
  UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
>*/

export function useQuery(
  options: UseQueryOptions,
  initialState?: DehydratedState,
) {
  return useBaseQuery(ObserverType.base, options, initialState)
}
