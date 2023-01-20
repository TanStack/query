import * as React from 'react'

import type { MutationFilters, QueryClient } from '@tanstack/query-core'
import { notifyManager } from '@tanstack/query-core'
import { useQueryClient } from './QueryClientProvider'

export function useIsMutating(
  filters?: MutationFilters,
  queryClient?: QueryClient,
): number {
  const client = useQueryClient(queryClient)
  const mutationCache = client.getMutationCache()

  return React.useSyncExternalStore(
    React.useCallback(
      (onStoreChange) =>
        mutationCache.subscribe(notifyManager.batchCalls(onStoreChange)),
      [mutationCache],
    ),
    () => client.isMutating(filters),
    () => client.isMutating(filters),
  )
}
