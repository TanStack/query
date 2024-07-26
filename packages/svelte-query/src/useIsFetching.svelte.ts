import { onDestroy } from 'svelte'
import { useQueryClient } from './useQueryClient.js'
import type { QueryClient, QueryFilters } from '@tanstack/query-core'

export function useIsFetching(
  filters?: QueryFilters,
  queryClient?: QueryClient,
): () => number {
  const client = useQueryClient(queryClient)
  const queryCache = client.getQueryCache()

  const init = client.isFetching(filters)
  let isFetching = $state(init)
  $effect(() => {
    const unsubscribe = queryCache.subscribe(() => {
      isFetching = client.isFetching(filters)
    })

    onDestroy(unsubscribe)
  })

  return () => isFetching
}
