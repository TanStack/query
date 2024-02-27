import { QueryObserver } from '@tanstack/query-core'

import { createBaseQuery } from './createBaseQuery.svelte'

import type { DefaultError, QueryClient, QueryKey } from '@tanstack/query-core'

import type {
  CreateQueryOptions,
  CreateQueryResult,
  DefinedCreateQueryResult,
  FnOrVal,
} from './types'
import type {
  DefinedInitialDataOptions,
  UndefinedInitialDataOptions,
} from './queryOptions'

export function createQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: FnOrVal<
    UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
  >,
  queryClient?: QueryClient,
): CreateQueryResult<TData, TError>

export function createQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): DefinedCreateQueryResult<TData, TError>

export function createQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
) {
  return createBaseQuery(options, QueryObserver, queryClient)
}
