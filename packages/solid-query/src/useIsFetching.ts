import { createMemo } from 'solid-js'
import { createCacheAggregate } from './cacheAggregate'
import { useQueryClient } from './QueryClientProvider'
import type { QueryFilters } from '@tanstack/query-core'
import type { QueryClient } from './QueryClient'
import type { Accessor } from 'solid-js'

/**
 * The `useIsFetching` primitive returns the `number` of the queries that your application is loading or fetching
 * in the background (useful for app-wide loading indicators).
 * @param filters - An accessor returning the {@link QueryFilters} to narrow down the matched queries.
 * @param queryClient - An accessor for a custom `QueryClient`. Otherwise, the one from the nearest context
 * will be used.
 * @returns An accessor for the `number` of the queries that your application is currently loading or fetching
 * in the background.
 * @example
 * ```tsx
 * import { useIsFetching } from '@tanstack/solid-query'
 *
 * function GlobalLoadingIndicator() {
 *   // How many queries matching the posts prefix are fetching?
 *   const isFetchingPosts = useIsFetching(() => ({ queryKey: ['posts'] }))
 *
 *   return isFetchingPosts() > 0 ? <span>Loading posts...</span> : null
 * }
 * ```
 */
export function useIsFetching(
  filters?: Accessor<Omit<QueryFilters, 'fetchStatus'>>,
  queryClient?: Accessor<QueryClient>,
): Accessor<number> {
  const client = createMemo(() => useQueryClient(queryClient?.()))
  return createCacheAggregate(
    (onEvent) => client().getQueryCache().subscribe(onEvent),
    () => client().isFetching(filters?.()),
    0,
  )
}
