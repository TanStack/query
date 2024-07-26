import { notifyManager } from '@tanstack/query-core'
import { useQueryClient } from './useQueryClient.js'
import type { MutationFilters, QueryClient } from '@tanstack/query-core'

export function useIsMutating(
  filters?: MutationFilters,
  queryClient?: QueryClient,
): () => number {
  const client = useQueryClient(queryClient)
  const cache = client.getMutationCache()
  // isMutating is the prev value initialized on mount *
  let isMutating = client.isMutating(filters)

  const num = $state({ isMutating })
  $effect(() => {
    return cache.subscribe(
      notifyManager.batchCalls(() => {
        const newIisMutating = client.isMutating(filters)
        if (isMutating !== newIisMutating) {
          // * and update with each change
          isMutating = newIisMutating
          num.isMutating = isMutating
        }
      }),
    )
  })

  return () => num.isMutating
}
