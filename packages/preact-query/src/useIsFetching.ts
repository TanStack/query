'use client'
import { notifyManager } from '@tanstack/query-core'

import { useQueryClient } from './QueryClientProvider'
import type { QueryClient, QueryFilters } from '@tanstack/query-core'
import { useCallback } from 'preact/hooks'

// TODO: We might need to use the useSyncExternalStore abstraction created in Preact/store
// since preact/compat adds additional overhead to the bundle and is not ideal
import { useSyncExternalStore } from 'preact/compat'

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
