import { useQueryClient } from './useQueryClient.js'
import { ReactiveValue } from './containers.svelte.js'
import type { MutationFilters, QueryClient } from '@tanstack/query-core'

/**
 * `useIsMutating` is an optional hook that returns the `number` of mutations that your application is
 * running (useful for app-wide loading indicators).
 *
 * @param filters - {@link MutationFilters} to narrow down which mutations to count.
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
 * be used.
 * @returns A reactive value — read `.current` to get how many matching mutations are currently running.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { useIsMutating } from '@tanstack/svelte-query'
 *
 *   // How many mutations matching the posts prefix are in progress?
 *   const isMutatingPosts = useIsMutating({ mutationKey: ['posts'] })
 * </script>
 *
 * {#if isMutatingPosts.current}
 *   <span>Saving posts...</span>
 * {/if}
 * ```
 */
export function useIsMutating(
  filters?: MutationFilters,
  queryClient?: QueryClient,
): ReactiveValue<number> {
  const client = useQueryClient(queryClient)
  const cache = client.getMutationCache()

  return new ReactiveValue(
    () => client.isMutating(filters),
    (update) => cache.subscribe(update),
  )
}
