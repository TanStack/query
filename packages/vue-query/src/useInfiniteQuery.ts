import { InfiniteQueryObserver } from '@tanstack/query-core'
import { useBaseQuery } from './useBaseQuery'
import type {
  DefaultError,
  InfiniteData,
  InfiniteQueryObserverOptions,
  InfiniteQueryObserverResult,
  QueryKey,
  QueryObserver,
} from '@tanstack/query-core'

import type { UseBaseQueryReturnType } from './useBaseQuery'

import type { DeepUnwrapRef, MaybeRefDeep, MaybeRefOrGetter } from './types'
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
  >]: Property extends 'enabled'
    ? MaybeRefOrGetter<
        InfiniteQueryObserverOptions<
          TQueryFnData,
          TError,
          TData,
          TQueryData,
          DeepUnwrapRef<TQueryKey>
        >[Property]
      >
    : MaybeRefDeep<
        InfiniteQueryObserverOptions<
          TQueryFnData,
          TError,
          TData,
          TQueryData,
          DeepUnwrapRef<TQueryKey>,
          TPageParam
        >[Property]
      >
}

export type UseInfiniteQueryReturnType<TData, TError> = UseBaseQueryReturnType<
  TData,
  TError,
  InfiniteQueryObserverResult<TData, TError>
>

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
  return useBaseQuery(
    InfiniteQueryObserver as typeof QueryObserver,
    options,
    queryClient,
  ) as UseInfiniteQueryReturnType<TData, TError>
}
