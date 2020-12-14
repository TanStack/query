import { QueryObserver } from '../core'
import { InfiniteQueryObserver } from '../core/infiniteQueryObserver'
import { QueryFunction, QueryKey } from '../core/types'
import { parseQueryArgs } from '../core/utils'
import { UseInfiniteQueryOptions, UseInfiniteQueryResult } from './types'
import { useBaseQuery } from './useBaseQuery'

// HOOK

export function useInfiniteQuery<
  TData = unknown,
  TError = unknown,
  TQueryFnData = TData
>(
  options: UseInfiniteQueryOptions<TData, TError, TQueryFnData>
): UseInfiniteQueryResult<TData, TError>
export function useInfiniteQuery<
  TData = unknown,
  TError = unknown,
  TQueryFnData = TData
>(
  queryKey: QueryKey,
  options?: UseInfiniteQueryOptions<TData, TError, TQueryFnData>
): UseInfiniteQueryResult<TData, TError>
export function useInfiniteQuery<
  TData = unknown,
  TError = unknown,
  TQueryFnData = TData
>(
  queryKey: QueryKey,
  queryFn: QueryFunction<TQueryFnData | TData>,
  options?: UseInfiniteQueryOptions<TData, TError, TQueryFnData>
): UseInfiniteQueryResult<TData, TError>
export function useInfiniteQuery<TData, TError, TQueryFnData = TData>(
  arg1: QueryKey | UseInfiniteQueryOptions<TData, TError, TQueryFnData>,
  arg2?:
    | QueryFunction<TQueryFnData | TData>
    | UseInfiniteQueryOptions<TData, TError, TQueryFnData>,
  arg3?: UseInfiniteQueryOptions<TData, TError, TQueryFnData>
): UseInfiniteQueryResult<TData, TError> {
  const options = parseQueryArgs(arg1, arg2, arg3)
  return useBaseQuery(
    options,
    InfiniteQueryObserver as typeof QueryObserver
  ) as UseInfiniteQueryResult<TData, TError>
}
