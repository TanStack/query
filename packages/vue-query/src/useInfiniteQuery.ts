import { InfiniteQueryObserver } from '@tanstack/query-core'
import { useBaseQuery } from './useBaseQuery'
import type {
  InfiniteQueryObserverResult,
  QueryFunction,
  QueryKey,
  QueryObserver,
} from '@tanstack/query-core'

import type { UseQueryReturnType } from './useBaseQuery'

import type {
  DeepUnwrapRef,
  DistributiveOmit,
  VueInfiniteQueryObserverOptions,
  WithQueryClientKey,
} from './types'

export type UseInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = WithQueryClientKey<
  VueInfiniteQueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryFnData,
    TQueryKey
  >
>

type InfiniteQueryReturnType<TData, TError> = UseQueryReturnType<
  TData,
  TError,
  InfiniteQueryObserverResult<TData, TError>
>
export type UseInfiniteQueryReturnType<TData, TError> = DistributiveOmit<
  InfiniteQueryReturnType<TData, TError>,
  'fetchNextPage' | 'fetchPreviousPage' | 'refetch' | 'remove'
> & {
  fetchNextPage: InfiniteQueryObserverResult<TData, TError>['fetchNextPage']
  fetchPreviousPage: InfiniteQueryObserverResult<
    TData,
    TError
  >['fetchPreviousPage']
  refetch: InfiniteQueryObserverResult<TData, TError>['refetch']
  remove: InfiniteQueryObserverResult<TData, TError>['remove']
}

export function useInfiniteQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): UseInfiniteQueryReturnType<TData, TError>

export function useInfiniteQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  queryKey: TQueryKey,
  options?: Omit<
    UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    'queryKey'
  >,
): UseInfiniteQueryReturnType<TData, TError>

export function useInfiniteQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  queryKey: TQueryKey,
  queryFn: QueryFunction<TQueryFnData, DeepUnwrapRef<TQueryKey>>,
  options?: Omit<
    UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    'queryKey' | 'queryFn'
  >,
): UseInfiniteQueryReturnType<TData, TError>

export function useInfiniteQuery<
  TQueryFnData,
  TError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  arg1:
    | TQueryKey
    | UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  arg2?:
    | QueryFunction<TQueryFnData, DeepUnwrapRef<TQueryKey>>
    | UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  arg3?: UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): UseInfiniteQueryReturnType<TData, TError> {
  const result = useBaseQuery(
    InfiniteQueryObserver as typeof QueryObserver,
    arg1,
    arg2,
    arg3,
  ) as InfiniteQueryReturnType<TData, TError>
  return {
    ...result,
    fetchNextPage: result.fetchNextPage.value,
    fetchPreviousPage: result.fetchPreviousPage.value,
    refetch: result.refetch.value,
    remove: result.remove.value,
  }
}
