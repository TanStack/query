import { QueryObserver } from '@tanstack/query-core'
import { assertInInjectionContext, untracked } from '@angular/core'
import { injectQueryZone } from './utils/inject-query-zone'
import { injectBaseQuery } from './inject-base-query'
import { signalProxy } from './utils/signal-proxy'
import { queryResultFields } from './utils/result-fields'
import type {
  DefaultError,
  QueryKey,
  RefetchOptions,
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

/**
 * This overload is selected when `initialData` is set on the options returned by `optionsFn`, so the
 * resulting `data` signal is never `undefined` (unless a `select` changes `TData` to include `undefined`).
 *
 * @see https://tanstack.com/query/latest/docs/framework/angular/guides/queries
 * @see {@link queryOptions} to share these options between `injectQuery` and imperative APIs like
 * `queryClient.query`.
 * @param optionsFn - A function returning the {@link DefinedInitialDataOptions} to use — everything you
 * can pass to `injectQuery`, with `initialData` set. Similar to `computed` from Angular, this function runs
 * in the reactive context, so signals read inside it (in `queryKey`, `enabled`, etc.) drive the query.
 * @returns The query result, typed so that `data` is never `undefined` (unless a `select` changes `TData` to
 * include `undefined`).
 *
 * @example
 * ```angular-ts
 * @Component({
 *   selector: 'posts',
 *   template: `
 *     <!-- `postsQuery.data()` is `Post[]`, never `undefined`, thanks to `initialData` — even if a
 *     refetch fails, so the list stays visible alongside the error. -->
 *     @if (postsQuery.isError()) {
 *       <span>Error: {{ postsQuery.error()?.message }}</span>
 *     }
 *     <ul>
 *       @for (post of postsQuery.data(); track post.id) {
 *         <li>{{ post.title }}</li>
 *       }
 *     </ul>
 *   `,
 * })
 * export class Posts {
 *   readonly postsQuery = injectQuery(() => ({
 *     queryKey: ['posts'],
 *     queryFn: fetchPosts,
 *     initialData: [],
 *   }))
 * }
 * ```
 */
export function injectQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  optionsFn: () => DefinedInitialDataOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey
  >,
): DefinedCreateQueryResult<TData, TError>

/**
 * Injects a query: a declarative dependency on an asynchronous source of data that is tied to a unique key.
 *
 * @see https://tanstack.com/query/latest/docs/framework/angular/guides/queries
 * @see {@link queryOptions} to share these options between `injectQuery` and imperative APIs like
 * `queryClient.query`.
 * @param optionsFn - A function returning the {@link UndefinedInitialDataOptions} to use — everything
 * you can pass to `injectQuery`. Similar to `computed` from Angular, this function runs in the reactive
 * context, so signals read inside it (in `queryKey`, `enabled`, etc.) drive the query.
 * @returns The query result. `status()` is `'pending'` if there is no cached data to display, `'error'` if
 * the last fetch attempt failed, or `'success'` if the query has data to display. `isPending`/`isSuccess`/
 * `isError` are type-guard methods for convenience.
 *
 * @example
 * ```angular-ts
 * @Component({
 *   selector: 'posts',
 *   template: `
 *     @if (postsQuery.isPending()) {
 *       Loading...
 *     } @else if (postsQuery.isError()) {
 *       <span>Error: {{ postsQuery.error()?.message }}</span>
 *     } @else {
 *       <ul>
 *         @for (post of postsQuery.data(); track post.id) {
 *           <li>{{ post.title }}</li>
 *         }
 *       </ul>
 *     }
 *   `,
 * })
 * export class Posts {
 *   readonly postsQuery = injectQuery(() => ({
 *     queryKey: ['posts'],
 *     queryFn: fetchPosts,
 *   }))
 * }
 * ```
 *
 * @example
 * Similar to `computed` from Angular, the function passed to `injectQuery` runs in the reactive context. In
 * the example below, the query is automatically enabled and executed when the filter signal changes to a
 * truthy value. When the filter signal changes back to a falsy value, the query is disabled.
 * ```angular-ts
 * @Component({
 *   selector: 'posts',
 *   template: `
 *     <input [ngModel]="filter()" (ngModelChange)="filter.set($event)" />
 *     @if (postsQuery.isPending()) {
 *       Loading...
 *     } @else if (postsQuery.isError()) {
 *       <span>Error: {{ postsQuery.error()?.message }}</span>
 *     } @else {
 *       <ul>
 *         @for (post of postsQuery.data(); track post.id) {
 *           <li>{{ post.title }}</li>
 *         }
 *       </ul>
 *     }
 *   `,
 * })
 * export class Posts {
 *   readonly filter = signal('')
 *
 *   readonly postsQuery = injectQuery(() => ({
 *     queryKey: ['posts', this.filter()],
 *     queryFn: () => fetchPosts(this.filter()),
 *     enabled: !!this.filter(),
 *   }))
 * }
 * ```
 */
export function injectQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  optionsFn: () => UndefinedInitialDataOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey
  >,
): CreateQueryResult<TData, TError>

/**
 * This overload accepts the general {@link CreateQueryOptions} shape rather than the `initialData`-aware
 * overloads above, so whether `data` is defined can't be inferred from the call site — useful when wrapping
 * `injectQuery` in your own helper function that forwards caller-provided options.
 *
 * @see https://tanstack.com/query/latest/docs/framework/angular/guides/queries
 * @param optionsFn - A function that returns query options. Similar to `computed` from Angular, this
 * function runs in the reactive context, so signals read inside it drive the query.
 * @returns The query result.
 */
export function injectQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  optionsFn: () => CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): CreateQueryResult<TData, TError>

export function injectQuery(
  optionsFn: () => CreateQueryOptions,
): DefinedCreateQueryResult | CreateQueryResult {
  if (typeof ngDevMode === 'undefined' || ngDevMode) {
    assertInInjectionContext(injectQuery)
  }
  const outsideZone = injectQueryZone()
  const [resultSignal, getObserver] = injectBaseQuery(optionsFn, QueryObserver)
  return Object.assign(signalProxy(resultSignal, queryResultFields), {
    refetch: (options?: RefetchOptions) =>
      outsideZone(() => untracked(() => getObserver().refetch(options))),
  }) as unknown as DefinedCreateQueryResult | CreateQueryResult
}
