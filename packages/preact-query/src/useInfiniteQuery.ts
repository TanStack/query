import { InfiniteQueryObserver } from '@tanstack/query-core'
import type {
  DefaultError,
  InfiniteData,
  QueryClient,
  QueryKey,
  QueryObserver,
} from '@tanstack/query-core'

import type {
  DefinedInitialDataInfiniteOptions,
  UndefinedInitialDataInfiniteOptions,
} from './infiniteQueryOptions'
import type {
  DefinedUseInfiniteQueryResult,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
} from './types'
import { useBaseQuery } from './useBaseQuery'

type IsUnknown<T> = unknown extends T
  ? [T] extends [never]
    ? false
    : true
  : false

type ResolvePageParamData<TQueryFnData, TData, TPageParam> =
  TData extends InfiniteData<TQueryFnData, infer TDataPageParam>
    ? IsUnknown<TDataPageParam> extends true
      ? InfiniteData<TQueryFnData, TPageParam>
      : TData
    : TData

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
    TPageParam
  >,
  queryClient?: QueryClient,
): DefinedUseInfiniteQueryResult<
  ResolvePageParamData<TQueryFnData, TData, TPageParam>,
  TError
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
    TPageParam
  >,
  queryClient?: QueryClient,
): UseInfiniteQueryResult<
  ResolvePageParamData<TQueryFnData, TData, TPageParam>,
  TError
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
    TQueryKey,
    TPageParam
  >,
  queryClient?: QueryClient,
): UseInfiniteQueryResult<
  ResolvePageParamData<TQueryFnData, TData, TPageParam>,
  TError
>

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
