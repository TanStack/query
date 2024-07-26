import { QueryObserver } from '@tanstack/query-core'
import { createBaseQuery } from './createBaseQuery'
import type { DefaultError, QueryClient, QueryKey } from '@tanstack/query-core'
import type {
  CreateQueryOptions,
  CreateQueryResult,
  DefinedCreateQueryResult,
  StoreOrVal,
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
  options: StoreOrVal<
    DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
  >,
  queryClient?: QueryClient,
): DefinedCreateQueryResult<TData, TError>

export function createQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: StoreOrVal<
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
  options: StoreOrVal<
    CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>
  >,
  queryClient?: QueryClient,
): CreateQueryResult<TData, TError>

export function createQuery(
  options: StoreOrVal<CreateQueryOptions>,
  queryClient?: QueryClient,
) {
  return createBaseQuery(options, QueryObserver, queryClient)
}
