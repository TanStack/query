import {
  type MutationFilters,
  type QueryClient,
  notifyManager,
} from '@tanstack/query-core'
import { readable } from 'svelte/store'
import { useQueryClient } from './useQueryClient'
import type { Readable } from 'svelte/store'

export function useIsMutating(
  filters?: MutationFilters,
  queryClient?: QueryClient,
): Readable<boolean> {
  const client = useQueryClient(queryClient)
  const cache = client.getMutationCache()
  // isMutating is the prev value initialized on mount *
  let isMutating = client.isMutating(filters)

  const { subscribe } = readable(isMutating, (set) => {
    return cache.subscribe(
      notifyManager.batchCalls(() => {
        const newIisMutating = client.isMutating(filters)
        if (isMutating !== newIisMutating) {
          // * and update with each change
          isMutating = newIisMutating
          set(isMutating)
        }
      }),
    )
  })

  return { subscribe }
}
