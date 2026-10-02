import { getQueryClientContext } from './context.js'
import type { QueryClient } from '@tanstack/query-core'

/**
 * The `useQueryClient` function returns the current `QueryClient` instance.
 *
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
 * be used.
 * @returns The current `QueryClient` instance.
 * @throws If no `queryClient` argument is passed and no `QueryClientProvider` is found in the component tree.
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { useQueryClient } from '@tanstack/svelte-query'
 *
 *   const queryClient = useQueryClient()
 *
 *   function refreshPosts() {
 *     queryClient.invalidateQueries({ queryKey: ['posts'] })
 *   }
 * </script>
 * ```
 */
export function useQueryClient(queryClient?: QueryClient): QueryClient {
  if (queryClient) return queryClient
  return getQueryClientContext()
}
