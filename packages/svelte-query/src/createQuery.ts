import { QueryObserver } from '@tanstack/query-core'
import { createBaseQuery } from './createBaseQuery.svelte.js'
import type { DefaultError, QueryClient, QueryKey } from '@tanstack/query-core'
import type {
  Accessor,
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
  options: Accessor<
    UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
  >,
  queryClient?: Accessor<QueryClient>,
): CreateQueryResult<TData, TError>

export function createQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: Accessor<
    DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
  >,
  queryClient?: Accessor<QueryClient>,
): DefinedCreateQueryResult<TData, TError>

export function createQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: Accessor<CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>>,
  queryClient?: Accessor<QueryClient>,
): CreateQueryResult<TData, TError>

export function createQuery(
  options: Accessor<CreateQueryOptions>,
  queryClient?: Accessor<QueryClient>,
) {
  return createBaseQuery(options, QueryObserver, queryClient)
}
