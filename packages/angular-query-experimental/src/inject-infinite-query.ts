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
  InfiniteQueryMode,
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
  DeclarativeDefinedInitialDataInfiniteOptions,
  DeclarativeUndefinedInitialDataInfiniteOptions,
  ManualDefinedInitialDataInfiniteOptions,
  ManualUndefinedInitialDataInfiniteOptions,
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

export function injectInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  injectInfiniteQueryFn: () => ManualDefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  options?: InjectInfiniteQueryOptions,
): DefinedCreateInfiniteQueryResult<
  TData,
  TError,
  TPageParam,
  InfiniteQueryMode
>
export function injectInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  injectInfiniteQueryFn: () => DeclarativeDefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  options?: InjectInfiniteQueryOptions,
): DefinedCreateInfiniteQueryResult<TData, TError, TPageParam, undefined>
export function injectInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  injectInfiniteQueryFn: () => ManualUndefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  options?: InjectInfiniteQueryOptions,
): CreateInfiniteQueryResult<TData, TError, TPageParam, InfiniteQueryMode>
export function injectInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  injectInfiniteQueryFn: () => DeclarativeUndefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  options?: InjectInfiniteQueryOptions,
): CreateInfiniteQueryResult<TData, TError, TPageParam, undefined>
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
): DefinedCreateInfiniteQueryResult<TData, TError, TPageParam>
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
): CreateInfiniteQueryResult<TData, TError, TPageParam>
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
): CreateInfiniteQueryResult<TData, TError, TPageParam>

/**
 * Injects an infinite query: a declarative dependency on an asynchronous source of data that is tied to a unique key.
 * Infinite queries can additively "load more" data onto an existing set of data or "infinite scroll"
 * @param injectInfiniteQueryFn - A function that returns infinite query options.
 * @param options - Additional configuration.
 * @returns The infinite query result.
 */
export function injectInfiniteQuery(
  injectInfiniteQueryFn: () => any,
  options?: InjectInfiniteQueryOptions,
): any {
  !options?.injector && assertInInjectionContext(injectInfiniteQuery)

  return runInInjectionContext(options?.injector ?? inject(Injector), () =>
    createBaseQuery(
      injectInfiniteQueryFn as unknown as () => any,
      InfiniteQueryObserver as typeof QueryObserver,
    ),
  ) as any
}
