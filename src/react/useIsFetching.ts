import { useSyncExternalStore } from 'use-sync-external-store/shim'

import { QueryKey } from '../core/types'
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

  const [filters] = parseFilterArgs(arg1, arg2)

  return useSyncExternalStore(
    queryClient.getQueryCache().subscribe,
    () => queryClient.isFetching(filters),
    () => queryClient.isFetching(filters)
  )
}
