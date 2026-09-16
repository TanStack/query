import { InfiniteQueryObserver } from '@tanstack/query-core'
import { assertInInjectionContext, untracked } from '@angular/core'
import { injectQueryZone } from './utils/inject-query-zone'
import { injectBaseQuery } from './inject-base-query'
import { signalProxy } from './utils/signal-proxy'
import { infiniteQueryResultFields } from './utils/result-fields'
import type {
  DefaultError,
  FetchNextPageOptions,
  FetchPreviousPageOptions,
  InfiniteData,
  InfiniteQueryObserverResult,
  QueryKey,
  QueryObserver,
  RefetchOptions,
} from '@tanstack/query-core'
import type { Signal } from '@angular/core'
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
 * This overload is selected when `initialData` is set, so the resulting `data` signal is never `undefined`
 * (unless a `select` changes `TData` to include `undefined`).
 *
 * @see https://tanstack.com/query/latest/docs/framework/angular/guides/infinite-queries
 * @see {@link infiniteQueryOptions} to share these options between `injectInfiniteQuery` and
 * `queryClient.infiniteQuery`.
 * @param optionsFn - A function returning infinite-query options with `initialData` set. Similar to
 * `computed` from Angular, this function runs in the reactive context.
 * @returns The infinite query result, typed so that `data` is never `undefined`.
 */
export function injectInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  optionsFn: () => DefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
): DefinedCreateInfiniteQueryResult<TData, TError>

/**
 * Injects an infinite query: a declarative dependency on an asynchronous source of data that is tied to a unique key.
 * Infinite queries can additively "load more" data onto an existing set of data or support infinite scroll.
 *
 * @see https://tanstack.com/query/latest/docs/framework/angular/guides/infinite-queries
 * @see {@link infiniteQueryOptions} to share these options between `injectInfiniteQuery` and
 * `queryClient.infiniteQuery`.
 * @param optionsFn - A function that returns infinite query options. Similar to `computed` from Angular,
 * this function runs in the reactive context, so signals read inside it drive the query.
 * @returns The infinite query result.
 *
 * @example
 * ```angular-ts
 * @Component({
 *   selector: 'projects',
 *   template: `
 *     @if (query.isPending()) {
 *       Loading...
 *     } @else if (query.isError()) {
 *       <span>Error: {{ query.error()?.message }}</span>
 *     } @else {
 *       @for (page of query.data().pages; track $index) {
 *         @for (project of page; track project.id) {
 *           <p>{{ project.name }}</p>
 *         }
 *       }
 *       <button (click)="query.fetchNextPage()">Load more</button>
 *     }
 *   `,
 * })
 * export class Projects {
 *   readonly query = injectInfiniteQuery(() => ({
 *     queryKey: ['projects'],
 *     queryFn: ({ pageParam }) => fetchProjects(pageParam),
 *     initialPageParam: 0,
 *     getNextPageParam: (lastPage) => lastPage.nextCursor,
 *   }))
 * }
 * ```
 */
export function injectInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  optionsFn: () => UndefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
): CreateInfiniteQueryResult<TData, TError>

/**
 * This overload accepts the general {@link CreateInfiniteQueryOptions} shape rather than the
 * `initialData`-aware overloads above, so whether `data` is defined can't be inferred from the call
 * site — useful when wrapping `injectInfiniteQuery` in your own helper.
 *
 * @see https://tanstack.com/query/latest/docs/framework/angular/guides/infinite-queries
 * @param optionsFn - A function that returns infinite query options. Similar to `computed` from Angular,
 * this function runs in the reactive context, so signals read inside it drive the query.
 * @returns The infinite query result.
 */
export function injectInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  optionsFn: () => CreateInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
): CreateInfiniteQueryResult<TData, TError>

export function injectInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  optionsFn: () =>
    | DefinedInitialDataInfiniteOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryKey,
        TPageParam
      >
    | CreateInfiniteQueryOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryKey,
        TPageParam
      >,
):
  | DefinedCreateInfiniteQueryResult<TData, TError>
  | CreateInfiniteQueryResult<TData, TError> {
  if (typeof ngDevMode === 'undefined' || ngDevMode) {
    assertInInjectionContext(injectInfiniteQuery)
  }
  const outsideZone = injectQueryZone()
  const [resultSignal, getObserver] = injectBaseQuery(
    optionsFn,
    InfiniteQueryObserver as typeof QueryObserver,
  )
  const getInfiniteObserver = () =>
    getObserver() as InfiniteQueryObserver<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >
  return Object.assign(
    signalProxy(
      resultSignal as Signal<InfiniteQueryObserverResult<TData, TError>>,
      infiniteQueryResultFields,
    ),
    {
      refetch: (options?: RefetchOptions) =>
        outsideZone(() =>
          untracked(() => getInfiniteObserver().refetch(options)),
        ),
      fetchNextPage: (options?: FetchNextPageOptions) =>
        outsideZone(() =>
          untracked(() => getInfiniteObserver().fetchNextPage(options)),
        ),
      fetchPreviousPage: (options?: FetchPreviousPageOptions) =>
        outsideZone(() =>
          untracked(() => getInfiniteObserver().fetchPreviousPage(options)),
        ),
    },
  ) as unknown as
    | DefinedCreateInfiniteQueryResult<TData, TError>
    | CreateInfiniteQueryResult<TData, TError>
}
