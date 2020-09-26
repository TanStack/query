import { QueryFunction, QueryKey } from '../core/types'
import { parseQueryArgs } from '../core/utils'
import { UseInfiniteQueryOptions, UseInfiniteQueryResult } from './types'
import { useBaseQuery } from './useBaseQuery'

// HOOK

export function useInfiniteQuery<
  TData = unknown,
  TError = unknown,
  TQueryFnData = TData,
  TQueryData = TQueryFnData[]
>(
  options: UseInfiniteQueryOptions<TData, TError, TQueryFnData, TQueryData>
): UseInfiniteQueryResult<TData, TError>
export function useInfiniteQuery<
  TData = unknown,
  TError = unknown,
  TQueryFnData = TData,
  TQueryData = TQueryFnData[]
>(
  queryKey: QueryKey,
  options?: UseInfiniteQueryOptions<TData, TError, TQueryFnData, TQueryData>
): UseInfiniteQueryResult<TData, TError>
export function useInfiniteQuery<
  TData = unknown,
  TError = unknown,
  TQueryFnData = TData,
  TQueryData = TQueryFnData[]
>(
  queryKey: QueryKey,
  queryFn: QueryFunction<TQueryFnData | TData>,
  options?: UseInfiniteQueryOptions<TData, TError, TQueryFnData, TQueryData>
): UseInfiniteQueryResult<TData, TError>
export function useInfiniteQuery<
  TData,
  TError,
  TQueryFnData = TData,
  TQueryData = TQueryFnData[]
>(
  arg1:
    | QueryKey
    | UseInfiniteQueryOptions<TData, TError, TQueryFnData, TQueryData>,
  arg2?:
    | QueryFunction<TQueryFnData | TData>
    | UseInfiniteQueryOptions<TData, TError, TQueryFnData, TQueryData>,
  arg3?: UseInfiniteQueryOptions<TData, TError, TQueryFnData, TQueryData>
): UseInfiniteQueryResult<TData, TError> {
  const parsedOptions = parseQueryArgs(arg1, arg2, arg3)
  parsedOptions.infinite = true
  return useBaseQuery(parsedOptions) as UseInfiniteQueryResult<TData, TError>
}
