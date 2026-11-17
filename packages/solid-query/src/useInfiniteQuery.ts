import { InfiniteQueryObserver } from '@tanstack/query-core'
import { createMemo } from 'solid-js'
import { useBaseQueryLayer } from './useBaseQuery'
import type {
  DefaultError,
  FetchNextPageOptions,
  FetchPreviousPageOptions,
  InfiniteData,
  InfiniteQueryObserverResult,
  QueryKey,
  QueryObserver,
} from '@tanstack/query-core'
import type { QueryClient } from './QueryClient'
import type {
  DefinedUseInfiniteQueryResult,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
} from './types'
import type { Accessor } from 'solid-js'
import type {
  DefinedInitialDataInfiniteOptions,
  UndefinedInitialDataInfiniteOptions,
} from './infiniteQueryOptions'

/**
 * Page-boundary checks, mirrored from query-core's `infiniteQueryBehavior`
 * (they are module-private there — not exported through the package index).
 * Pure functions of options + cached data; keep byte-compatible with core.
 */
interface PageParamsOptions {
  getNextPageParam: (
    lastPage: unknown,
    pages: Array<unknown>,
    lastPageParam: unknown,
    pageParams: Array<unknown>,
  ) => unknown
  getPreviousPageParam?: (
    firstPage: unknown,
    pages: Array<unknown>,
    firstPageParam: unknown,
    pageParams: Array<unknown>,
  ) => unknown
}

/**
 * Checks whether `getNextPageParam` yields a param for the page after the last cached one.
 * @param options - The options holding `getNextPageParam`.
 * @param data - The cached infinite data, if any.
 * @returns `true` if there is a next page to fetch.
 */
function hasNextPage(
  options: PageParamsOptions,
  data?: InfiniteData<unknown>,
): boolean {
  if (!data || data.pages.length === 0) return false
  const lastIndex = data.pages.length - 1
  return (
    options.getNextPageParam(
      data.pages[lastIndex],
      data.pages,
      data.pageParams[lastIndex],
      data.pageParams,
    ) != null
  )
}

/**
 * Checks whether `getPreviousPageParam` yields a param for the page before the first cached one.
 * @param options - The options holding `getPreviousPageParam`.
 * @param data - The cached infinite data, if any.
 * @returns `true` if there is a previous page to fetch.
 */
function hasPreviousPage(
  options: PageParamsOptions,
  data?: InfiniteData<unknown>,
): boolean {
  if (!data || data.pages.length === 0 || !options.getPreviousPageParam)
    return false
  return (
    options.getPreviousPageParam(
      data.pages[0],
      data.pages,
      data.pageParams[0],
      data.pageParams,
    ) != null
  )
}

export function useInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: DefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  queryClient?: Accessor<QueryClient>,
): DefinedUseInfiniteQueryResult<TData, TError>

/**
 * The options for `useInfiniteQuery` are identical to `useQuery`, with the addition of
 * `initialPageParam`, `getNextPageParam`, `getPreviousPageParam`, and `maxPages`.
 * @param options - An accessor returning the {@link UndefinedInitialDataInfiniteOptions} to use — everything
 * you can pass to `useInfiniteQuery`.
 * @param queryClient - An accessor for a custom `QueryClient`. Otherwise, the one from the nearest context
 * will be used.
 * @returns The same properties as `useQuery`, with the addition of `fetchNextPage`, `fetchPreviousPage`,
 * `hasNextPage`, `hasPreviousPage`, `isFetchingNextPage`, and `isFetchingPreviousPage`. `data.pages` and
 * `data.pageParams` are also added, as long as a `select` doesn't change `TData` away from its default
 * `InfiniteData<TQueryFnData>` shape.
 * @remarks Keep in mind that imperative fetch calls, such as `fetchNextPage`, may interfere with the default
 * refetch behavior, resulting in outdated data. Make sure to call these functions only in response to user
 * actions, or add conditions like `hasNextPage && !isFetching`.
 * @see {@link infiniteQueryOptions} to share these options between `useInfiniteQuery` and imperative APIs like `queryClient.infiniteQuery`.
 * @example
 * Fetching the next page from a "Load More" button click:
 * ```tsx
 * import { For, Match, Switch } from 'solid-js'
 * import { useInfiniteQuery } from '@tanstack/solid-query'
 *
 * function Projects() {
 *   const projectsQuery = useInfiniteQuery(() => ({
 *     queryKey: ['projects'],
 *     queryFn: ({ pageParam }) => fetchProjects(pageParam),
 *     initialPageParam: 0,
 *     getNextPageParam: (lastPage) => lastPage.nextId,
 *   }))
 *
 *   return (
 *     <Switch>
 *       <Match when={projectsQuery.isPending}>Loading...</Match>
 *       <Match when={projectsQuery.isError}>Error: {projectsQuery.error.message}</Match>
 *       <Match when={projectsQuery.isSuccess}>
 *         <ul>
 *           <For each={projectsQuery.data.pages}>
 *             {(page) => <For each={page.projects}>{(p) => <li>{p.name}</li>}</For>}
 *           </For>
 *         </ul>
 *         <button
 *           onClick={() => projectsQuery.fetchNextPage()}
 *           disabled={!projectsQuery.hasNextPage || projectsQuery.isFetching}
 *         >
 *           {projectsQuery.isFetchingNextPage
 *             ? 'Loading more...'
 *             : projectsQuery.hasNextPage
 *               ? 'Load More'
 *               : 'Nothing more to load'}
 *         </button>
 *       </Match>
 *     </Switch>
 *   )
 * }
 * ```
 * @example
 * Fetching the next page automatically as the user scrolls, using an `IntersectionObserver` on a
 * sentinel element after the list:
 * ```tsx
 * import { For, Match, Switch, createEffect, onCleanup } from 'solid-js'
 * import { useInfiniteQuery } from '@tanstack/solid-query'
 *
 * function Projects() {
 *   const projectsQuery = useInfiniteQuery(() => ({
 *     queryKey: ['projects'],
 *     queryFn: ({ pageParam }) => fetchProjects(pageParam),
 *     initialPageParam: 0,
 *     getNextPageParam: (lastPage) => lastPage.nextId,
 *   }))
 *
 *   let sentinelRef: HTMLDivElement | undefined
 *
 *   createEffect(() => {
 *     if (sentinelRef == null || !projectsQuery.hasNextPage || projectsQuery.isFetching) return
 *
 *     const observer = new IntersectionObserver(([entry]) => {
 *       if (entry?.isIntersecting) projectsQuery.fetchNextPage()
 *     })
 *     observer.observe(sentinelRef)
 *
 *     onCleanup(() => observer.disconnect())
 *   })
 *
 *   return (
 *     <Switch>
 *       <Match when={projectsQuery.isPending}>Loading...</Match>
 *       <Match when={projectsQuery.isError}>Error: {projectsQuery.error.message}</Match>
 *       <Match when={projectsQuery.isSuccess}>
 *         <ul>
 *           <For each={projectsQuery.data.pages}>
 *             {(page) => <For each={page.projects}>{(p) => <li>{p.name}</li>}</For>}
 *           </For>
 *         </ul>
 *         <div ref={sentinelRef}>{projectsQuery.isFetchingNextPage ? 'Loading more...' : null}</div>
 *       </Match>
 *     </Switch>
 *   )
 * }
 * ```
 */
export function useInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: UndefinedInitialDataInfiniteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  queryClient?: Accessor<QueryClient>,
): UseInfiniteQueryResult<TData, TError>

export function useInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: UseInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  queryClient?: Accessor<QueryClient>,
): UseInfiniteQueryResult<TData, TError> {
  /**
   * Pagers ride the same entry as every other read: the base layer owns
   * the data node, meta projection, and lifecycle observer (an
   * `InfiniteQueryObserver`, so mount policy and refetches use the
   * infinite behavior). This layer adds the page surface on top.
   */
  const layer = useBaseQueryLayer(
    // `_type` is how query-core stamps a cache entry as infinite
    // (`Query.setOptions` → `#queryType`), which makes every fetch attach
    // `infiniteQueryBehavior`. Core only sets it inside
    // `InfiniteQueryObserver.setOptions`, but the adapter's pull path can
    // build and fetch the entry first (reactive key change recomputes the
    // data memo before the deferred observer effect runs) — without the
    // stamp that fetch would run as a plain query and corrupt the entry.
    createMemo(() => ({ ...options(), _type: 'infinite' }) as any),
    InfiniteQueryObserver as typeof QueryObserver,
    queryClient,
  )
  const observer = layer.observer as unknown as InfiniteQueryObserver<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >

  /**
   * Committed fetch direction — set when a page fetch dispatches,
   * version-tracked through the layer's query accessor.
   * @returns `'forward'` or `'backward'` for a page fetch, `undefined` otherwise.
   */
  const direction = () =>
    (layer.query().state.fetchMeta as any)?.fetchMore?.direction

  const pageOptions = () =>
    layer.defaultedOptions() as unknown as PageParamsOptions
  const infiniteData = () =>
    layer.query().state.data as InfiniteData<unknown> | undefined

  // Read `direction()` before `isFetching()` to work around solidjs/solid#4966.
  const isFetchingPage = (expected: 'forward' | 'backward') => {
    const current = direction()
    return layer.isFetching() && current === expected
  }
  const isFetchingNextPage = () => isFetchingPage('forward')
  const isFetchingPreviousPage = () => isFetchingPage('backward')
  const isError = () => layer.status() === 'error'

  // The base result's getters transfer as-is; the infinite surface layers
  // over them, and isRefetching/isRefetchError narrow to exclude page
  // fetches (matching core's InfiniteQueryObserver result shape).
  const result = Object.defineProperties(
    {},
    {
      ...Object.getOwnPropertyDescriptors(layer.result),
      fetchNextPage: {
        value: (fetchOptions?: FetchNextPageOptions) =>
          observer.fetchNextPage(fetchOptions),
        enumerable: true,
      },
      fetchPreviousPage: {
        value: (fetchOptions?: FetchPreviousPageOptions) =>
          observer.fetchPreviousPage(fetchOptions),
        enumerable: true,
      },
      hasNextPage: {
        get: () => hasNextPage(pageOptions(), infiniteData()),
        enumerable: true,
      },
      hasPreviousPage: {
        get: () => hasPreviousPage(pageOptions(), infiniteData()),
        enumerable: true,
      },
      isFetchingNextPage: {
        get: isFetchingNextPage,
        enumerable: true,
      },
      isFetchingPreviousPage: {
        get: isFetchingPreviousPage,
        enumerable: true,
      },
      isFetchNextPageError: {
        get: () => isError() && direction() === 'forward',
        enumerable: true,
      },
      isFetchPreviousPageError: {
        get: () => isError() && direction() === 'backward',
        enumerable: true,
      },
      isRefetching: {
        get: () => {
          const current = direction()
          return (
            layer.isFetching() &&
            layer.status() !== 'pending' &&
            current !== 'forward' &&
            current !== 'backward'
          )
        },
        enumerable: true,
      },
      isRefetchError: {
        get: () => {
          const errored = isError() && layer.query().state.dataUpdatedAt !== 0
          return errored && direction() === undefined
        },
        enumerable: true,
      },
    },
  ) as InfiniteQueryObserverResult<TData, TError>

  return result as unknown as UseInfiniteQueryResult<TData, TError>
}
