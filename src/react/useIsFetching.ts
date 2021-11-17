import React from 'react'
import { useSyncExternalStore } from 'use-sync-external-store/shim'

import { QueryKey, notifyManager } from '../core'
import { parseFilterArgs, QueryFilters } from '../core/utils'
import { useQueryClient } from './QueryClientProvider'

export function useIsFetching(filters?: QueryFilters): number
export function useIsFetching(
  queryKey?: QueryKey,
  filters?: QueryFilters
): number
export function useIsFetching(
  arg1?: QueryKey | QueryFilters,
  arg2?: QueryFilters
): number {
  const queryClient = useQueryClient()
  const queryCache = queryClient.getQueryCache()

  const [filters] = parseFilterArgs(arg1, arg2)

  return useSyncExternalStore(
    React.useCallback(
      onStoreChange =>
        queryCache.subscribe(notifyManager.batchCalls(onStoreChange)),
      [queryCache]
    ),
    () => queryClient.isFetching(filters),
    () => queryClient.isFetching(filters)
  )
}
