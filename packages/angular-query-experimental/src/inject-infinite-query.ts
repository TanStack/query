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
} from '@tanstack/query-core'
import type {
  CreateInfiniteQueryOptions,
  CreateInfiniteQueryResult,
  DefinedCreateInfiniteQueryResult,
} from './types'
import type {
  DefinedInitialDataInfiniteOptions,
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

/**
 * Injects an infinite query: a declarative dependency on an asynchronous source of data that is tied to a unique key.
 * Infinite queries can additively "load more" data onto an existing set of data or "infinite scroll"
 *
 * **Basic example**
 * ```ts
 * class ServiceOrComponent {
 *   query = injectInfiniteQuery(() => ({
 *     queryKey: ['projects'],
 *     queryFn: ({ pageParam }) =>
 *       this.#http.get<Response>('/api/projects?cursor=' + pageParam),
 *     initialPageParam: 0,
 *     getNextPageParam: (lastPage) => lastPage.nextCursor,
 *   }))
 * }
 * ```
 *
 * Similar to `computed` from Angular, the function passed to `injectInfiniteQuery` will be run in the reactive context.
 * In the example below, the query will be automatically enabled and executed when the filter signal changes
 * to a truthy value. When the filter signal changes back to a falsy value, the query will be disabled.
 *
 * **Reactive example**
 * ```ts
 * class ServiceOrComponent {
 *   filter = signal('')
 *
 *   projectsQuery = injectInfiniteQuery(() => ({
 *     queryKey: ['projects', this.filter()],
 *     queryFn: ({ pageParam }) => fetchProjects(this.filter(), pageParam),
 *     initialPageParam: 0,
 *     getNextPageParam: (lastPage) => lastPage.nextCursor,
 *     enabled: !!this.filter(),
 *   }))
 * }
 * ```
 * @param injectInfiniteQueryFn - A function that returns infinite query options.
 * @param options - Additional configuration.
 * @returns The infinite query result.
 * @see https://tanstack.com/query/latest/docs/framework/angular/guides/infinite-queries
 */
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
/**
 * Injects an infinite query: a declarative dependency on an asynchronous source of data that is tied to a unique key.
 * Infinite queries can additively "load more" data onto an existing set of data or "infinite scroll"
 *
 * **Basic example**
 * ```ts
 * class ServiceOrComponent {
 *   query = injectInfiniteQuery(() => ({
 *     queryKey: ['projects'],
 *     queryFn: ({ pageParam }) =>
 *       this.#http.get<Response>('/api/projects?cursor=' + pageParam),
 *     initialPageParam: 0,
 *     getNextPageParam: (lastPage) => lastPage.nextCursor,
 *   }))
 * }
 * ```
 *
 * Similar to `computed` from Angular, the function passed to `injectInfiniteQuery` will be run in the reactive context.
 * In the example below, the query will be automatically enabled and executed when the filter signal changes
 * to a truthy value. When the filter signal changes back to a falsy value, the query will be disabled.
 *
 * **Reactive example**
 * ```ts
 * class ServiceOrComponent {
 *   filter = signal('')
 *
 *   projectsQuery = injectInfiniteQuery(() => ({
 *     queryKey: ['projects', this.filter()],
 *     queryFn: ({ pageParam }) => fetchProjects(this.filter(), pageParam),
 *     initialPageParam: 0,
 *     getNextPageParam: (lastPage) => lastPage.nextCursor,
 *     enabled: !!this.filter(),
 *   }))
 * }
 * ```
 * @param injectInfiniteQueryFn - A function that returns infinite query options.
 * @param options - Additional configuration.
 * @returns The infinite query result.
 * @see https://tanstack.com/query/latest/docs/framework/angular/guides/infinite-queries
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
    TPageParam,
    undefined
  >,
  options?: InjectInfiniteQueryOptions,
): DefinedCreateInfiniteQueryResult<TData, TError, TPageParam, undefined>
/**
 * Injects an infinite query: a declarative dependency on an asynchronous source of data that is tied to a unique key.
 * Infinite queries can additively "load more" data onto an existing set of data or "infinite scroll"
 *
 * **Basic example**
 * ```ts
 * class ServiceOrComponent {
 *   query = injectInfiniteQuery(() => ({
 *     queryKey: ['projects'],
 *     queryFn: ({ pageParam }) =>
 *       this.#http.get<Response>('/api/projects?cursor=' + pageParam),
 *     initialPageParam: 0,
 *     getNextPageParam: (lastPage) => lastPage.nextCursor,
 *   }))
 * }
 * ```
 *
 * Similar to `computed` from Angular, the function passed to `injectInfiniteQuery` will be run in the reactive context.
 * In the example below, the query will be automatically enabled and executed when the filter signal changes
 * to a truthy value. When the filter signal changes back to a falsy value, the query will be disabled.
 *
 * **Reactive example**
 * ```ts
 * class ServiceOrComponent {
 *   filter = signal('')
 *
 *   projectsQuery = injectInfiniteQuery(() => ({
 *     queryKey: ['projects', this.filter()],
 *     queryFn: ({ pageParam }) => fetchProjects(this.filter(), pageParam),
 *     initialPageParam: 0,
 *     getNextPageParam: (lastPage) => lastPage.nextCursor,
 *     enabled: !!this.filter(),
 *   }))
 * }
 * ```
 * @param injectInfiniteQueryFn - A function that returns infinite query options.
 * @param options - Additional configuration.
 * @returns The infinite query result.
 * @see https://tanstack.com/query/latest/docs/framework/angular/guides/infinite-queries
 */
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
/**
 * Injects an infinite query: a declarative dependency on an asynchronous source of data that is tied to a unique key.
 * Infinite queries can additively "load more" data onto an existing set of data or "infinite scroll"
 *
 * **Basic example**
 * ```ts
 * class ServiceOrComponent {
 *   query = injectInfiniteQuery(() => ({
 *     queryKey: ['projects'],
 *     queryFn: ({ pageParam }) =>
 *       this.#http.get<Response>('/api/projects?cursor=' + pageParam),
 *     initialPageParam: 0,
 *     getNextPageParam: (lastPage) => lastPage.nextCursor,
 *   }))
 * }
 * ```
 *
 * Similar to `computed` from Angular, the function passed to `injectInfiniteQuery` will be run in the reactive context.
 * In the example below, the query will be automatically enabled and executed when the filter signal changes
 * to a truthy value. When the filter signal changes back to a falsy value, the query will be disabled.
 *
 * **Reactive example**
 * ```ts
 * class ServiceOrComponent {
 *   filter = signal('')
 *
 *   projectsQuery = injectInfiniteQuery(() => ({
 *     queryKey: ['projects', this.filter()],
 *     queryFn: ({ pageParam }) => fetchProjects(this.filter(), pageParam),
 *     initialPageParam: 0,
 *     getNextPageParam: (lastPage) => lastPage.nextCursor,
 *     enabled: !!this.filter(),
 *   }))
 * }
 * ```
 * @param injectInfiniteQueryFn - A function that returns infinite query options.
 * @param options - Additional configuration.
 * @returns The infinite query result.
 * @see https://tanstack.com/query/latest/docs/framework/angular/guides/infinite-queries
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
    TPageParam,
    undefined
  >,
  options?: InjectInfiniteQueryOptions,
): CreateInfiniteQueryResult<TData, TError, TPageParam, undefined>
/**
 * Injects an infinite query: a declarative dependency on an asynchronous source of data that is tied to a unique key.
 * Infinite queries can additively "load more" data onto an existing set of data or "infinite scroll"
 *
 * **Basic example**
 * ```ts
 * class ServiceOrComponent {
 *   query = injectInfiniteQuery(() => ({
 *     queryKey: ['projects'],
 *     queryFn: ({ pageParam }) =>
 *       this.#http.get<Response>('/api/projects?cursor=' + pageParam),
 *     initialPageParam: 0,
 *     getNextPageParam: (lastPage) => lastPage.nextCursor,
 *   }))
 * }
 * ```
 *
 * Similar to `computed` from Angular, the function passed to `injectInfiniteQuery` will be run in the reactive context.
 * In the example below, the query will be automatically enabled and executed when the filter signal changes
 * to a truthy value. When the filter signal changes back to a falsy value, the query will be disabled.
 *
 * **Reactive example**
 * ```ts
 * class ServiceOrComponent {
 *   filter = signal('')
 *
 *   projectsQuery = injectInfiniteQuery(() => ({
 *     queryKey: ['projects', this.filter()],
 *     queryFn: ({ pageParam }) => fetchProjects(this.filter(), pageParam),
 *     initialPageParam: 0,
 *     getNextPageParam: (lastPage) => lastPage.nextCursor,
 *     enabled: !!this.filter(),
 *   }))
 * }
 * ```
 * @param injectInfiniteQueryFn - A function that returns infinite query options.
 * @param options - Additional configuration.
 * @returns The infinite query result.
 * @see https://tanstack.com/query/latest/docs/framework/angular/guides/infinite-queries
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
): DefinedCreateInfiniteQueryResult<TData, TError, TPageParam>
/**
 * Injects an infinite query: a declarative dependency on an asynchronous source of data that is tied to a unique key.
 * Infinite queries can additively "load more" data onto an existing set of data or "infinite scroll"
 *
 * **Basic example**
 * ```ts
 * class ServiceOrComponent {
 *   query = injectInfiniteQuery(() => ({
 *     queryKey: ['projects'],
 *     queryFn: ({ pageParam }) =>
 *       this.#http.get<Response>('/api/projects?cursor=' + pageParam),
 *     initialPageParam: 0,
 *     getNextPageParam: (lastPage) => lastPage.nextCursor,
 *   }))
 * }
 * ```
 *
 * Similar to `computed` from Angular, the function passed to `injectInfiniteQuery` will be run in the reactive context.
 * In the example below, the query will be automatically enabled and executed when the filter signal changes
 * to a truthy value. When the filter signal changes back to a falsy value, the query will be disabled.
 *
 * **Reactive example**
 * ```ts
 * class ServiceOrComponent {
 *   filter = signal('')
 *
 *   projectsQuery = injectInfiniteQuery(() => ({
 *     queryKey: ['projects', this.filter()],
 *     queryFn: ({ pageParam }) => fetchProjects(this.filter(), pageParam),
 *     initialPageParam: 0,
 *     getNextPageParam: (lastPage) => lastPage.nextCursor,
 *     enabled: !!this.filter(),
 *   }))
 * }
 * ```
 * @param injectInfiniteQueryFn - A function that returns infinite query options.
 * @param options - Additional configuration.
 * @returns The infinite query result.
 * @see https://tanstack.com/query/latest/docs/framework/angular/guides/infinite-queries
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
): CreateInfiniteQueryResult<TData, TError, TPageParam>
/**
 * Injects an infinite query: a declarative dependency on an asynchronous source of data that is tied to a unique key.
 * Infinite queries can additively "load more" data onto an existing set of data or "infinite scroll"
 *
 * **Basic example**
 * ```ts
 * class ServiceOrComponent {
 *   query = injectInfiniteQuery(() => ({
 *     queryKey: ['projects'],
 *     queryFn: ({ pageParam }) =>
 *       this.#http.get<Response>('/api/projects?cursor=' + pageParam),
 *     initialPageParam: 0,
 *     getNextPageParam: (lastPage) => lastPage.nextCursor,
 *   }))
 * }
 * ```
 *
 * Similar to `computed` from Angular, the function passed to `injectInfiniteQuery` will be run in the reactive context.
 * In the example below, the query will be automatically enabled and executed when the filter signal changes
 * to a truthy value. When the filter signal changes back to a falsy value, the query will be disabled.
 *
 * **Reactive example**
 * ```ts
 * class ServiceOrComponent {
 *   filter = signal('')
 *
 *   projectsQuery = injectInfiniteQuery(() => ({
 *     queryKey: ['projects', this.filter()],
 *     queryFn: ({ pageParam }) => fetchProjects(this.filter(), pageParam),
 *     initialPageParam: 0,
 *     getNextPageParam: (lastPage) => lastPage.nextCursor,
 *     enabled: !!this.filter(),
 *   }))
 * }
 * ```
 * @param injectInfiniteQueryFn - A function that returns infinite query options.
 * @param options - Additional configuration.
 * @returns The infinite query result.
 * @see https://tanstack.com/query/latest/docs/framework/angular/guides/infinite-queries
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
) {
  !options?.injector && assertInInjectionContext(injectInfiniteQuery)

  return runInInjectionContext(options?.injector ?? inject(Injector), () =>
    createBaseQuery(injectInfiniteQueryFn, InfiniteQueryObserver),
  )
}
