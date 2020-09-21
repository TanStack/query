import { QueryFunction, QueryKey } from '../core/types'
import { parseQueryArgs } from '../core/utils'
import { UseQueryOptions, UseQueryResult } from './types'
import { useBaseQuery } from './useBaseQuery'

// HOOK

export function useQuery<
  TData = unknown,
  TError = unknown,
  TQueryFnData = TData
>(
  options: UseQueryOptions<TData, TError, TQueryFnData>
): UseQueryResult<TData, TError>
export function useQuery<
  TData = unknown,
  TError = unknown,
  TQueryFnData = TData
>(
  queryKey: QueryKey,
  options?: UseQueryOptions<TData, TError, TQueryFnData>
): UseQueryResult<TData, TError>
export function useQuery<
  TData = unknown,
  TError = unknown,
  TQueryFnData = TData
>(
  queryKey: QueryKey,
  queryFn: QueryFunction<TQueryFnData | TData>,
  options?: UseQueryOptions<TData, TError, TQueryFnData>
): UseQueryResult<TData, TError>
export function useQuery<TData, TError, TQueryFnData = TData>(
  arg1: QueryKey | UseQueryOptions<TData, TError, TQueryFnData>,
  arg2?:
    | QueryFunction<TData | TQueryFnData>
    | UseQueryOptions<TData, TError, TQueryFnData>,
  arg3?: UseQueryOptions<TData, TError, TQueryFnData>
): UseQueryResult<TData, TError> {
  const parsedOptions = parseQueryArgs(arg1, arg2, arg3)
  return useBaseQuery(parsedOptions)
}
