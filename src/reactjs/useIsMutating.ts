import React from 'react'
import { useSyncExternalStore } from 'use-sync-external-store/shim'

import { notifyManager } from '../core/notifyManager'
import { MutationKey } from '../core/types'
import { MutationFilters, parseMutationFilterArgs } from '../core/utils'
import { useQueryClient } from './QueryClientProvider'

export function useIsMutating(filters?: MutationFilters): number
export function useIsMutating(
  mutationKey?: MutationKey,
  filters?: Omit<MutationFilters, 'mutationKey'>
): number
export function useIsMutating(
  arg1?: MutationKey | MutationFilters,
  arg2?: Omit<MutationFilters, 'mutationKey'>
): number {
  const filters = parseMutationFilterArgs(arg1, arg2)

  const queryClient = useQueryClient()
  const queryCache = queryClient.getQueryCache()

  return useSyncExternalStore(
    React.useCallback(
      onStoreChange =>
        queryCache.subscribe(notifyManager.batchCalls(onStoreChange)),
      [queryCache]
    ),
    () => queryClient.isMutating(filters),
    () => queryClient.isMutating(filters)
  )
}
