import { InfiniteQueryObserver } from '@tanstack/query-core'
import { createBaseQuery } from './create-base-query'
import { injectQueryClient } from './inject-query-client'
import { assertInjector } from './util/assert-injector/assert-injector'
import type { Injector } from '@angular/core'
import type {
  DefaultError,
  InfiniteData,
  QueryClient,
  QueryKey,
  QueryObserver,
} from '@tanstack/query-core'
import type {
  CreateInfiniteQueryOptions,
  CreateInfiniteQueryResult,
  DefinedCreateInfiniteQueryResult,
} from './types'
import type {
  DefinedInitialDataInfiniteOptions,
  UndefinedInitialDataInfiniteOptions,
} from './infinite-query-options'

export function injectInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: (
    client: QueryClient,
  ) => UndefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  injector?: Injector,
): CreateInfiniteQueryResult<TData, TError>

export function injectInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: (
    client: QueryClient,
  ) => DefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  injector?: Injector,
): DefinedCreateInfiniteQueryResult<TData, TError>

export function injectInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: (
    client: QueryClient,
  ) => CreateInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryFnData,
    TQueryKey,
    TPageParam
  >,
  injector?: Injector,
): CreateInfiniteQueryResult<TData, TError>

export function injectInfiniteQuery(
  options: (client: QueryClient) => CreateInfiniteQueryOptions,
  injector?: Injector,
) {
  return assertInjector(injectInfiniteQuery, injector, () => {
    const queryClient = injectQueryClient()
    return createBaseQuery(
      options,
      InfiniteQueryObserver as typeof QueryObserver,
      queryClient,
    )
  })
}
