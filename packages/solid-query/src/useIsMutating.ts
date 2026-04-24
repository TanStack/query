import { createMemo, createSignal, onCleanup } from 'solid-js'
import { useQueryClientResolver } from './QueryClientProvider'
import type { MutationFilters } from '@tanstack/query-core'
import type { QueryClient } from './QueryClient'
import type { Accessor } from 'solid-js'

export function useIsMutating(
  filters?: Accessor<MutationFilters>,
  queryClient?: Accessor<QueryClient>,
): Accessor<number> {
  const resolveClient = useQueryClientResolver(queryClient)
  const client = createMemo(() => resolveClient())
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
