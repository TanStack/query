import React from 'react'
import { useSyncExternalStore } from 'use-sync-external-store/shim'

import { notifyManager } from '../core/notifyManager'
import { MutationKey } from '../core/types'
import { ContextOptions } from '../reactjs/types'
import { MutationFilters, parseMutationFilterArgs } from '../core/utils'
import { useQueryClient } from './QueryClientProvider'

interface Options extends ContextOptions {}

export function useIsMutating(
  filters?: MutationFilters,
  options?: Options
): number
export function useIsMutating(
  mutationKey?: MutationKey,
  filters?: Omit<MutationFilters, 'mutationKey'>,
  options?: Options
): number
export function useIsMutating(
  arg1?: MutationKey | MutationFilters,
  arg2?: Omit<MutationFilters, 'mutationKey'> | Options,
  arg3?: Options
): number {
  const [filters, options = {}] = parseMutationFilterArgs(arg1, arg2, arg3)

  const queryClient = useQueryClient({ context: options.context })
  const queryCache = queryClient.getQueryCache()

  return useSyncExternalStore(
    React.useCallback(
      onStoreChange =>
        queryCache.subscribe(notifyManager.batchCalls(onStoreChange)),
      [queryCache]
    ),
    () => queryClient.isMutating(filters)
  )
}
