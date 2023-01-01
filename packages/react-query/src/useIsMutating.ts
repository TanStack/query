import * as React from 'react'
import { useSyncExternalStore } from './useSyncExternalStore'

import type { MutationFilters } from '@tanstack/query-core'
import { notifyManager } from '@tanstack/query-core'
import type { ContextOptions } from './types'
import { useQueryClient } from './QueryClientProvider'

interface Options extends ContextOptions {}

export function useIsMutating(
  filters?: MutationFilters,
  options: Options = {},
): number {
  const queryClient = useQueryClient({ context: options.context })
  const mutationCache = queryClient.getMutationCache()

  return useSyncExternalStore(
    React.useCallback(
      (onStoreChange) =>
        mutationCache.subscribe(notifyManager.batchCalls(onStoreChange)),
      [mutationCache],
    ),
    () => queryClient.isMutating(filters),
    () => queryClient.isMutating(filters),
  )
}
