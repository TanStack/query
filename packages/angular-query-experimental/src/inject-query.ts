import { QueryObserver } from '@tanstack/query-core'
import { assertInjector } from './util/assert-injector/assert-injector'
import { createBaseQuery } from './create-base-query'
import type { Injector } from '@angular/core'
import type { DefaultError, QueryClient, QueryKey } from '@tanstack/query-core'
import type {
  CreateQueryOptions,
  CreateQueryResult,
  DefinedCreateQueryResult,
} from './types'
import type {
  DefinedInitialDataOptions,
  UndefinedInitialDataOptions,
} from './query-options'

/**
 * Injects a query: a declarative dependency on an asynchronous source of data that is tied to a unique key.
 *
 * **Basic example**
 * ```ts
 * class ServiceOrComponent {
 *   query = injectQuery(() => ({
 *     queryKey: ['repoData'],
 *     queryFn: () =>
 *       this.#http.get<Response>('https://api.github.com/repos/tanstack/query'),
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
 * @param optionsFn - A function that returns query options.
 * @param injector - The Angular injector to use.
 * @returns The query result.
 * @public
 * @see https://tanstack.com/query/latest/docs/framework/angular/guides/queries
 */
export function injectQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  optionsFn: (
    client: QueryClient,
  ) => DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
  injector?: Injector,
): DefinedCreateQueryResult<TData, TError>

/**
 * Injects a query: a declarative dependency on an asynchronous source of data that is tied to a unique key.
 *
 * **Basic example**
 * ```ts
 * class ServiceOrComponent {
 *   query = injectQuery(() => ({
 *     queryKey: ['repoData'],
 *     queryFn: () =>
 *       this.#http.get<Response>('https://api.github.com/repos/tanstack/query'),
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
 * @param optionsFn - A function that returns query options.
 * @param injector - The Angular injector to use.
 * @returns The query result.
 * @public
 * @see https://tanstack.com/query/latest/docs/framework/angular/guides/queries
 */
export function injectQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  optionsFn: (
    client: QueryClient,
  ) => UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
  injector?: Injector,
): CreateQueryResult<TData, TError>

/**
 * Injects a query: a declarative dependency on an asynchronous source of data that is tied to a unique key.
 *
 * **Basic example**
 * ```ts
 * class ServiceOrComponent {
 *   query = injectQuery(() => ({
 *     queryKey: ['repoData'],
 *     queryFn: () =>
 *       this.#http.get<Response>('https://api.github.com/repos/tanstack/query'),
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
 * @param optionsFn - A function that returns query options.
 * @param injector - The Angular injector to use.
 * @returns The query result.
 * @public
 * @see https://tanstack.com/query/latest/docs/framework/angular/guides/queries
 */
export function injectQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  optionsFn: (
    client: QueryClient,
  ) => CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  injector?: Injector,
): CreateQueryResult<TData, TError>

/**
 * Injects a query: a declarative dependency on an asynchronous source of data that is tied to a unique key.
 *
 * **Basic example**
 * ```ts
 * class ServiceOrComponent {
 *   query = injectQuery(() => ({
 *     queryKey: ['repoData'],
 *     queryFn: () =>
 *       this.#http.get<Response>('https://api.github.com/repos/tanstack/query'),
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
 * @param optionsFn - A function that returns query options.
 * @param injector - The Angular injector to use.
 * @returns The query result.
 * @public
 * @see https://tanstack.com/query/latest/docs/framework/angular/guides/queries
 */
export function injectQuery(
  optionsFn: (client: QueryClient) => CreateQueryOptions,
  injector?: Injector,
) {
  return assertInjector(injectQuery, injector, () =>
    createBaseQuery(optionsFn, QueryObserver),
  )
}
