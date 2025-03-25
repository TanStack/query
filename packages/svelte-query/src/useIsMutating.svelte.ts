import { useQueryClient } from './useQueryClient.js'
import { createReactiveThunk } from './containers.svelte.js'
import type { MutationFilters, QueryClient } from '@tanstack/query-core'

export function useIsMutating(
  filters?: MutationFilters,
  queryClient?: QueryClient,
): () => number {
  const client = useQueryClient(queryClient)
  const cache = client.getMutationCache()

  return createReactiveThunk(
    () => client.isMutating(filters),
    (update) => cache.subscribe(update),
  )
}
