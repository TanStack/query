import { QueryClient, QueryObserver } from '@tanstack/query-core'
import type { DefaultError, QueryKey } from '@tanstack/query-core'
import { Injector } from '@angular/core'
import { createBaseQuery } from './createBaseQuery'
import { injectQueryClient } from './injectQueryClient'
import { assertInjector } from 'ngxtension/assert-injector'
import type {
  CreateQueryOptions,
  CreateQueryResult,
  DefinedCreateQueryResult,
} from './types'
import type {
  DefinedInitialDataOptions,
  UndefinedInitialDataOptions,
} from './queryOptions'

/**
 * Create a Query.
 * @param options
 * @param injector
 */
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
  TQueryFnData,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: (
    client: QueryClient,
  ) => CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  injector?: Injector,
) {
  return assertInjector(injectQuery, injector, () => {
    const queryClient = injectQueryClient()
    return createBaseQuery(options, QueryObserver, queryClient)
  })
}
