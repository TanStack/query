import { useQueryClient } from './QueryClientProvider'
import { noop } from './runtime/utils'
import type {
  DefaultError,
  InfiniteData,
  QueryKey,
} from '@tanstack/query-types/bindings'
import type { QueryClient } from './runtime/queryClient'
import type { UsePrefetchInfiniteQueryOptions } from './types'

/**
 * `usePrefetchInfiniteQuery` does not return anything, it should be used just to fire a prefetch during render,
 * before a suspense boundary that wraps a component that uses `useSuspenseInfiniteQuery`. You can pass
 * everything to `usePrefetchInfiniteQuery` that you can pass to `queryClient.infiniteQuery`, though
 * `queryKey`, `initialPageParam`, and `getNextPageParam` are always required, and `queryFn` is required. Pass `defaultQueryFn` to use the client defaults.
 *
 * `getNextPageParam` receives both the last page of the infinite list of data and the full array of all pages,
 * as well as pageParam information, and should return a single variable that will be passed to your query
 * function as `context.pageParam`. Return `undefined` or `null` to indicate there is no next page available.
 *
 * The prefetch is skipped if the query already has any cached state — including a `pending`/`error` state left
 * over from a previous attempt — so calling this on every render is cheap and won't refetch data that's
 * already there or already in flight.
 * @param options - The {@link UsePrefetchInfiniteQueryOptions} to use — everything you can pass to `queryClient.infiniteQuery`.
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
 * be used.
 * @example
 * ```tsx
 * import { Suspense } from 'react'
 * import { infiniteQueryOptions, usePrefetchInfiniteQuery } from '@tanstack/react-query-no-core-pluggable'
 *
 * const projectsOptions = infiniteQueryOptions({
 *   queryKey: ['projects'],
 *   queryFn: ({ pageParam }) => fetchProjects(pageParam),
 *   initialPageParam: 0,
 *   getNextPageParam: (lastPage) => lastPage.nextId,
 * })
 *
 * function App() {
 *   // Fire the prefetch during render, before the suspense boundary below.
 *   usePrefetchInfiniteQuery(projectsOptions)
 *
 *   return (
 *     <Suspense fallback={<h1>Loading projects...</h1>}>
 *       <Projects />
 *     </Suspense>
 *   )
 * }
 * ```
 */
export function usePrefetchInfiniteQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: UsePrefetchInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  queryClient?: QueryClient,
): void {
  const client = useQueryClient(queryClient)

  if (!client.getQueryState(options.queryKey)) {
    void client.infiniteQuery(options).catch(noop)
  }
}
