'use client'
import { InfiniteQueryObserver } from '@tanstack/query-core'
import { useBaseQuery } from './useBaseQuery'
import type {
  DefaultError,
  InfiniteData,
  InfiniteQueryMode,
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
  DeclarativeDefinedInitialDataInfiniteOptions,
  DeclarativeUndefinedInitialDataInfiniteOptions,
  ManualDefinedInitialDataInfiniteOptions,
  ManualUndefinedInitialDataInfiniteOptions,
} from './infiniteQueryOptions'

export function useInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: DeclarativeDefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  queryClient?: QueryClient,
): DefinedUseInfiniteQueryResult<TData, TError, TPageParam, undefined>

export function useInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: ManualDefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  queryClient?: QueryClient,
): DefinedUseInfiniteQueryResult<TData, TError, TPageParam, InfiniteQueryMode>

export function useInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: DeclarativeUndefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  queryClient?: QueryClient,
): UseInfiniteQueryResult<TData, TError, TPageParam, undefined>

export function useInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: ManualUndefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  queryClient?: QueryClient,
): UseInfiniteQueryResult<TData, TError, TPageParam, InfiniteQueryMode>

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
