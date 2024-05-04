import { QueryObserver } from '@tanstack/query-core'
import { runInInjectionContext } from '@angular/core'
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
 * **The options function can utilize signals**
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
 * **The options function can utilize signals**
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
 * **The options function can utilize signals**
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
 * **The options function can utilize signals**
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
  const assertedInjector = assertInjector(injectQuery, injector)
  return assertInjector(injectQuery, injector, () => {
    const queryClient = injectQueryClient()
    return createBaseQuery(
      (client) =>
        runInInjectionContext(assertedInjector, () => optionsFn(client)),
      QueryObserver,
      queryClient,
    )
  })
}
