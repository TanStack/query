import { notifyManager } from '@tanstack/query-core'
import type { QueryClient, QueryFilters } from '@tanstack/query-core'
import { useCallback } from 'preact/hooks'

import { useQueryClient } from './QueryClientProvider'
import { useSyncExternalStore } from './utils'

export function useIsFetching(
  filters?: QueryFilters,
  queryClient?: QueryClient,
): number {
  const client = useQueryClient(queryClient)
  const queryCache = client.getQueryCache()

  return useSyncExternalStore(
    useCallback(
      (onStoreChange) =>
        queryCache.subscribe(notifyManager.batchCalls(onStoreChange)),
      [queryCache],
    ),
    () => client.isFetching(filters),
  )
}
