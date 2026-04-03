'use client'
import { InfiniteQueryObserver } from '@tanstack/query-core'
import { useBaseQuery } from './useBaseQuery'
import type {
  DefaultError,
  FetchPageDirectionMode,
  InfiniteData,
  QueryClient,
  QueryKey,
  QueryObserver,
} from '@tanstack/query-core'
import type {
  DefinedUseInfiniteQueryResult,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
} from './types'
import type {
  DefinedInitialDataInfiniteOptions,
  UndefinedInitialDataInfiniteOptions,
} from './infiniteQueryOptions'

export function useInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
  TMode extends FetchPageDirectionMode = undefined,
>(
  options: DefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam,
    TMode
  >,
  queryClient?: QueryClient,
): DefinedUseInfiniteQueryResult<TData, TError>

export function useInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
  TMode extends FetchPageDirectionMode = undefined,
>(
  options: UndefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam,
    TMode
  >,
  queryClient?: QueryClient,
): UseInfiniteQueryResult<TData, TError>

export function useInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
  TMode extends FetchPageDirectionMode = undefined,
>(
  options: UseInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam,
    TMode
  >,
  queryClient?: QueryClient,
): UseInfiniteQueryResult<TData, TError>

export function useInfiniteQuery(
  options: UseInfiniteQueryOptions,
  queryClient?: QueryClient,
) {
  return useBaseQuery(
    options,
    InfiniteQueryObserver as typeof QueryObserver,
    queryClient,
  )
}
