import { InfiniteQueryObserver } from '@tanstack/query-core'
import { createMemo } from 'solid-js'
import { useBaseQuery } from './useBaseQuery'
import type {
  DefaultError,
  InfiniteData,
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
 * The options for `useInfiniteQuery` are identical to `useQuery`, with the addition of
 * `initialPageParam`, `getNextPageParam`, `getPreviousPageParam`, and `maxPages`.
 *
 * This overload is selected when `initialData` is set.
 *
 * @remarks Keep in mind that imperative fetch calls, such as `fetchNextPage`, may interfere with the default
 * refetch behavior, resulting in outdated data. Make sure to call these functions only in response to user
 * actions, or add conditions like `hasNextPage && !isFetching`.
 * @see {@link infiniteQueryOptions} to share these options between `useInfiniteQuery` and imperative APIs like `queryClient.infiniteQuery`.
 * @param options - An accessor returning the {@link DefinedInitialDataInfiniteOptions} to use — everything you
 * can pass to `useInfiniteQuery`, with `initialData` set.
 * @param queryClient - An accessor for a custom `QueryClient`. Otherwise, the one from the nearest context
 * will be used.
 * @returns The same properties as `useQuery`, with the addition of `fetchNextPage`, `fetchPreviousPage`,
 * `hasNextPage`, `hasPreviousPage`, `isFetchingNextPage`, and `isFetchingPreviousPage`. `data.pages` and
 * `data.pageParams` are also added, as long as a `select` doesn't change `TData` away from its default
 * `InfiniteData<TQueryFnData>` shape.
 *
 * @example
 * ```tsx
 * import { For } from 'solid-js'
 * import { useInfiniteQuery } from '@tanstack/solid-query'
 *
 * function Projects() {
 *   // `projectsQuery.data` is never `undefined`, thanks to `initialData` — even if a refetch fails, so the
 *   // list stays visible alongside the error.
 *   const projectsQuery = useInfiniteQuery(() => ({
 *     queryKey: ['projects'],
 *     queryFn: ({ pageParam }) => fetchProjects(pageParam),
 *     initialPageParam: 0,
 *     getNextPageParam: (lastPage) => lastPage.nextId,
 *     initialData: { pages: [], pageParams: [] },
 *   }))
 *
 *   return (
 *     <div>
 *       {projectsQuery.isError ? <span>Error: {projectsQuery.error.message}</span> : null}
 *       <ul>
 *         <For each={projectsQuery.data.pages}>
 *           {(page) => <For each={page.projects}>{(p) => <li>{p.name}</li>}</For>}
 *         </For>
 *       </ul>
 *     </div>
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
 *
 * @remarks Keep in mind that imperative fetch calls, such as `fetchNextPage`, may interfere with the default
 * refetch behavior, resulting in outdated data. Make sure to call these functions only in response to user
 * actions, or add conditions like `hasNextPage && !isFetching`.
 * @see {@link infiniteQueryOptions} to share these options between `useInfiniteQuery` and imperative APIs like `queryClient.infiniteQuery`.
 * @param options - An accessor returning the {@link UndefinedInitialDataInfiniteOptions} to use — everything
 * you can pass to `useInfiniteQuery`.
 * @param queryClient - An accessor for a custom `QueryClient`. Otherwise, the one from the nearest context
 * will be used.
 * @returns The same properties as `useQuery`, with the addition of `fetchNextPage`, `fetchPreviousPage`,
 * `hasNextPage`, `hasPreviousPage`, `isFetchingNextPage`, and `isFetchingPreviousPage`. `data.pages` and
 * `data.pageParams` are also added, as long as a `select` doesn't change `TData` away from its default
 * `InfiniteData<TQueryFnData>` shape.
 *
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
 *
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
  return useBaseQuery(
    createMemo(() => options()),
    InfiniteQueryObserver as typeof QueryObserver,
    queryClient,
  ) as UseInfiniteQueryResult<TData, TError>
}
