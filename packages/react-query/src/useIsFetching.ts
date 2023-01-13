import * as React from 'react'
import type { QueryFilters } from '@tanstack/query-core'
import { notifyManager } from '@tanstack/query-core'

import type { ContextOptions } from './types'
import { useQueryClient } from './QueryClientProvider'

interface Options extends ContextOptions {}

export function useIsFetching(
  filters?: QueryFilters,
  options: Options = {},
): number {
  const queryClient = useQueryClient({ context: options.context })
  const queryCache = queryClient.getQueryCache()

  return React.useSyncExternalStore(
    React.useCallback(
      (onStoreChange) =>
        queryCache.subscribe(notifyManager.batchCalls(onStoreChange)),
      [queryCache],
    ),
    () => queryClient.isFetching(filters),
    () => queryClient.isFetching(filters),
  )
}
