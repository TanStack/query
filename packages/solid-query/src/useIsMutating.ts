import type { MutationFilters, QueryClient } from '@tanstack/query-core'
import { useQueryClient } from './QueryClientProvider'
import type { Accessor } from 'solid-js'
import { createSignal, onCleanup, createMemo } from 'solid-js'

type Options = () => {
  filters?: MutationFilters
  queryClient?: QueryClient
}

export function useIsMutating(options: Options = () => ({})): Accessor<number> {
  const queryClient = createMemo(() =>
    useQueryClient(options().queryClient),
  )
  const mutationCache = createMemo(() => queryClient().getMutationCache())

  const [mutations, setMutations] = createSignal(
    queryClient().isMutating(options().filters),
  )

  const unsubscribe = mutationCache().subscribe((_result) => {
    setMutations(queryClient().isMutating(options().filters))
  })

  onCleanup(unsubscribe)

  return mutations
}
