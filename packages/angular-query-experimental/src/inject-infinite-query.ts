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

/**
 * Options for `injectInfiniteQuery`, passed after the function that returns the infinite
 * query options.
 */
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
 * Injects an infinite query: a declarative dependency on an asynchronous source of data that is tied to a
 * unique key. Infinite queries can additively "load more" data onto an existing set of data, or
 * "infinite scroll".
 * @param injectInfiniteQueryFn - A function returning the {@link UndefinedInitialDataInfiniteOptions} to use
 * — everything you can pass to `injectInfiniteQuery`. Similar to `computed` from Angular, this function runs
 * in the reactive context, so signals read inside it drive the query.
 * @param options - Additional configuration.
 * @returns The same signals as `injectQuery`, with the addition of `fetchNextPage`, `fetchPreviousPage`,
 * `hasNextPage`, `hasPreviousPage`, `isFetchingNextPage`, and `isFetchingPreviousPage`. `data().pages` and
 * `data().pageParams` are also added, as long as a `select` doesn't change `TData` away from its default
 * `InfiniteData<TQueryFnData>` shape.
 * @remarks Keep in mind that imperative fetch calls, such as `fetchNextPage`, may interfere with the default
 * refetch behavior, resulting in outdated data. Make sure to call these functions only in response to user
 * actions, or add conditions like `hasNextPage() && !isFetching()`. This is the only overload that accepts
 * `queryFn: skipToken`, shown below.
 * @see {@link infiniteQueryOptions} to share these options between `injectInfiniteQuery` and imperative APIs
 * like `queryClient.fetchInfiniteQuery`.
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
 * This overload accepts the general {@link CreateInfiniteQueryOptions} shape rather than the
 * `initialData`-aware overloads above, so whether `data` is defined can't be inferred from the call site —
 * useful when wrapping `injectInfiniteQuery` in your own helper function that forwards caller-provided
 * options.
 * @param injectInfiniteQueryFn - A function that returns infinite query options. Similar to `computed` from
 * Angular, this function runs in the reactive context, so signals read inside it drive the query.
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

export function injectInfiniteQuery(
  injectInfiniteQueryFn: () => any,
  options?: InjectInfiniteQueryOptions,
) {
  !options?.injector && assertInInjectionContext(injectInfiniteQuery)

  return runInInjectionContext(options?.injector ?? inject(Injector), () =>
    createBaseQuery(injectInfiniteQueryFn, InfiniteQueryObserver),
  )
}
