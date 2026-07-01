import { InfiniteQueryObserver } from '@tanstack/query-core'
import { useBaseQuery } from './useBaseQuery'

import type {
  DefaultError,
  InfiniteData,
  InfiniteQueryObserverResult,
  QueryKey,
  QueryObserver,
} from '@tanstack/query-core'

import type { MaybeRefOrGetter } from './types'
import type { QueryClient } from './queryClient'
import type { UseBaseQueryReturnType } from './useBaseQuery'
import type {
  DefinedInitialDataInfiniteOptions,
  UndefinedInitialDataInfiniteOptions,
  UseInfiniteQueryOptions,
} from './infiniteQueryOptions'

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
  options: MaybeRefOrGetter<
    DefinedInitialDataInfiniteOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >
  >,
  queryClient?: QueryClient,
): UseInfiniteQueryReturnType<TData, TError>

export function useInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: MaybeRefOrGetter<
    UndefinedInitialDataInfiniteOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >
  >,
  queryClient?: QueryClient,
): UseInfiniteQueryReturnType<TData, TError>

export function useInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: MaybeRefOrGetter<
    UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>
  >,
  queryClient?: QueryClient,
): UseInfiniteQueryReturnType<TData, TError>

export function useInfiniteQuery(
  options: MaybeRefOrGetter<UseInfiniteQueryOptions>,
  queryClient?: QueryClient,
) {
  return useBaseQuery(
    InfiniteQueryObserver as typeof QueryObserver,
    options,
    queryClient,
  )
}
