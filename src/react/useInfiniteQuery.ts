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
  TData = TQueryFnData
>(
  options: UseInfiniteQueryOptions<TQueryFnData, TError, TData>
): UseInfiniteQueryResult<TData, TError>
export function useInfiniteQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData
>(
  queryKey: QueryKey,
  options?: UseInfiniteQueryOptions<TQueryFnData, TError, TData>
): UseInfiniteQueryResult<TData, TError>
export function useInfiniteQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData
>(
  queryKey: QueryKey,
  queryFn: QueryFunction<TQueryFnData>,
  options?: UseInfiniteQueryOptions<TQueryFnData, TError, TData>
): UseInfiniteQueryResult<TData, TError>
export function useInfiniteQuery<TQueryFnData, TError, TData = TQueryFnData>(
  arg1: QueryKey | UseInfiniteQueryOptions<TQueryFnData, TError, TData>,
  arg2?:
    | QueryFunction<TQueryFnData>
    | UseInfiniteQueryOptions<TQueryFnData, TError, TData>,
  arg3?: UseInfiniteQueryOptions<TQueryFnData, TError, TData>
): UseInfiniteQueryResult<TData, TError> {
  const options = parseQueryArgs(arg1, arg2, arg3)
  return useBaseQuery(
    options,
    InfiniteQueryObserver as typeof QueryObserver
  ) as UseInfiniteQueryResult<TData, TError>
}
