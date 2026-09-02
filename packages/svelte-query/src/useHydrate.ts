import { hydrate } from '@tanstack/query-core'
import { useQueryClient } from './useQueryClient.js'
import type { HydrateOptions, QueryClient } from '@tanstack/query-core'

/**
 * Adds a previously dehydrated `state` into the `queryClient` (from the nearest context, or the one
 * passed explicitly). If the client already contains data, the new queries will be intelligently merged based
 * on update timestamp. `HydrationBoundary` wraps this — use it directly only if you need to hydrate from your
 * own component instead.
 *
 * @param state - The dehydrated state to hydrate into the cache, as produced by `dehydrate`.
 * @param options - {@link HydrateOptions} to control the hydration.
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
 * be used.
 *
 * @example
 * Server-side prefetch handed off to the client via `dehydrate` — `dehydratedState` would typically come
 * from a server load function that prefetched with `queryClient.query` and called `dehydrate(queryClient)`:
 * ```svelte
 * <script lang="ts">
 *   import { HydrationBoundary } from '@tanstack/svelte-query'
 *   import type { DehydratedState } from '@tanstack/svelte-query'
 *   import Posts from './Posts.svelte'
 *
 *   let { dehydratedState }: { dehydratedState: DehydratedState } = $props()
 * </script>
 *
 * <HydrationBoundary state={dehydratedState}>
 *   <Posts />
 * </HydrationBoundary>
 * ```
 */
export function useHydrate(
  state?: unknown,
  options?: HydrateOptions,
  queryClient?: QueryClient,
) {
  const client = useQueryClient(queryClient)

  if (state) {
    hydrate(client, state, options)
  }
}
