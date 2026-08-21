import { ReactiveValue } from './containers.svelte.js'
import { useQueryClient } from './useQueryClient.js'
import type { QueryClient, QueryFilters } from '@tanstack/query-core'

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
