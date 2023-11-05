import {
  assertInInjectionContext,
  inject,
  runInInjectionContext,
} from '@angular/core'
import { QueryObserver } from '@tanstack/query-core'
import { Injector } from '@angular/core'
import { createBaseQuery } from './createBaseQuery'
import { QUERY_CLIENT } from './injectQueryClient'
import type { DefaultError, QueryKey } from '@tanstack/query-core'
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
  options: () => UndefinedInitialDataOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey
  >,
  injector?: Injector,
): CreateQueryResult<TData, TError>

export function injectQuery<
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
  injector?: Injector,
): DefinedCreateQueryResult<TData, TError>

export function injectQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: () => CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  injector?: Injector,
) {
  !injector && assertInInjectionContext(injectQuery)
  const assertedInjector = injector ?? inject(Injector)
  return runInInjectionContext(assertedInjector, () => {
    const queryClient = inject(QUERY_CLIENT)
    return createBaseQuery(options, QueryObserver, queryClient)
  })
}
