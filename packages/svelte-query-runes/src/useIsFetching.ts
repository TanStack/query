import {
  type QueryClient,
  type QueryFilters,
  notifyManager,
} from '@tanstack/query-core'
import { useQueryClient } from './useQueryClient'

export function useIsFetching(
  filters?: QueryFilters,
  queryClient?: QueryClient,
): number {
  const client = useQueryClient(queryClient)
  const cache = client.getQueryCache()
  // isFetching is the prev value initialized on mount *
  let isFetching = client.isFetching(filters)

  const isFetching_ = $state(isFetching)

  $effect(() => {
    return cache.subscribe(
      notifyManager.batchCalls(() => {
        const newIsFetching = client.isFetching(filters)
        if (isFetching !== newIsFetching) {
          // * and update with each change
          isFetching = newIsFetching
        }
      }),
    )
  })

  return isFetching_
}
