import {
  type MutationFilters,
  type MutationKey,
  type QueryClient,
  notifyManager,
  parseMutationFilterArgs,
} from '@tanstack/query-core'
import { type Readable, readable } from 'svelte/store'
import { useQueryClient } from './useQueryClient'

export function useIsMutating(filters?: MutationFilters): Readable<number>
export function useIsMutating(
  mutationKey?: MutationKey,
  filters?: Omit<MutationFilters, 'mutationKey'>,
): Readable<number>

export function useIsMutating(
  arg1?: MutationKey | MutationFilters,
  arg2?: Omit<MutationFilters, 'mutationKey'>,
): Readable<number> {
  const [filters] = parseMutationFilterArgs(arg1, arg2)
  const client: QueryClient = useQueryClient()
  const cache = client.getMutationCache()
  // isMutating is the prev value initialized on mount *
  let isMutating = client.isMutating(filters)

  const { subscribe } = readable(isMutating, (set) => {
    return cache.subscribe(
      notifyManager.batchCalls(() => {
        const newIisMutating = client.isMutating(filters)
        if (isMutating !== newIisMutating) {
          // * and update with each change
          isMutating = newIisMutating
          set(isMutating)
        }
      }),
    )
  })

  return { subscribe }
}
