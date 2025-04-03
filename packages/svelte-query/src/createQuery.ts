import { QueryObserver } from '@tanstack/query-core'
import { createBaseQuery } from './createBaseQuery.svelte.js'
import type { DefaultError, QueryClient, QueryKey } from '@tanstack/query-core'
import type {
  CreateQueryOptions,
  CreateQueryResult,
  DefinedCreateQueryResult,
} from './types.js'
import type {
  DefinedInitialDataOptions,
  UndefinedInitialDataOptions,
} from './queryOptions.js'

export function createQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: () => DefinedInitialDataOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey
  >,
  queryClient?: QueryClient,
): DefinedCreateQueryResult<TData, TError>

export function createQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: () => UndefinedInitialDataOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey
  >,
  queryClient?: QueryClient,
): CreateQueryResult<TData, TError>

export function createQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: () => CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): CreateQueryResult<TData, TError>

export function createQuery(
  options: () => CreateQueryOptions,
  queryClient?: QueryClient,
) {
  return createBaseQuery(options, QueryObserver, queryClient)
}
