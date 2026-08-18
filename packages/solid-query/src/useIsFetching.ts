import { createEffect, createMemo, createSignal, onCleanup } from 'solid-js'
import { useQueryClientResolver } from './QueryClientProvider'
import type { QueryFilters } from '@tanstack/query-core'
import type { QueryClient } from './QueryClient'
import type { Accessor } from 'solid-js'

export function useIsFetching(
  filters?: Accessor<QueryFilters>,
  queryClient?: Accessor<QueryClient>,
): Accessor<number> {
  const resolveClient = useQueryClientResolver(queryClient)
  const client = createMemo(() => resolveClient())
  const queryCache = createMemo(() => client().getQueryCache())

  const [fetches, setFetches] = createSignal(client().isFetching(filters?.()))

  createEffect(() => {
    setFetches(client().isFetching(filters?.()))

    const unsubscribe = queryCache().subscribe(() => {
      setFetches(client().isFetching(filters?.()))
    })

    onCleanup(unsubscribe)
  })

  return fetches
}
