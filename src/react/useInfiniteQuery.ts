import { QueryObserver } from '../core'
import { InfiniteQueryObserver } from '../core/infiniteQueryObserver'
import { QueryFunction, QueryKey } from '../core/types'
import { parseQueryArgs } from '../core/utils'
import { UseInfiniteQueryOptions, UseInfiniteQueryResult } from './types'
import { useBaseQuery } from './useBaseQuery'

// HOOK

export function useInfiniteQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  SData = unknown,
  TQueryKey extends QueryKey = QueryKey
>(
  options: UseInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryFnData,
    SData,
    TQueryKey
  >
): UseInfiniteQueryResult<TData, TError, SData>
export function useInfiniteQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  SData = unknown,
  TQueryKey extends QueryKey = QueryKey
>(
  queryKey: TQueryKey,
  options?: Omit<
    UseInfiniteQueryOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryFnData,
      SData,
      TQueryKey
    >,
    'queryKey'
  >
): UseInfiniteQueryResult<TData, TError, SData>
export function useInfiniteQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  SData = unknown,
  TQueryKey extends QueryKey = QueryKey
>(
  queryKey: TQueryKey,
  queryFn: QueryFunction<TQueryFnData, TQueryKey>,
  options?: Omit<
    UseInfiniteQueryOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryFnData,
      SData,
      TQueryKey
    >,
    'queryKey' | 'queryFn'
  >
): UseInfiniteQueryResult<TData, TError, SData>
export function useInfiniteQuery<
  TQueryFnData,
  TError,
  TData = TQueryFnData,
  SData = unknown,
  TQueryKey extends QueryKey = QueryKey
>(
  arg1:
    | TQueryKey
    | UseInfiniteQueryOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryFnData,
        SData,
        TQueryKey
      >,
  arg2?:
    | QueryFunction<TQueryFnData, TQueryKey>
    | UseInfiniteQueryOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryFnData,
        SData,
        TQueryKey
      >,
  arg3?: UseInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryFnData,
    SData,
    TQueryKey
  >
): UseInfiniteQueryResult<TData, TError, SData> {
  const options = parseQueryArgs(arg1, arg2, arg3)
  return useBaseQuery(
    options,
    InfiniteQueryObserver as typeof QueryObserver
  ) as UseInfiniteQueryResult<TData, TError, SData>
}
