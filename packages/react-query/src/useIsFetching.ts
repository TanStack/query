'use client'
import * as React from 'react'
import { notifyManager, parseFilterArgs } from '@tanstack/query-core'

import { useSyncExternalStore } from './useSyncExternalStore'
import { useQueryClient } from './QueryClientProvider'
import type { ContextOptions } from './types'
import type { QueryFilters, QueryKey } from '@tanstack/query-core'

interface Options extends ContextOptions {}

export function useIsFetching(filters?: QueryFilters, options?: Options): number
export function useIsFetching(
  queryKey?: QueryKey,
  filters?: QueryFilters,
  options?: Options,
): number
export function useIsFetching(
  arg1?: QueryKey | QueryFilters,
  arg2?: QueryFilters | Options,
  arg3?: Options,
): number {
  const [filters, options = {}] = parseFilterArgs(arg1, arg2, arg3)
  const queryClient = useQueryClient({ context: options.context })
  const queryCache = queryClient.getQueryCache()

  return useSyncExternalStore(
    React.useCallback(
      (onStoreChange) =>
        queryCache.subscribe(notifyManager.batchCalls(onStoreChange)),
      [queryCache],
    ),
    () => queryClient.isFetching(filters),
    () => queryClient.isFetching(filters),
  )
}
