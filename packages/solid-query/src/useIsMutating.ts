import type { MutationFilters } from '@tanstack/query-core'
import type { ContextOptions } from './types'
import { useQueryClient } from './QueryClientProvider'
import type { Accessor } from 'solid-js'
import { createSignal, onCleanup } from 'solid-js'

interface Options extends ContextOptions {}

export function useIsMutating(
  filters?: MutationFilters,
  options: Options = {},
): Accessor<number> {
  const queryClient = useQueryClient({ context: options.context })
  const mutationCache = queryClient.getMutationCache()

  const [mutations, setMutations] = createSignal(
    queryClient.isMutating(filters),
  )

  const unsubscribe = mutationCache.subscribe((_result) => {
    setMutations(queryClient.isMutating(filters))
  })

  onCleanup(() => {
    unsubscribe()
  })

  return mutations
}
