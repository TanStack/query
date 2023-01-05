import type { MutationFilters } from '@tanstack/query-core'
import type { ContextOptions } from './types'
import { useQueryClient } from './QueryClientProvider'
import type { Accessor } from 'solid-js'
import { createSignal, onCleanup, createMemo } from 'solid-js'

type Options = () => {
  filters?: MutationFilters
  options?: ContextOptions
}

export function useIsMutating(options: Options = () => ({})): Accessor<number> {
  const queryClient = createMemo(() =>
    useQueryClient({ context: options().options?.context }),
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
