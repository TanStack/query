import {
  type QueryClient,
  type QueryFilters,
  notifyManager,
} from '@tanstack/query-core'
import { readable } from 'svelte/store'
import { useQueryClient } from './useQueryClient.js'
import type { Readable } from 'svelte/store'

export function useIsFetching(
  filters?: QueryFilters,
  queryClient?: QueryClient,
): Readable<number> {
  const client = useQueryClient(queryClient)
  const cache = client.getQueryCache()
  // isFetching is the prev value initialized on mount *
  let isFetching = client.isFetching(filters)

  const { subscribe } = readable(isFetching, (set) => {
    return cache.subscribe(
      notifyManager.batchCalls(() => {
        const newIsFetching = client.isFetching(filters)
        if (isFetching !== newIsFetching) {
          // * and update with each change
          isFetching = newIsFetching
          set(isFetching)
        }
      }),
    )
  })

  return { subscribe }
}
