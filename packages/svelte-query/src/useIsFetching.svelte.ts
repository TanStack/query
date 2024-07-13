import type { QueryClient, QueryFilters } from '@tanstack/query-core'
import { useQueryClient } from './useQueryClient'
import { onDestroy } from 'svelte'

export function useIsFetching(
  filters?: QueryFilters,
  queryClient?: QueryClient,
): () => number {
  const client = useQueryClient(queryClient)
  const queryCache = $state(client.getQueryCache())

  const init = client.isFetching(filters)
  let isFetching = $state(init)
  const unsubscribe = queryCache.subscribe(() => {
    isFetching = client.isFetching(filters)
  })

  onDestroy(unsubscribe)

  return () => isFetching
}
