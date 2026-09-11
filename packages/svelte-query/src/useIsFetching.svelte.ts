import { ReactiveValue } from './containers.svelte.js'
import { useQueryClient } from './useQueryClient.js'
import type { QueryClient, QueryFilters } from '@tanstack/query-core'

/**
 * @param filters - {@link QueryFilters} to narrow down which queries to count. Omit to count every fetching
 * query.
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
 * be used.
 * @returns A reactive value — read `.current` to get how many matching queries are currently fetching.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { useIsFetching } from '@tanstack/svelte-query'
 *
 *   // How many queries matching the posts prefix are fetching?
 *   const isFetchingPosts = useIsFetching({ queryKey: ['posts'] })
 * </script>
 *
 * {#if isFetchingPosts.current}
 *   <span>Refreshing posts...</span>
 * {/if}
 * ```
 *
 * @example
 * A global loading indicator for any query fetching in the background, not just the ones on screen:
 * ```svelte
 * <script lang="ts">
 *   import { useIsFetching } from '@tanstack/svelte-query'
 *
 *   const isFetching = useIsFetching()
 * </script>
 *
 * {#if isFetching.current}
 *   <div>Queries are fetching in the background...</div>
 * {/if}
 * ```
 */
export function useIsFetching(
  filters?: QueryFilters,
  queryClient?: QueryClient,
): ReactiveValue<number> {
  const client = useQueryClient(queryClient)
  const queryCache = client.getQueryCache()

  return new ReactiveValue(
    () => client.isFetching(filters),
    (update) => queryCache.subscribe(update),
  )
}
