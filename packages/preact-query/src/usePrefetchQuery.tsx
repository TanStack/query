import { noop } from '@tanstack/query-core'
import { useQueryClient } from './QueryClientProvider'

import type { DefaultError, QueryClient, QueryKey } from '@tanstack/query-core'
import type { UsePrefetchQueryOptions } from './types'

/**
 * `usePrefetchQuery` does not return anything, it should be used just to fire a prefetch during render, before
 * a suspense boundary that wraps a component that uses `useSuspenseQuery`. You can pass everything to
 * `usePrefetchQuery` that you can pass to `queryClient.query`, though `queryKey` is always required, and
 * `queryFn` is required unless a default query function has been defined.
 *
 * @param options - The {@link UsePrefetchQueryOptions} to use — everything you can pass to `queryClient.query`.
 * @param queryClient - Use this to use a custom QueryClient. Otherwise, the one from the nearest context will
 * be used.
 * @returns `void` — nothing is returned.
 *
 * @example
 * ```tsx
 * import { Suspense } from 'preact/compat'
 * import { usePrefetchQuery } from '@tanstack/preact-query'
 *
 * function App() {
 *   // Fire the prefetch during render, before the suspense boundary below.
 *   usePrefetchQuery({
 *     queryKey: ['posts'],
 *     queryFn: fetchPosts,
 *   })
 *
 *   return (
 *     <Suspense fallback={<h1>Loading posts...</h1>}>
 *       <Posts />
 *     </Suspense>
 *   )
 * }
 * ```
 */
export function usePrefetchQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UsePrefetchQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >,
  queryClient?: QueryClient,
) {
  const client = useQueryClient(queryClient)

  if (!client.getQueryState(options.queryKey)) {
    void client.fetchQuery(options).catch(noop)
  }
}
