import {
  Injector,
  assertInInjectionContext,
  inject,
  runInInjectionContext,
} from '@angular/core'
import { QueryObserver } from '@tanstack/query-core'
import {
  createBaseQueryResource,
  normalizeQueryResourceArg,
} from './resource/create-base-query-resource'
import type { DefaultError, QueryKey } from '@tanstack/query-core'
import type { CreateBaseQueryOptions } from './types'
import type {
  CreateQueryResourceResult,
  QueryResourceConfig,
  QueryResourceInjectorOptions,
  QueryResourceOptionsFn,
} from './resource/resource-types'

/**
 * Creates a query whose handle is an Angular `Resource<TData | undefined>`.
 *
 * This is the resource-shaped counterpart of `injectQuery`. It is backed by the same
 * `QueryObserver`, `QueryClient` and cache, so it dedupes and shares data with every
 * other query (including `injectQuery`) using the same key — it only changes how the
 * result is presented: as a real Angular resource (`value`/`status`/`error`/
 * `isLoading`/`hasValue`/`snapshot`) plus the TanStack result signals.
 *
 * **Config form (this overload).** A plain object whose reactive fields are passed as
 * functions. `queryKey` and `enabled` may be thunks; everything else is read once.
 *
 * ```ts
 * class TodosComponent {
 *   filter = signal('')
 *
 *   todos = queryResource({
 *     queryKey: () => ['todos', this.filter()],
 *     queryFn: ({ queryKey }) => fetchTodos(queryKey[1]),
 *     enabled: () => !!this.filter(),
 *     staleTime: 30_000,
 *   })
 *
 *   // todos.value() (resource-strict), todos.data() (safe), todos.isLoading(), ...
 *   // @if (todos.hasValue()) { ... }
 * }
 * ```
 * @param config - The query options as a config object with reactive thunk fields.
 * @param options - Additional configuration such as the `Injector` to use.
 * @returns A resource-shaped query handle.
 * @see https://tanstack.com/query/latest/docs/framework/angular/guides/queries
 */
export function queryResource<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  config: QueryResourceConfig<TQueryFnData, TError, TData, TQueryKey>,
  options?: QueryResourceInjectorOptions,
): CreateQueryResourceResult<TData, TError>

/**
 * Creates a query whose handle is an Angular `Resource<TData | undefined>`.
 *
 * **Options-function form (this overload).** The whole object is re-evaluated in a
 * reactive context, so every embedded signal read is tracked — identical semantics to
 * `injectQuery(() => ({ ... }))`. Use this when you need fields other than `queryKey`
 * / `enabled` to be reactive.
 *
 * ```ts
 * class TodosComponent {
 *   filter = signal('')
 *
 *   todos = queryResource(() => ({
 *     queryKey: ['todos', this.filter()],
 *     queryFn: () => fetchTodos(this.filter()),
 *     enabled: !!this.filter(),
 *   }))
 * }
 * ```
 * @param optionsFn - A function that returns the query options.
 * @param options - Additional configuration such as the `Injector` to use.
 * @returns A resource-shaped query handle.
 * @see https://tanstack.com/query/latest/docs/framework/angular/guides/queries
 */
export function queryResource<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  optionsFn: QueryResourceOptionsFn<TQueryFnData, TError, TData, TQueryKey>,
  options?: QueryResourceInjectorOptions,
): CreateQueryResourceResult<TData, TError>

export function queryResource(
  arg: QueryResourceConfig | QueryResourceOptionsFn,
  options?: QueryResourceInjectorOptions,
): CreateQueryResourceResult {
  !options?.injector && assertInInjectionContext(queryResource)
  const injector = options?.injector ?? inject(Injector)
  return runInInjectionContext(injector, () => {
    const optionsFn =
      normalizeQueryResourceArg(arg) as () => CreateBaseQueryOptions
    return createBaseQueryResource(optionsFn, QueryObserver)
      .base as CreateQueryResourceResult
  })
}
