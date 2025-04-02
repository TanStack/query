import { createMemo, createSignal, onCleanup } from 'solid-js'
import { useQueryClient } from './QueryClientProvider'
import type { QueryClient, QueryFilters } from '@tanstack/query-core'
import type { Accessor } from 'solid-js'

export function useIsFetching(
  filters?: Accessor<QueryFilters>,
  queryClient?: Accessor<QueryClient>,
): Accessor<number> {
  const client = createMemo(() => useQueryClient(queryClient?.()))
  const queryCache = createMemo(() => client().getQueryCache())

  const [fetches, setFetches] = createSignal(client().isFetching(filters?.()))

  const unsubscribe = queryCache().subscribe(() => {
    setFetches(client().isFetching(filters?.()))
  })

  onCleanup(unsubscribe)

  return fetches
}
