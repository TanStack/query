'use client'
import * as React from 'react'
import type { QueryClient, QueryFilters } from '@tanstack/query-core'
import { notifyManager } from '@tanstack/query-core'

import { useQueryClient } from './QueryClientProvider'

export function useIsFetching(
  filters?: QueryFilters,
  queryClient?: QueryClient,
): number {
  const client = useQueryClient(queryClient)
  const queryCache = client.getQueryCache()

  return React.useSyncExternalStore(
    React.useCallback(
      (onStoreChange) =>
        queryCache.subscribe(notifyManager.batchCalls(onStoreChange)),
      [queryCache],
    ),
    () => client.isFetching(filters),
    () => client.isFetching(filters),
  )
}
