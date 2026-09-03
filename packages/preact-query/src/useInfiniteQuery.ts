import { InfiniteQueryObserver } from '@tanstack/query-core'
import type {
  DefaultError,
  InfiniteData,
  QueryClient,
  QueryKey,
  QueryObserver,
} from '@tanstack/query-core'

import type {
  DefinedInitialDataInfiniteOptions,
  UndefinedInitialDataInfiniteOptions,
} from './infiniteQueryOptions'
import type {
  DefinedUseInfiniteQueryResult,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
} from './types'
import { useBaseQuery } from './useBaseQuery'

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
 * @param options - The {@link DefinedInitialDataInfiniteOptions} to use — everything you can pass to `useInfiniteQuery`, with `initialData` set.
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
 * be used.
 * @returns The same properties as `useQuery`, with the addition of `fetchNextPage`, `fetchPreviousPage`,
 * `hasNextPage`, `hasPreviousPage`, `isFetchingNextPage`, and `isFetchingPreviousPage`. `data.pages` and
 * `data.pageParams` are also added, as long as a `select` doesn't change `TData` away from its default
 * `InfiniteData<TQueryFnData>` shape.
 *
 * @example
 * ```tsx
 * import { useInfiniteQuery } from '@tanstack/preact-query'
 *
 * function Projects() {
 *   // `data` is never `undefined`, thanks to `initialData` — even if a refetch fails, so the
 *   // list stays visible alongside the error.
 *   const { data, isError, error } = useInfiniteQuery({
 *     queryKey: ['projects'],
 *     queryFn: ({ pageParam }) => fetchProjects(pageParam),
 *     initialPageParam: 0,
 *     getNextPageParam: (lastPage) => lastPage.nextId,
 *     initialData: { pages: [], pageParams: [] },
 *   })
 *
 *   return (
 *     <div>
 *       {isError ? <span>Error: {error.message}</span> : null}
 *       <ul>
 *         {data.pages.map((page) => page.projects.map((p) => <li key={p.id}>{p.name}</li>))}
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
  queryClient?: QueryClient,
): DefinedUseInfiniteQueryResult<TData, TError>

/**
 * The options for `useInfiniteQuery` are identical to `useQuery`, with the addition of
 * `initialPageParam`, `getNextPageParam`, `getPreviousPageParam`, and `maxPages`.
 *
 * @remarks Keep in mind that imperative fetch calls, such as `fetchNextPage`, may interfere with the default
 * refetch behavior, resulting in outdated data. Make sure to call these functions only in response to user
 * actions, or add conditions like `hasNextPage && !isFetching`.
 * @see {@link infiniteQueryOptions} to share these options between `useInfiniteQuery` and imperative APIs like `queryClient.infiniteQuery`.
 * @param options - The {@link UndefinedInitialDataInfiniteOptions} to use — everything you can pass to `useInfiniteQuery`.
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
 * be used.
 * @returns The same properties as `useQuery`, with the addition of `fetchNextPage`, `fetchPreviousPage`,
 * `hasNextPage`, `hasPreviousPage`, `isFetchingNextPage`, and `isFetchingPreviousPage`. `data.pages` and
 * `data.pageParams` are also added, as long as a `select` doesn't change `TData` away from its default
 * `InfiniteData<TQueryFnData>` shape.
 *
 * @example
 * Fetching the next page from a "Load More" button click:
 * ```tsx
 * import { useInfiniteQuery } from '@tanstack/preact-query'
 *
 * function Projects() {
 *   const { data, isPending, isError, error, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
 *     useInfiniteQuery({
 *       queryKey: ['projects'],
 *       queryFn: ({ pageParam }) => fetchProjects(pageParam),
 *       initialPageParam: 0,
 *       getNextPageParam: (lastPage) => lastPage.nextId,
 *     })
 *
 *   if (isPending) return 'Loading...'
 *   if (isError) return <span>Error: {error.message}</span>
 *
 *   return (
 *     <>
 *       <ul>
 *         {data.pages.map((page) =>
 *           page.projects.map((project) => <li key={project.id}>{project.name}</li>),
 *         )}
 *       </ul>
 *       <button
 *         onClick={() => fetchNextPage()}
 *         disabled={!hasNextPage || isFetching}
 *       >
 *         {isFetchingNextPage
 *           ? 'Loading more...'
 *           : hasNextPage
 *             ? 'Load More'
 *             : 'Nothing more to load'}
 *       </button>
 *     </>
 *   )
 * }
 * ```
 *
 * @example
 * Fetching the next page automatically as the user scrolls, using an `IntersectionObserver` on a
 * sentinel element after the list:
 * ```tsx
 * import { useInfiniteQuery } from '@tanstack/preact-query'
 * import { useEffect, useRef } from 'preact/hooks'
 *
 * function Projects() {
 *   const {
 *     data,
 *     isPending,
 *     isError,
 *     error,
 *     fetchNextPage,
 *     hasNextPage,
 *     isFetching,
 *     isFetchingNextPage,
 *   } = useInfiniteQuery({
 *     queryKey: ['projects'],
 *     queryFn: ({ pageParam }) => fetchProjects(pageParam),
 *     initialPageParam: 0,
 *     getNextPageParam: (lastPage) => lastPage.nextId,
 *   })
 *
 *   const sentinelRef = useRef<HTMLDivElement>(null)
 *
 *   useEffect(() => {
 *     const sentinel = sentinelRef.current
 *     if (sentinel == null || !hasNextPage || isFetching) return
 *
 *     const observer = new IntersectionObserver(([entry]) => {
 *       if (entry?.isIntersecting) fetchNextPage()
 *     })
 *     observer.observe(sentinel)
 *
 *     return () => observer.disconnect()
 *   }, [hasNextPage, isFetching, fetchNextPage])
 *
 *   if (isPending) return 'Loading...'
 *   if (isError) return <span>Error: {error.message}</span>
 *
 *   return (
 *     <>
 *       <ul>
 *         {data.pages.map((page) =>
 *           page.projects.map((project) => <li key={project.id}>{project.name}</li>),
 *         )}
 *       </ul>
 *       <div ref={sentinelRef}>{isFetchingNextPage ? 'Loading more...' : null}</div>
 *     </>
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
  queryClient?: QueryClient,
): UseInfiniteQueryResult<TData, TError>

/**
 * The options for `useInfiniteQuery` are identical to `useQuery`, with the addition of
 * `initialPageParam`, `getNextPageParam`, `getPreviousPageParam`, and `maxPages`.
 *
 * @remarks Keep in mind that imperative fetch calls, such as `fetchNextPage`, may interfere with the default
 * refetch behavior, resulting in outdated data. Make sure to call these functions only in response to user
 * actions, or add conditions like `hasNextPage && !isFetching`.
 * @see {@link infiniteQueryOptions} to share these options between `useInfiniteQuery` and imperative APIs like `queryClient.infiniteQuery`.
 * @param options - The {@link UseInfiniteQueryOptions} to use — everything you can pass to `useInfiniteQuery`.
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
 * be used.
 * @returns The same properties as `useQuery`, with the addition of `fetchNextPage`, `fetchPreviousPage`,
 * `hasNextPage`, `hasPreviousPage`, `isFetchingNextPage`, and `isFetchingPreviousPage`. `data.pages` and
 * `data.pageParams` are also added, as long as a `select` doesn't change `TData` away from its default
 * `InfiniteData<TQueryFnData>` shape.
 *
 * @example
 * Fetching the next page from a "Load More" button click:
 * ```tsx
 * import { useInfiniteQuery } from '@tanstack/preact-query'
 *
 * function Projects() {
 *   const { data, isPending, isError, error, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
 *     useInfiniteQuery({
 *       queryKey: ['projects'],
 *       queryFn: ({ pageParam }) => fetchProjects(pageParam),
 *       initialPageParam: 0,
 *       getNextPageParam: (lastPage) => lastPage.nextId,
 *     })
 *
 *   if (isPending) return 'Loading...'
 *   if (isError) return <span>Error: {error.message}</span>
 *
 *   return (
 *     <>
 *       <ul>
 *         {data.pages.map((page) =>
 *           page.projects.map((project) => <li key={project.id}>{project.name}</li>),
 *         )}
 *       </ul>
 *       <button
 *         onClick={() => fetchNextPage()}
 *         disabled={!hasNextPage || isFetching}
 *       >
 *         {isFetchingNextPage
 *           ? 'Loading more...'
 *           : hasNextPage
 *             ? 'Load More'
 *             : 'Nothing more to load'}
 *       </button>
 *     </>
 *   )
 * }
 * ```
 *
 * @example
 * Fetching the next page automatically as the user scrolls, using an `IntersectionObserver` on a
 * sentinel element after the list:
 * ```tsx
 * import { useInfiniteQuery } from '@tanstack/preact-query'
 * import { useEffect, useRef } from 'preact/hooks'
 *
 * function Projects() {
 *   const {
 *     data,
 *     isPending,
 *     isError,
 *     error,
 *     fetchNextPage,
 *     hasNextPage,
 *     isFetching,
 *     isFetchingNextPage,
 *   } = useInfiniteQuery({
 *     queryKey: ['projects'],
 *     queryFn: ({ pageParam }) => fetchProjects(pageParam),
 *     initialPageParam: 0,
 *     getNextPageParam: (lastPage) => lastPage.nextId,
 *   })
 *
 *   const sentinelRef = useRef<HTMLDivElement>(null)
 *
 *   useEffect(() => {
 *     const sentinel = sentinelRef.current
 *     if (sentinel == null || !hasNextPage || isFetching) return
 *
 *     const observer = new IntersectionObserver(([entry]) => {
 *       if (entry?.isIntersecting) fetchNextPage()
 *     })
 *     observer.observe(sentinel)
 *
 *     return () => observer.disconnect()
 *   }, [hasNextPage, isFetching, fetchNextPage])
 *
 *   if (isPending) return 'Loading...'
 *   if (isError) return <span>Error: {error.message}</span>
 *
 *   return (
 *     <>
 *       <ul>
 *         {data.pages.map((page) =>
 *           page.projects.map((project) => <li key={project.id}>{project.name}</li>),
 *         )}
 *       </ul>
 *       <div ref={sentinelRef}>{isFetchingNextPage ? 'Loading more...' : null}</div>
 *     </>
 *   )
 * }
 * ```
 *
 * @example
 * A query that's disabled, type safe, until `postId` is set — pass `skipToken` as `queryFn`
 * instead of setting `enabled: false`:
 * ```tsx
 * import { skipToken, useInfiniteQuery } from '@tanstack/preact-query'
 *
 * function Comments({ postId }: { postId: string | undefined }) {
 *   // Use `isLoading`, not `isPending`, so the loading state doesn't show while the query is disabled.
 *   const { data, isLoading, isError, error } = useInfiniteQuery({
 *     queryKey: ['post', postId, 'comments'],
 *     queryFn:
 *       postId != null
 *         ? ({ pageParam }) => fetchComments(postId, pageParam)
 *         : skipToken,
 *     initialPageParam: 0,
 *     getNextPageParam: (lastPage) => lastPage.nextId,
 *   })
 *
 *   if (postId == null) return 'Select a post'
 *   if (isLoading) return 'Loading...'
 *   if (isError) return <span>Error: {error.message}</span>
 *
 *   return (
 *     <ul>
 *       {data?.pages.map((page) => page.comments.map((c) => <li key={c.id}>{c.text}</li>))}
 *     </ul>
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
  options: UseInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  queryClient?: QueryClient,
): UseInfiniteQueryResult<TData, TError>

export function useInfiniteQuery(
  options: UseInfiniteQueryOptions,
  queryClient?: QueryClient,
) {
  return useBaseQuery(
    options,
    InfiniteQueryObserver as typeof QueryObserver,
    queryClient,
  )
}
