'use client'

import { infiniteQuery } from './infiniteQuery'
import { suspenseQuery } from './suspenseQuery'
import { useQuery } from './useQuery'
import type {
  DefaultError,
  InfiniteData,
  OmitKeyof,
  QueryKey,
} from '@tanstack/query-core'
import type { QueryClient } from './runtime/queryClient'
import type {
  AnyUseInfiniteQueryOptions,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  UseSuspenseInfiniteQueryOptions,
  UseSuspenseInfiniteQueryResult,
} from './types'

type SkippableSuspenseInfiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey,
  TPageParam,
> = OmitKeyof<
  UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
  'enabled' | 'throwOnError'
>

/**
 * The options for `useSuspenseInfiniteQuery` are the same as for `useInfiniteQuery`, except for `throwOnError`
 * and `enabled`.
 *
 * Caveat: cancellation does not work.
 * @param options - The {@link UseSuspenseInfiniteQueryOptions} to use — the same options as `useInfiniteQuery`, minus the ones listed above.
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
 * be used.
 * @returns The same object as `useInfiniteQuery`, except that `data` is guaranteed to be defined,
 * `isPlaceholderData` is missing, and `status` is either `success` or `error` (with the derived flags set
 * accordingly).
 * @remarks Multiple suspenseful query calls in the same component suspend serially, causing a request
 * waterfall — each one blocks rendering until it resolves, so the next doesn't even start fetching until
 * then. There's no way to parallelize multiple infinite queries under Suspense. Also keep in mind that
 * imperative fetch calls, such as `fetchNextPage`, may interfere with the default refetch behavior,
 * resulting in outdated data. Make sure to call these functions only in response to user actions, or add
 * conditions like `hasNextPage && !isFetching`.
 * @see {@link useInfiniteQuery} for the non-Suspense version of this hook.
 * @example
 * The query error is thrown if a fetch fails and no cached data exists yet, so an error boundary is
 * required around `<Suspense>`. A failed background refetch instead continues to render the cached data.
 * Use {@link QueryErrorResetBoundary} to let the user retry after such an error:
 * ```tsx
 * import { Suspense } from 'react'
 * import { ErrorBoundary } from 'react-error-boundary'
 * import {
 *   QueryErrorResetBoundary,
 *   useSuspenseInfiniteQuery,
 * } from '@tanstack/react-query-pluggable'
 *
 * function Projects() {
 *   // `data` is guaranteed to be defined here — no `isPending` check needed.
 *   const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
 *     useSuspenseInfiniteQuery({
 *       queryKey: ['projects'],
 *       queryFn: ({ pageParam }) => fetchProjects(pageParam),
 *       initialPageParam: 0,
 *       getNextPageParam: (lastPage) => lastPage.nextId,
 *     })
 *
 *   return (
 *     <div>
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
 *     </div>
 *   )
 * }
 *
 * function App() {
 *   return (
 *     <QueryErrorResetBoundary>
 *       {({ reset }) => (
 *         <ErrorBoundary
 *           onReset={reset}
 *           fallbackRender={({ resetErrorBoundary }) => (
 *             <div>
 *               There was an error!
 *               <button onClick={() => resetErrorBoundary()}>Try again</button>
 *             </div>
 *           )}
 *         >
 *           <Suspense fallback={<h1>Loading projects...</h1>}>
 *             <Projects />
 *           </Suspense>
 *         </ErrorBoundary>
 *       )}
 *     </QueryErrorResetBoundary>
 *   )
 * }
 * ```
 */
export function useSuspenseInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: UseSuspenseInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  queryClient?: QueryClient,
): UseSuspenseInfiniteQueryResult<TData, TError>

/**
 * A skipped query does not fetch automatically or suspend. Query errors without cached
 * data reach the nearest error boundary.
 * @param options - The infinite query options. The query function can be `skipToken`.
 * @param queryClient - The client to use. Defaults to the client from the nearest context.
 * @returns An infinite query result that can be pending and can have undefined data.
 */
export function useSuspenseInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: SkippableSuspenseInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  queryClient?: QueryClient,
): UseInfiniteQueryResult<TData, TError>

export function useSuspenseInfiniteQuery(
  options: AnyUseInfiniteQueryOptions,
  queryClient?: QueryClient,
) {
  return useQuery(suspenseQuery(infiniteQuery(options)), queryClient)
}
