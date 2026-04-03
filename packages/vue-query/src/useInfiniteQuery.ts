import { InfiniteQueryObserver } from '@tanstack/query-core'
import { useBaseQuery } from './useBaseQuery'
import type {
  DefinedInitialDataInfiniteOptions,
  UndefinedInitialDataInfiniteOptions,
} from './infiniteQueryOptions'
import type {
  DefaultError,
  InfiniteData,
  InfiniteQueryMode,
  InfiniteQueryObserverOptions,
  InfiniteQueryObserverResult,
  QueryKey,
  QueryObserver,
} from '@tanstack/query-core'

import type { UseBaseQueryReturnType } from './useBaseQuery'

import type {
  DeepUnwrapRef,
  MaybeRef,
  MaybeRefDeep,
  MaybeRefOrGetter,
  ShallowOption,
} from './types'
import type { QueryClient } from './queryClient'

export type UseInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
  TMode extends InfiniteQueryMode | undefined = undefined,
> = MaybeRef<
  {
    [Property in keyof InfiniteQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam,
      TMode
    >]: Property extends 'enabled'
      ? MaybeRefOrGetter<
          InfiniteQueryObserverOptions<
            TQueryFnData,
            TError,
            TData,
            DeepUnwrapRef<TQueryKey>,
            TPageParam,
            TMode
          >[Property]
        >
      : MaybeRefDeep<
          InfiniteQueryObserverOptions<
            TQueryFnData,
            TError,
            TData,
            DeepUnwrapRef<TQueryKey>,
            TPageParam,
            TMode
          >[Property]
        >
  } & ShallowOption
>

export type UseInfiniteQueryReturnType<
  TData,
  TError,
  TPageParam = unknown,
  TMode extends InfiniteQueryMode | undefined = undefined,
> = UseBaseQueryReturnType<
  TData,
  TError,
  InfiniteQueryObserverResult<TData, TError, TPageParam, TMode>
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
      TPageParam,
      undefined
    >
  >,
  queryClient?: QueryClient,
): UseInfiniteQueryReturnType<TData, TError, TPageParam, undefined>
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
      TPageParam,
      InfiniteQueryMode
    >
  >,
  queryClient?: QueryClient,
): UseInfiniteQueryReturnType<TData, TError, TPageParam, InfiniteQueryMode>

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
      TPageParam,
      undefined
    >
  >,
  queryClient?: QueryClient,
): UseInfiniteQueryReturnType<TData, TError, TPageParam, undefined>
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
      TPageParam,
      InfiniteQueryMode
    >
  >,
  queryClient?: QueryClient,
): UseInfiniteQueryReturnType<TData, TError, TPageParam, InfiniteQueryMode>

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

export function useInfiniteQuery(options: any, queryClient?: QueryClient): any {
  return useBaseQuery(
    InfiniteQueryObserver as typeof QueryObserver,
    options,
    queryClient,
  )
}
