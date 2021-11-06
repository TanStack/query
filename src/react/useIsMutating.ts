import { useSyncExternalStore } from 'use-sync-external-store/shim'

import { QueryKey } from '../core/types'
import { MutationFilters, parseMutationFilterArgs } from '../core/utils'
import { useQueryClient } from './QueryClientProvider'

export function useIsMutating(filters?: MutationFilters): number
export function useIsMutating(
  queryKey?: QueryKey,
  filters?: MutationFilters
): number
export function useIsMutating(
  arg1?: QueryKey | MutationFilters,
  arg2?: MutationFilters
): number {
  const filters = parseMutationFilterArgs(arg1, arg2)

  const queryClient = useQueryClient()

  return useSyncExternalStore(queryClient.getQueryCache().subscribe, () =>
    queryClient.isMutating(filters)
  )
}
