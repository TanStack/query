import {
  type QueryFilters,
  type QueryKey,
  type QueryClient,
  parseFilterArgs,
  notifyManager,
} from '@tanstack/query-core'
import { type Readable, readable } from 'svelte/store'
import { useQueryClient } from './useQueryClient'

export function useIsFetching(filters?: QueryFilters): Readable<number>
export function useIsFetching(
  queryKey?: QueryKey,
  filters?: QueryFilters,
): Readable<number>

export function useIsFetching(
  arg1?: QueryKey | QueryFilters,
  arg2?: QueryFilters,
): Readable<number> {
  const [filters] = parseFilterArgs(arg1, arg2)
  const client: QueryClient = useQueryClient()
  const cache = client.getQueryCache()
  // isFetching is the prev value initialized on mount *
  let isFetching = client.isFetching(filters)

  const { subscribe } = readable(isFetching, (set) => {
    return cache.subscribe(
      notifyManager.batchCalls(() => {
        const newIsFetching = client.isFetching(filters)
        if (isFetching !== newIsFetching) {
          // * and update with each change
          isFetching = newIsFetching
          set(isFetching)
        }
      }),
    )
  })

  return { subscribe }
}
