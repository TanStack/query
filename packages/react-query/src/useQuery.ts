'use client'
import { QueryObserver } from '@tanstack/query-core'
import { useBaseQuery } from './useBaseQuery'
import type {
  DefaultError,
  InferErrorFromFn,
  NoInfer,
  QueryClient,
  QueryFunction,
  QueryKey,
  StripThrows,
  ThrowsFnOptions,
} from '@tanstack/query-core'
import type {
  DefinedUseQueryResult,
  UseQueryOptions,
  UseQueryResult,
} from './types'
import type {
  DefinedInitialDataOptions,
  UndefinedInitialDataOptions,
} from './queryOptions'

export function useQuery<
  TQueryKey extends QueryKey = QueryKey,
  TQueryFn extends QueryFunction<any, TQueryKey> = QueryFunction<
    any,
    TQueryKey
  >,
  TQueryFnData = StripThrows<Awaited<ReturnType<TQueryFn>>>,
  TData = TQueryFnData,
>(
  options: ThrowsFnOptions<
    TQueryFn,
    Omit<
      DefinedInitialDataOptions<
        TQueryFnData,
        InferErrorFromFn<TQueryFn>,
        TData,
        TQueryKey
      >,
      'queryFn'
    > & { queryFn: TQueryFn }
  >,
  queryClient?: QueryClient,
): DefinedUseQueryResult<NoInfer<TData>, InferErrorFromFn<TQueryFn>>

export function useQuery<
  TQueryKey extends QueryKey = QueryKey,
  TQueryFn extends QueryFunction<any, TQueryKey> = QueryFunction<
    any,
    TQueryKey
  >,
  TQueryFnData = StripThrows<Awaited<ReturnType<TQueryFn>>>,
  TData = TQueryFnData,
>(
  options: ThrowsFnOptions<
    TQueryFn,
    Omit<
      UndefinedInitialDataOptions<
        TQueryFnData,
        InferErrorFromFn<TQueryFn>,
        TData,
        TQueryKey
      >,
      'queryFn'
    > & { queryFn: TQueryFn }
  >,
  queryClient?: QueryClient,
): UseQueryResult<NoInfer<TData>, InferErrorFromFn<TQueryFn>>

export function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): DefinedUseQueryResult<NoInfer<TData>, TError>

export function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): UseQueryResult<NoInfer<TData>, TError>

export function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): UseQueryResult<NoInfer<TData>, TError>

export function useQuery(options: UseQueryOptions, queryClient?: QueryClient) {
  return useBaseQuery(options, QueryObserver, queryClient)
}
