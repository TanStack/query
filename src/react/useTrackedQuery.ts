import { TrackedQueryObserver } from '../core/trackedQueryObserver'
import { QueryFunction, QueryKey } from '../core/types'
import { parseQueryArgs } from '../core/utils'
import { UseTrackedQueryOptions, UseQueryResult } from './types'
import { useBaseQuery } from './useBaseQuery'

// HOOK

export function useTrackedQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData
>(
  options: UseTrackedQueryOptions<TQueryFnData, TError, TData>
): UseQueryResult<TData, TError>
export function useTrackedQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData
>(
  queryKey: QueryKey,
  options?: UseTrackedQueryOptions<TQueryFnData, TError, TData>
): UseQueryResult<TData, TError>
export function useTrackedQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData
>(
  queryKey: QueryKey,
  queryFn: QueryFunction<TQueryFnData>,
  options?: UseTrackedQueryOptions<TQueryFnData, TError, TData>
): UseQueryResult<TData, TError>
export function useTrackedQuery<TQueryFnData, TError, TData = TQueryFnData>(
  arg1: QueryKey | UseTrackedQueryOptions<TQueryFnData, TError, TData>,
  arg2?:
    | QueryFunction<TQueryFnData>
    | UseTrackedQueryOptions<TQueryFnData, TError, TData>,
  arg3?: UseTrackedQueryOptions<TQueryFnData, TError, TData>
): UseQueryResult<TData, TError> {
  const parsedOptions = parseQueryArgs(arg1, arg2, arg3)
  return useBaseQuery(parsedOptions, TrackedQueryObserver)
}
