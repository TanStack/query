import { createReactiveThunk } from './containers.svelte.js'
import { useQueryClient } from './useQueryClient.js'
import type { QueryClient, QueryFilters } from '@tanstack/query-core'

export function useIsFetching(
  filters?: QueryFilters,
  queryClient?: QueryClient,
): () => number {
  const client = useQueryClient(queryClient)
  const queryCache = client.getQueryCache()

  return createReactiveThunk(
    () => client.isFetching(filters),
    (update) => queryCache.subscribe(update),
  )
}
