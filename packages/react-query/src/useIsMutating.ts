'use client'
import * as React from 'react'
import { notifyManager, parseMutationFilterArgs } from '@tanstack/query-core'
import { useSyncExternalStore } from './useSyncExternalStore'

import { useQueryClient } from './QueryClientProvider'
import type { MutationFilters, MutationKey } from '@tanstack/query-core'
import type { ContextOptions } from './types'

interface Options extends ContextOptions {}

export function useIsMutating(
  filters?: MutationFilters,
  options?: Options,
): number
export function useIsMutating(
  mutationKey?: MutationKey,
  filters?: Omit<MutationFilters, 'mutationKey'>,
  options?: Options,
): number
export function useIsMutating(
  arg1?: MutationKey | MutationFilters,
  arg2?: Omit<MutationFilters, 'mutationKey'> | Options,
  arg3?: Options,
): number {
  const [filters, options = {}] = parseMutationFilterArgs(arg1, arg2, arg3)

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
