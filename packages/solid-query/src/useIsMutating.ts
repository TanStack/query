import { createMemo } from 'solid-js'
import { createCacheAggregate } from './cacheAggregate'
import { useQueryClient } from './QueryClientProvider'
import type { MutationFilters } from '@tanstack/query-core'
import type { QueryClient } from './QueryClient'
import type { Accessor } from 'solid-js'

/**
 * The `useIsMutating` primitive returns the `number` of mutations that your application currently has `pending`
 * (useful for app-wide loading indicators).
 * @param filters - An accessor returning the {@link MutationFilters} to narrow down the matched mutations.
 * @param queryClient - An accessor for a custom `QueryClient`. Otherwise, the one from the nearest context
 * will be used.
 * @returns An accessor for the `number` of the mutations that your application currently has `pending`.
 * @example
 * ```tsx
 * import { useIsMutating } from '@tanstack/solid-query'
 *
 * function PostsMutatingIndicator() {
 *   // How many mutations matching the posts prefix are in progress?
 *   const isMutatingPosts = useIsMutating(() => ({ mutationKey: ['posts'] }))
 *
 *   return isMutatingPosts() > 0 ? <span>Saving posts...</span> : null
 * }
 * ```
 */
export function useIsMutating(
  filters?: Accessor<Omit<MutationFilters, 'status'>>,
  queryClient?: Accessor<QueryClient>,
): Accessor<number> {
  const client = createMemo(() => useQueryClient(queryClient?.()))
  return createCacheAggregate(
    (onEvent) => client().getMutationCache().subscribe(onEvent),
    () => client().isMutating(filters?.()),
    0,
  )
}
