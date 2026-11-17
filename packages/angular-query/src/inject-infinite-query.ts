import { assertInInjectionContext, untracked } from '@angular/core'
import { InfiniteQueryObserver } from '@tanstack/query-core'
import { injectBaseQuery } from './inject-base-query'
import { injectQueryZone } from './utils/inject-query-zone'
import { infiniteQueryResultFields } from './utils/result-fields'
import { signalProxy } from './utils/signal-proxy'
import type { Signal } from '@angular/core'
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
import type {
  DefinedInitialDataInfiniteOptions,
  UndefinedInitialDataInfiniteOptions,
} from './infinite-query-options'
import type {
  CreateInfiniteQueryOptions,
  CreateInfiniteQueryResult,
  DefinedCreateInfiniteQueryResult,
} from './types'

/**
 * The options for `injectInfiniteQuery` are identical to `injectQuery`, with the addition of
 * `initialPageParam`, `getNextPageParam`, `getPreviousPageParam`, and `maxPages`. Infinite queries can
 * additively "load more" data onto an existing set of data, or "infinite scroll".
 *
 * This overload is selected when `initialData` is known to be defined on the options returned by
 * `optionsFn`, so the resulting `data` signal is never `undefined` (unless a `select` changes
 * `TData` to include `undefined`).
 * @param optionsFn - A function returning the {@link DefinedInitialDataInfiniteOptions} to use —
 * everything you can pass to `injectInfiniteQuery`, with `initialData` known to be defined. Similar to
 * `computed` from Angular, this function runs in the reactive context, so signals read inside it drive the
 * query.
 * @returns The same signals as `injectQuery`, with the addition of `fetchNextPage`, `fetchPreviousPage`,
 * `hasNextPage`, `hasPreviousPage`, `isFetchingNextPage`, and `isFetchingPreviousPage`. `data().pages` and
 * `data().pageParams` are also added, as long as a `select` doesn't change `TData` away from its default
 * `InfiniteData<TQueryFnData>` shape.
 * @remarks Keep in mind that imperative fetch calls, such as `fetchNextPage`, may interfere with the default
 * refetch behavior, resulting in outdated data. Make sure to call these functions only in response to user
 * actions, or add conditions like `hasNextPage() && !isFetching()`.
 * @see https://tanstack.com/query/latest/docs/framework/angular/guides/infinite-queries
 * @see {@link infiniteQueryOptions} to share these options between `injectInfiniteQuery` and imperative APIs
 * like `queryClient.infiniteQuery`.
 * @example
 * ```angular-ts
 * @Component({
 *   selector: 'projects',
 *   template: `
 *     <!-- projectsQuery.data() is never undefined, thanks to initialData — even if a
 *     refetch fails, so the list stays visible alongside the error. -->
 *     <ul>
 *       @for (page of projectsQuery.data().pages; track $index) {
 *         @for (project of page.projects; track project.id) {
 *           <li>{{ project.name }}</li>
 *         }
 *       }
 *     </ul>
 *   `,
 * })
 * export class Projects {
 *   readonly projectsQuery = injectInfiniteQuery(() => ({
 *     queryKey: ['projects'],
 *     queryFn: ({ pageParam }) => fetchProjects(pageParam),
 *     initialPageParam: 0,
 *     getNextPageParam: (lastPage) => lastPage.nextId,
 *     initialData: { pages: [], pageParams: [] },
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
  optionsFn: () => DefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
): DefinedCreateInfiniteQueryResult<TData, TError>

/**
 * Injects an infinite query: a declarative dependency on an asynchronous source of data that is tied to a
 * unique key. Infinite queries can additively "load more" data onto an existing set of data, or
 * "infinite scroll".
 * @param optionsFn - A function returning the {@link UndefinedInitialDataInfiniteOptions} to use
 * — everything you can pass to `injectInfiniteQuery`. Similar to `computed` from Angular, this function runs
 * in the reactive context, so signals read inside it drive the query.
 * @returns The same signals as `injectQuery`, with the addition of `fetchNextPage`, `fetchPreviousPage`,
 * `hasNextPage`, `hasPreviousPage`, `isFetchingNextPage`, and `isFetchingPreviousPage`. `data().pages` and
 * `data().pageParams` are also added, as long as a `select` doesn't change `TData` away from its default
 * `InfiniteData<TQueryFnData>` shape.
 * @remarks Keep in mind that imperative fetch calls, such as `fetchNextPage`, may interfere with the default
 * refetch behavior, resulting in outdated data. Make sure to call these functions only in response to user
 * actions, or add conditions like `hasNextPage() && !isFetching()`. `queryFn: skipToken` is also accepted,
 * shown below.
 * @see https://tanstack.com/query/latest/docs/framework/angular/guides/infinite-queries
 * @see {@link infiniteQueryOptions} to share these options between `injectInfiniteQuery` and imperative APIs
 * like `queryClient.infiniteQuery`.
 * @example
 * Fetching the next page from a button click:
 * ```angular-ts
 * @Component({
 *   selector: 'projects-list',
 *   template: `
 *     <ul>
 *       @for (page of projectsQuery.data()?.pages; track $index) {
 *         @for (project of page.projects; track project.id) {
 *           <li>{{ project.name }}</li>
 *         }
 *       }
 *     </ul>
 *     <button
 *       [disabled]="!projectsQuery.hasNextPage() || projectsQuery.isFetching()"
 *       (click)="projectsQuery.fetchNextPage()"
 *     >
 *       Load More
 *     </button>
 *   `,
 * })
 * export class ProjectsList {
 *   readonly projectsQuery = injectInfiniteQuery(() => ({
 *     queryKey: ['projects'],
 *     queryFn: ({ pageParam }) => fetchProjects(pageParam),
 *     initialPageParam: 0,
 *     getNextPageParam: (lastPage) => lastPage.nextId,
 *   }))
 * }
 * ```
 * @example
 * Fetching the next page automatically as the user scrolls, using an `IntersectionObserver` on a sentinel
 * element after the list:
 * ```angular-ts
 * @Component({
 *   selector: 'projects-list',
 *   template: `
 *     <ul>
 *       @for (page of projectsQuery.data()?.pages; track $index) {
 *         @for (project of page.projects; track project.id) {
 *           <li>{{ project.name }}</li>
 *         }
 *       }
 *     </ul>
 *     <div #sentinel>{{ projectsQuery.isFetchingNextPage() ? 'Loading more...' : '' }}</div>
 *   `,
 * })
 * export class ProjectsList {
 *   readonly sentinel = viewChild<ElementRef<HTMLElement>>('sentinel')
 *
 *   readonly projectsQuery = injectInfiniteQuery(() => ({
 *     queryKey: ['projects'],
 *     queryFn: ({ pageParam }) => fetchProjects(pageParam),
 *     initialPageParam: 0,
 *     getNextPageParam: (lastPage) => lastPage.nextId,
 *   }))
 *
 *   constructor() {
 *     effect((onCleanup) => {
 *       const sentinel = this.sentinel()?.nativeElement
 *       if (
 *         sentinel == null ||
 *         !this.projectsQuery.hasNextPage() ||
 *         this.projectsQuery.isFetching()
 *       ) {
 *         return
 *       }
 *
 *       const observer = new IntersectionObserver(([entry]) => {
 *         if (entry?.isIntersecting) this.projectsQuery.fetchNextPage()
 *       })
 *       observer.observe(sentinel)
 *
 *       onCleanup(() => observer.disconnect())
 *     })
 *   }
 * }
 * ```
 * @example
 * A query that's disabled, type safe, until `postId` is set — pass `skipToken` as `queryFn` instead of
 * setting `enabled: false`:
 * ```angular-ts
 * @Component({
 *   selector: 'comments',
 *   template: `
 *     @if (postId() == null) {
 *       Select a post
 *     } @else if (commentsQuery.isPending()) {
 *       Loading...
 *     } @else if (commentsQuery.isError()) {
 *       <span>Error: {{ commentsQuery.error()?.message }}</span>
 *     } @else {
 *       <ul>
 *         @for (page of commentsQuery.data().pages; track $index) {
 *           @for (comment of page.comments; track comment.id) {
 *             <li>{{ comment.text }}</li>
 *           }
 *         }
 *       </ul>
 *     }
 *   `,
 * })
 * export class Comments {
 *   readonly postId = signal<string | undefined>(undefined)
 *
 *   readonly commentsQuery = injectInfiniteQuery(() => ({
 *     queryKey: ['post', this.postId(), 'comments'],
 *     queryFn:
 *       this.postId() != null
 *         ? ({ pageParam }) => fetchComments(this.postId()!, pageParam)
 *         : skipToken,
 *     initialPageParam: 0,
 *     getNextPageParam: (lastPage) => lastPage.nextId,
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
 * `initialData`-aware overloads above, so whether `data` is defined can't be inferred from the call site —
 * useful when wrapping `injectInfiniteQuery` in your own helper function that forwards caller-provided
 * options.
 * @param optionsFn - A function that returns infinite query options. Similar to `computed` from
 * Angular, this function runs in the reactive context, so signals read inside it drive the query.
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
