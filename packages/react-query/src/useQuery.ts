'use client'
import { QueryObserver } from '@tanstack/query-core'
import { useBaseQuery } from './useBaseQuery'
import type { DefaultError, QueryClient, QueryKey } from '@tanstack/query-core'
import type {
  DefinedUseQueryResult,
  UseQueryOptions,
  UseQueryResult,
} from './types'
import type {
  DefinedInitialDataOptions,
  UndefinedInitialDataOptions,
} from './queryOptions'

type UseQueryOptionsWithSelect<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
  select: Exclude<
    UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>['select'],
    undefined
  >
}

type UseQueryOptionsWithoutSelect<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'select'>

export function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData extends TQueryFnData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> &
    UseQueryOptionsWithoutSelect<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): DefinedUseQueryResult<NoInfer<TData>, TError>

export function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData extends TQueryFnData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey> &
    UseQueryOptionsWithoutSelect<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): UseQueryResult<NoInfer<TData>, TError>

export function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData extends TQueryFnData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseQueryOptionsWithoutSelect<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): UseQueryResult<NoInfer<TData>, TError>

export function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseQueryOptionsWithSelect<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): UseQueryResult<NoInfer<TData>, TError>

export function useQuery(options: UseQueryOptions, queryClient?: QueryClient) {
  return useBaseQuery(options, QueryObserver, queryClient)
}
