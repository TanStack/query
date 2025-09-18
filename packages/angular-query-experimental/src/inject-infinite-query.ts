import { InfiniteQueryObserver } from '@tanstack/query-core'
import {
  Injector,
  assertInInjectionContext,
  inject,
  runInInjectionContext,
} from '@angular/core'
import { createBaseQuery } from './create-base-query'
import type {
  DefaultError,
  InfiniteData,
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

export interface InjectInfiniteQueryOptions {
  /**
   * The `Injector` in which to create the infinite query.
   *
   * If this is not provided, the current injection context will be used instead (via `inject`).
   */
  injector?: Injector
}

/**
 * Injects an infinite query: a declarative dependency on an asynchronous source of data that is tied to a unique key.
 * Infinite queries can additively "load more" data onto an existing set of data or "infinite scroll"
 * @param injectInfiniteQueryFn - A function that returns infinite query options.
 * @param options - Additional configuration.
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
  injectInfiniteQueryFn: () => DefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  options?: InjectInfiniteQueryOptions,
): DefinedCreateInfiniteQueryResult<TData, TError>

/**
 * Injects an infinite query: a declarative dependency on an asynchronous source of data that is tied to a unique key.
 * Infinite queries can additively "load more" data onto an existing set of data or "infinite scroll"
 * @param injectInfiniteQueryFn - A function that returns infinite query options.
 * @param options - Additional configuration.
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
  injectInfiniteQueryFn: () => UndefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  options?: InjectInfiniteQueryOptions,
): CreateInfiniteQueryResult<TData, TError>

/**
 * Injects an infinite query: a declarative dependency on an asynchronous source of data that is tied to a unique key.
 * Infinite queries can additively "load more" data onto an existing set of data or "infinite scroll"
 * @param injectInfiniteQueryFn - A function that returns infinite query options.
 * @param options - Additional configuration.
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
  injectInfiniteQueryFn: () => CreateInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  options?: InjectInfiniteQueryOptions,
): CreateInfiniteQueryResult<TData, TError>

/**
 * Injects an infinite query: a declarative dependency on an asynchronous source of data that is tied to a unique key.
 * Infinite queries can additively "load more" data onto an existing set of data or "infinite scroll"
 * @param injectInfiniteQueryFn - A function that returns infinite query options.
 * @param options - Additional configuration.
 * @returns The infinite query result.
 * @public
 */
export function injectInfiniteQuery(
  injectInfiniteQueryFn: () => CreateInfiniteQueryOptions,
  options?: InjectInfiniteQueryOptions,
) {
  !options?.injector && assertInInjectionContext(injectInfiniteQuery)
  const injector = options?.injector ?? inject(Injector)
  return runInInjectionContext(injector, () =>
    createBaseQuery(
      injectInfiniteQueryFn,
      InfiniteQueryObserver as typeof QueryObserver,
    ),
  ) as unknown as CreateInfiniteQueryResult
}
