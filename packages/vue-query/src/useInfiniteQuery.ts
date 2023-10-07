import { InfiniteQueryObserver } from '@tanstack/query-core'
import { useBaseQuery } from './useBaseQuery'
import type {
  DefaultError,
  InfiniteData,
  InfiniteQueryObserverOptions,
  InfiniteQueryObserverResult,
  QueryKey,
  QueryObserver,
  WithRequired,
} from '@tanstack/query-core'

import type { UseBaseQueryReturnType } from './useBaseQuery'

import type { DeepUnwrapRef, DistributiveOmit, MaybeRefDeep } from './types'
import type { QueryClient } from './queryClient'

export type UseInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = {
  [Property in keyof InfiniteQueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey,
    TPageParam
  >]: Property extends 'queryFn'
    ? InfiniteQueryObserverOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryData,
        DeepUnwrapRef<TQueryKey>,
        TPageParam
      >[Property]
    : MaybeRefDeep<
        WithRequired<
          InfiniteQueryObserverOptions<
            TQueryFnData,
            TError,
            TData,
            TQueryData,
            TQueryKey,
            TPageParam
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
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: UseInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryFnData,
    TQueryKey,
    TPageParam
  >,
  queryClient?: QueryClient,
): UseInfiniteQueryReturnType<TData, TError> {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const result = useBaseQuery(
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    InfiniteQueryObserver as typeof QueryObserver,
    options,
    queryClient,
  ) as InfiniteQueryReturnType<TData, TError>

  return result
}
