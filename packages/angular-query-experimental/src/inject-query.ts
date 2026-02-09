import { QueryObserver } from '@tanstack/query-core'
import {
  Injector,
  assertInInjectionContext,
  inject,
  runInInjectionContext,
} from '@angular/core'
import { createBaseQuery } from './create-base-query'
import type { MethodKeys } from './signal-proxy'
import type {
  DefaultError,
  QueryKey,
  QueryObserverResult,
} from '@tanstack/query-core'
import type {
  CreateQueryOptions,
  CreateQueryResult,
  DefinedCreateQueryResult,
} from './types'
import type {
  DefinedInitialDataOptions,
  UndefinedInitialDataOptions,
} from './query-options'

export interface InjectQueryOptions {
  /**
   * The `Injector` in which to create the query.
   *
   * If this is not provided, the current injection context will be used instead (via `inject`).
   */
  injector?: Injector
}

/**
 * Injects a query: a declarative dependency on an asynchronous source of data that is tied to a unique key.
 *
 * **Basic example**
 * ```ts
 * import { lastValueFrom } from 'rxjs'
 *
 * class ServiceOrComponent {
 *   query = injectQuery(() => ({
 *     queryKey: ['repoData'],
 *     queryFn: () =>
 *       lastValueFrom(
 *         this.#http.get<Response>('https://api.github.com/repos/tanstack/query'),
 *       ),
 *   }))
 * }
 * ```
 *
 * Similar to `computed` from Angular, the function passed to `injectQuery` will be run in the reactive context.
 * In the example below, the query will be automatically enabled and executed when the filter signal changes
 * to a truthy value. When the filter signal changes back to a falsy value, the query will be disabled.
 *
 * **Reactive example**
 * ```ts
 * class ServiceOrComponent {
 *   filter = signal('')
 *
 *   todosQuery = injectQuery(() => ({
 *     queryKey: ['todos', this.filter()],
 *     queryFn: () => fetchTodos(this.filter()),
 *     // Signals can be combined with expressions
 *     enabled: !!this.filter(),
 *   }))
 * }
 * ```
 * @param injectQueryFn - A function that returns query options.
 * @param options - Additional configuration
 * @returns The query result.
 * @see https://tanstack.com/query/latest/docs/framework/angular/guides/queries
 */
export function injectQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  injectQueryFn: () => DefinedInitialDataOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey
  >,
  options?: InjectQueryOptions,
): DefinedCreateQueryResult<TData, TError>

/**
 * Injects a query: a declarative dependency on an asynchronous source of data that is tied to a unique key.
 *
 * **Basic example**
 * ```ts
 * import { lastValueFrom } from 'rxjs'
 *
 * class ServiceOrComponent {
 *   query = injectQuery(() => ({
 *     queryKey: ['repoData'],
 *     queryFn: () =>
 *       lastValueFrom(
 *         this.#http.get<Response>('https://api.github.com/repos/tanstack/query'),
 *       ),
 *   }))
 * }
 * ```
 *
 * Similar to `computed` from Angular, the function passed to `injectQuery` will be run in the reactive context.
 * In the example below, the query will be automatically enabled and executed when the filter signal changes
 * to a truthy value. When the filter signal changes back to a falsy value, the query will be disabled.
 *
 * **Reactive example**
 * ```ts
 * class ServiceOrComponent {
 *   filter = signal('')
 *
 *   todosQuery = injectQuery(() => ({
 *     queryKey: ['todos', this.filter()],
 *     queryFn: () => fetchTodos(this.filter()),
 *     // Signals can be combined with expressions
 *     enabled: !!this.filter(),
 *   }))
 * }
 * ```
 * @param injectQueryFn - A function that returns query options.
 * @param options - Additional configuration
 * @returns The query result.
 * @see https://tanstack.com/query/latest/docs/framework/angular/guides/queries
 */
export function injectQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  injectQueryFn: () => UndefinedInitialDataOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey
  >,
  options?: InjectQueryOptions,
): CreateQueryResult<TData, TError>

/**
 * Injects a query: a declarative dependency on an asynchronous source of data that is tied to a unique key.
 *
 * **Basic example**
 * ```ts
 * import { lastValueFrom } from 'rxjs'
 *
 * class ServiceOrComponent {
 *   query = injectQuery(() => ({
 *     queryKey: ['repoData'],
 *     queryFn: () =>
 *       lastValueFrom(
 *         this.#http.get<Response>('https://api.github.com/repos/tanstack/query'),
 *       ),
 *   }))
 * }
 * ```
 *
 * Similar to `computed` from Angular, the function passed to `injectQuery` will be run in the reactive context.
 * In the example below, the query will be automatically enabled and executed when the filter signal changes
 * to a truthy value. When the filter signal changes back to a falsy value, the query will be disabled.
 *
 * **Reactive example**
 * ```ts
 * class ServiceOrComponent {
 *   filter = signal('')
 *
 *   todosQuery = injectQuery(() => ({
 *     queryKey: ['todos', this.filter()],
 *     queryFn: () => fetchTodos(this.filter()),
 *     // Signals can be combined with expressions
 *     enabled: !!this.filter(),
 *   }))
 * }
 * ```
 * @param injectQueryFn - A function that returns query options.
 * @param options - Additional configuration
 * @returns The query result.
 * @see https://tanstack.com/query/latest/docs/framework/angular/guides/queries
 */
export function injectQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  injectQueryFn: () => CreateQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey
  >,
  options?: InjectQueryOptions,
): CreateQueryResult<TData, TError>

/**
 * Injects a query: a declarative dependency on an asynchronous source of data that is tied to a unique key.
 *
 * **Basic example**
 * ```ts
 * import { lastValueFrom } from 'rxjs'
 *
 * class ServiceOrComponent {
 *   query = injectQuery(() => ({
 *     queryKey: ['repoData'],
 *     queryFn: () =>
 *       lastValueFrom(
 *         this.#http.get<Response>('https://api.github.com/repos/tanstack/query'),
 *       ),
 *   }))
 * }
 * ```
 *
 * Similar to `computed` from Angular, the function passed to `injectQuery` will be run in the reactive context.
 * In the example below, the query will be automatically enabled and executed when the filter signal changes
 * to a truthy value. When the filter signal changes back to a falsy value, the query will be disabled.
 *
 * **Reactive example**
 * ```ts
 * class ServiceOrComponent {
 *   filter = signal('')
 *
 *   todosQuery = injectQuery(() => ({
 *     queryKey: ['todos', this.filter()],
 *     queryFn: () => fetchTodos(this.filter()),
 *     // Signals can be combined with expressions
 *     enabled: !!this.filter(),
 *   }))
 * }
 * ```
 * @param injectQueryFn - A function that returns query options.
 * @param options - Additional configuration
 * @returns The query result.
 * @see https://tanstack.com/query/latest/docs/framework/angular/guides/queries
 */
export function injectQuery(
  injectQueryFn: () => CreateQueryOptions,
  options?: InjectQueryOptions,
) {
  !options?.injector && assertInInjectionContext(injectQuery)
  return runInInjectionContext(options?.injector ?? inject(Injector), () =>
    createBaseQuery(injectQueryFn, QueryObserver, methodsToExclude),
  ) as unknown as CreateQueryResult
}

const methodsToExclude: Array<MethodKeys<QueryObserverResult>> = ['refetch']
