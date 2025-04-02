import { useQueryClient } from './useQueryClient.js'
import { ReactiveValue } from './containers.svelte.js'
import type { MutationFilters, QueryClient } from '@tanstack/query-core'

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
