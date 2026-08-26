import { createMemo } from 'solid-js'
import { createCacheAggregate } from './cacheAggregate'
import { useQueryClient } from './QueryClientProvider'
import type { QueryFilters } from '@tanstack/query-core'
import type { QueryClient } from './QueryClient'
import type { Accessor } from 'solid-js'

export function useIsFetching(
  filters?: Accessor<QueryFilters>,
  queryClient?: Accessor<QueryClient>,
): Accessor<number> {
  const client = createMemo(() => useQueryClient(queryClient?.()))
  return createCacheAggregate(
    (onEvent) => client().getQueryCache().subscribe(onEvent),
    () => client().isFetching(filters?.()),
    0,
  )
}
