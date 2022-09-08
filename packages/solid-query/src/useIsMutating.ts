import {
  notifyManager,
  MutationKey,
  MutationFilters,
  parseMutationFilterArgs,
} from '@tanstack/query-core'
import { ContextOptions } from './types'
import { useQueryClient } from './QueryClientProvider'
import { Accessor, createSignal, onCleanup } from 'solid-js'

interface Options extends ContextOptions {}

export function useIsMutating(
  filters?: MutationFilters,
  options?: Options,
): Accessor<number>
export function useIsMutating(
  mutationKey?: MutationKey,
  filters?: Omit<MutationFilters, 'mutationKey'>,
  options?: Options,
): Accessor<number>
export function useIsMutating(
  arg1?: MutationKey | MutationFilters,
  arg2?: Omit<MutationFilters, 'mutationKey'> | Options,
  arg3?: Options,
): Accessor<number> {
  const [filters, options = {}] = parseMutationFilterArgs(arg1, arg2, arg3)
  
  const queryClient = useQueryClient({ context: options.context })
  const mutationCache = queryClient.getMutationCache()

  const [mutations, setMutations] = createSignal(queryClient.isMutating(filters))

  const unsubscribe = mutationCache.subscribe((result) => {
    setMutations(queryClient.isMutating(filters))
  })

  onCleanup(() => {
    unsubscribe()
  })

  return mutations
}