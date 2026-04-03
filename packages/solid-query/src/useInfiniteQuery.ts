import { InfiniteQueryObserver } from '@tanstack/query-core'
import { createMemo } from 'solid-js'
import { useBaseQuery } from './useBaseQuery'
import type {
  DefaultError,
  InfiniteData,
  InfiniteQueryMode,
  QueryKey,
  QueryObserver,
} from '@tanstack/query-core'
import type { QueryClient } from './QueryClient'
import type {
  DefinedUseInfiniteQueryResult,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
} from './types'
import type { Accessor } from 'solid-js'
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
>(
  options: DefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam,
    undefined
  >,
  queryClient?: Accessor<QueryClient>,
): DefinedUseInfiniteQueryResult<TData, TError, TPageParam, undefined>
export function useInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: DefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam,
    InfiniteQueryMode
  >,
  queryClient?: Accessor<QueryClient>,
): DefinedUseInfiniteQueryResult<
  TData,
  TError,
  TPageParam,
  InfiniteQueryMode
>
export function useInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: UndefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam,
    undefined
  >,
  queryClient?: Accessor<QueryClient>,
): UseInfiniteQueryResult<TData, TError, TPageParam, undefined>
export function useInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: UndefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam,
    InfiniteQueryMode
  >,
  queryClient?: Accessor<QueryClient>,
): UseInfiniteQueryResult<TData, TError, TPageParam, InfiniteQueryMode>
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
    TQueryKey,
    TPageParam
  >,
  queryClient?: Accessor<QueryClient>,
): UseInfiniteQueryResult<TData, TError, TPageParam>

export function useInfiniteQuery(
  options: any,
  queryClient?: Accessor<QueryClient>,
): any {
  return useBaseQuery(
    createMemo(() => options()),
    InfiniteQueryObserver as typeof QueryObserver,
    queryClient,
  ) as UseInfiniteQueryResult
}
