import {
  QueryKey,
  notifyManager,
  parseFilterArgs,
  QueryFilters,
} from '@tanstack/query-core'

import { ContextOptions } from './types'
import { useQueryClient } from './QueryClientProvider'
import { Accessor, createSignal, onCleanup } from 'solid-js'
interface Options extends ContextOptions {}

export function useIsFetching(filters?: QueryFilters, options?: Options): Accessor<number>
export function useIsFetching(
  queryKey?: QueryKey,
  filters?: QueryFilters,
  options?: Options,
): Accessor<number>
export function useIsFetching(
  arg1?: QueryKey | QueryFilters,
  arg2?: QueryFilters | Options,
  arg3?: Options,
): Accessor<number> {
  const [filters, options = {}] = parseFilterArgs(arg1, arg2, arg3)
  const queryClient = useQueryClient({ context: options.context })
  const queryCache = queryClient.getQueryCache()

  const [fetches, setFetches] = createSignal(queryClient.isFetching(filters))

  const unsubscribe = queryCache.subscribe((result) => {
    setFetches(queryClient.isFetching(filters))
  })

  onCleanup(() => {
    unsubscribe()
  })

  return fetches
}