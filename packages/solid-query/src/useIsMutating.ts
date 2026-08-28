import { createMemo } from 'solid-js'
import { createCacheAggregate } from './cacheAggregate'
import { useQueryClient } from './QueryClientProvider'
import type { MutationFilters } from '@tanstack/query-core'
import type { QueryClient } from './QueryClient'
import type { Accessor } from 'solid-js'

export function useIsMutating(
  filters?: Accessor<MutationFilters>,
  queryClient?: Accessor<QueryClient>,
): Accessor<number> {
  const client = createMemo(() => useQueryClient(queryClient?.()))
  return createCacheAggregate(
    (onEvent) => client().getMutationCache().subscribe(onEvent),
    () => client().isMutating(filters?.()),
    0,
  )
}
