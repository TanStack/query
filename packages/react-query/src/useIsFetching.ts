'use client'
import { useQueryState } from './useQueryState'
import type { QueryClient, QueryFilters } from '@tanstack/query-core'

export function useIsFetching(
  filters?: QueryFilters,
  queryClient?: QueryClient,
): number {
  return useQueryState(
    { filters: { ...filters, fetchStatus: 'fetching' } },
    queryClient,
  ).length
}
