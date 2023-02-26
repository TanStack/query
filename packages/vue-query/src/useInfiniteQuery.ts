import { InfiniteQueryObserver } from '@tanstack/query-core'
import type {
  QueryObserver,
  WithRequired,
  QueryKey,
  InfiniteQueryObserverResult,
  InfiniteQueryObserverOptions,
  RegisteredError,
} from '@tanstack/query-core'

import { useBaseQuery } from './useBaseQuery'
import type { UseBaseQueryReturnType } from './useBaseQuery'

import type { DistributiveOmit, MaybeRefDeep } from './types'
import type { QueryClient } from './queryClient'
import type { UnwrapRef } from 'vue-demi'

export type UseInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = RegisteredError,
  TData = unknown,
  TQueryData = unknown,
  TQueryKey extends QueryKey = QueryKey,
> = {
  [Property in keyof InfiniteQueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >]: Property extends 'queryFn'
    ? InfiniteQueryObserverOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryData,
        UnwrapRef<TQueryKey>
      >[Property]
    : MaybeRefDeep<
        WithRequired<
          InfiniteQueryObserverOptions<
            TQueryFnData,
            TError,
            TData,
            TQueryData,
            TQueryKey
          >,
          'queryKey'
        >[Property]
      >
}

type InfiniteQueryReturnType<TData, TError> = UseBaseQueryReturnType<
  TData,
  TError,
  InfiniteQueryObserverResult<TData, TError>
>
export type UseInfiniteQueryReturnType<TData, TError> = DistributiveOmit<
  InfiniteQueryReturnType<TData, TError>,
  'fetchNextPage' | 'fetchPreviousPage' | 'refetch'
> & {
  fetchNextPage: InfiniteQueryObserverResult<TData, TError>['fetchNextPage']
  fetchPreviousPage: InfiniteQueryObserverResult<
    TData,
    TError
  >['fetchPreviousPage']
  refetch: InfiniteQueryObserverResult<TData, TError>['refetch']
}

export function useInfiniteQuery<
  TQueryFnData,
  TError = RegisteredError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): UseInfiniteQueryReturnType<TData, TError> {
  const result = useBaseQuery(
    InfiniteQueryObserver as typeof QueryObserver,
    options,
    queryClient,
  ) as InfiniteQueryReturnType<TData, TError>
  return {
    ...result,
    fetchNextPage: result.fetchNextPage.value,
    fetchPreviousPage: result.fetchPreviousPage.value,
    refetch: result.refetch.value,
  }
}
