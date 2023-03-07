import type { MutationFilters, QueryClient } from '@tanstack/query-core'
import { useQueryClient } from './QueryClientProvider'
import type { Accessor } from 'solid-js'
import { createSignal, onCleanup, createMemo } from 'solid-js'

export function useIsMutating(
  filters?: Accessor<MutationFilters>,
  queryClient?: Accessor<QueryClient>,
): Accessor<number> {
  const client = createMemo(() => useQueryClient(queryClient?.()))
  const mutationCache = createMemo(() => client().getMutationCache())

  const [mutations, setMutations] = createSignal(
    client().isMutating(filters?.()),
  )

  const unsubscribe = mutationCache().subscribe((_result) => {
    setMutations(client().isMutating(filters?.()))
  })

  onCleanup(unsubscribe)

  return mutations
}
