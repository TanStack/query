'use client'
import * as React from 'react'
import { notifyManager } from '@tanstack/query-core'

import { useQueryClient } from './QueryClientProvider'
import type { QueryClient, QueryFilters } from '@tanstack/query-core'

/**
 * `useIsFetching` is an optional hook that returns the `number` of the queries that your application is loading or
 * fetching in the background (useful for app-wide loading indicators).
 *
 * @param filters - The {@link QueryFilters} to narrow down the matched queries.
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
 * be used.
 * @returns Will be the `number` of the queries that your application is currently loading or fetching in the
 * background.
 *
 * @example
 * ```tsx
 * import { useIsFetching } from '@tanstack/react-query'
 *
 * function PostsFetchingIndicator() {
 *   // How many queries matching the posts prefix are fetching?
 *   const isFetchingPosts = useIsFetching({ queryKey: ['posts'] })
 *
 *   return isFetchingPosts ? <span>Refreshing posts...</span> : null
 * }
 * ```
 *
 * @example
 * A global loading indicator for any query fetching in the background, not just the ones on screen:
 * ```tsx
 * import { useIsFetching } from '@tanstack/react-query'
 *
 * function GlobalLoadingIndicator() {
 *   const isFetching = useIsFetching()
 *
 *   return isFetching ? (
 *     <div>Queries are fetching in the background...</div>
 *   ) : null
 * }
 * ```
 */
export function useIsFetching(
  filters?: QueryFilters,
  queryClient?: QueryClient,
): number {
  const client = useQueryClient(queryClient)
  const queryCache = client.getQueryCache()

  return React.useSyncExternalStore(
    React.useCallback(
      (onStoreChange) =>
        queryCache.subscribe(notifyManager.batchCalls(onStoreChange)),
      [queryCache],
    ),
    () => client.isFetching(filters),
    () => client.isFetching(filters),
  )
}
