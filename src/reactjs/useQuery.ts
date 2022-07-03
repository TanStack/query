import { QueryObserver } from '../core'
import { QueryFunction, QueryKey } from '../core/types'
import { parseQueryArgs } from '../core/utils'
import {
  UseQueryOptions,
  UseQueryResultWithOptions,
  UseQueryOptionsInitialDataDefined,
} from './types'
import { useBaseQuery } from './useBaseQuery'

// HOOK

export function useQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TQueryOpts extends UseQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey
  > = UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>
>(
  options: TQueryOpts
): UseQueryResultWithOptions<TQueryOpts, TQueryFnData, TError, TData, TQueryKey>

export function useQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TQueryOpts extends Omit<
    UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    'queryKey'
  > = Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey'>
>(
  queryKey: TQueryKey,
  options?: Omit<TQueryOpts, 'queryKey'>
): UseQueryResultWithOptions<
  TQueryOpts,
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  Omit<
    UseQueryOptionsInitialDataDefined<TQueryFnData, TError, TData, TQueryKey>,
    'queryKey'
  >
>

export function useQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TQueryOpts extends Omit<
    UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    'queryKey' | 'queryFn'
  > = Omit<
    UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    'queryKey' | 'queryFn'
  >
>(
  queryKey: TQueryKey,
  queryFn: QueryFunction<TQueryFnData, TQueryKey>,
  options?: TQueryOpts
): UseQueryResultWithOptions<
  TQueryOpts,
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  Omit<
    UseQueryOptionsInitialDataDefined<TQueryFnData, TError, TData, TQueryKey>,
    'queryKey' | 'queryFn'
  >
>

export function useQuery<
  TQueryFnData,
  TError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TQueryOpts extends UseQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey
  > = UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>
>(
  arg1: TQueryKey | TQueryOpts,
  arg2?: QueryFunction<TQueryFnData, TQueryKey> | TQueryOpts,
  arg3?: TQueryOpts
): UseQueryResultWithOptions<
  TQueryOpts,
  TQueryFnData,
  TError,
  TData,
  TQueryKey
> {
  const parsedOptions = parseQueryArgs(arg1, arg2, arg3)
  return useBaseQuery(
    parsedOptions,
    QueryObserver
  ) as UseQueryResultWithOptions<
    TQueryOpts,
    TQueryFnData,
    TError,
    TData,
    TQueryKey
  >
}
