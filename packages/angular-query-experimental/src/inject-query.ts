import { QueryObserver } from '@tanstack/query-core'
import { assertInjector } from './util/assert-injector/assert-injector'
import { injectQueryClient } from './inject-query-client'
import { createBaseQuery } from './create-base-query'
import type { DefaultError, QueryClient, QueryKey } from '@tanstack/query-core'
import type { Injector } from '@angular/core'
import type {
  CreateQueryOptions,
  CreateQueryResult,
  DefinedCreateQueryResult,
} from './types'
import type {
  DefinedInitialDataOptions,
  UndefinedInitialDataOptions,
} from './query-options'

export function injectQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: (
    client: QueryClient,
  ) => UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
  injector?: Injector,
): CreateQueryResult<TData, TError>

export function injectQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: (
    client: QueryClient,
  ) => DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
  injector?: Injector,
): DefinedCreateQueryResult<TData, TError>

export function injectQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: (
    client: QueryClient,
  ) => CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  injector?: Injector,
): CreateQueryResult<TData, TError>

export function injectQuery(
  options: (client: QueryClient) => CreateQueryOptions,
  injector?: Injector,
) {
  return assertInjector(injectQuery, injector, () => {
    const queryClient = injectQueryClient()
    return createBaseQuery(options, QueryObserver, queryClient)
  })
}
