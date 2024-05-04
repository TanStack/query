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

/**
 * Injects an infinite query: a declarative dependency on an asynchronous source of data that is tied to a unique key.
 * Infinite queries can additively "load more" data onto an existing set of data or "infinite scroll"
 * @param optionsFn - A function that returns infinite query options.
 * @param injector - The Angular injector to use.
 * @returns The infinite query result.
 * @public
 */
export function injectInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  optionsFn: (
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

/**
 * Injects an infinite query: a declarative dependency on an asynchronous source of data that is tied to a unique key.
 * Infinite queries can additively "load more" data onto an existing set of data or "infinite scroll"
 * @param optionsFn - A function that returns infinite query options.
 * @param injector - The Angular injector to use.
 * @returns The infinite query result.
 * @public
 */
export function injectInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  optionsFn: (
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

/**
 * Injects an infinite query: a declarative dependency on an asynchronous source of data that is tied to a unique key.
 * Infinite queries can additively "load more" data onto an existing set of data or "infinite scroll"
 * @param optionsFn - A function that returns infinite query options.
 * @param injector - The Angular injector to use.
 * @returns The infinite query result.
 * @public
 */
export function injectInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  optionsFn: (
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

/**
 * Injects an infinite query: a declarative dependency on an asynchronous source of data that is tied to a unique key.
 * Infinite queries can additively "load more" data onto an existing set of data or "infinite scroll"
 * @param optionsFn - A function that returns infinite query options.
 * @param injector - The Angular injector to use.
 * @returns The infinite query result.
 * @public
 */
export function injectInfiniteQuery(
  optionsFn: (client: QueryClient) => CreateInfiniteQueryOptions,
  injector?: Injector,
) {
  return assertInjector(injectInfiniteQuery, injector, () => {
    const queryClient = injectQueryClient()
    return createBaseQuery(
      optionsFn,
      InfiniteQueryObserver as typeof QueryObserver,
      queryClient,
    )
  })
}
