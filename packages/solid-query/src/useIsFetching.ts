import { createComputed, createMemo, createSignal, onCleanup } from 'solid-js'
import { useQueryClient } from './QueryClientProvider'
import { parseFilterArgs } from './utils'
import type { QueryFilters } from '@tanstack/query-core'

import type { ContextOptions, SolidQueryFilters, SolidQueryKey } from './types'
import type { Accessor } from 'solid-js'

interface Options extends ContextOptions {}

export function useIsFetching(
  filters?: SolidQueryFilters,
  options?: Options,
): Accessor<number>
export function useIsFetching(
  queryKey?: SolidQueryKey,
  filters?: SolidQueryFilters,
  options?: Options,
): Accessor<number>
export function useIsFetching(
  arg1?: SolidQueryKey | SolidQueryFilters,
  arg2?: SolidQueryFilters | Options,
  arg3?: Options,
): Accessor<number> {
  const [filtersObj, optionsObj = {}] = parseFilterArgs(arg1, arg2, arg3)

  const [filters, setFilters] = createSignal(filtersObj)
  const [options, setOptions] = createSignal(optionsObj)

  const queryClient = createMemo(() =>
    useQueryClient({ context: options().context }),
  )
  const queryCache = createMemo(() => queryClient().getQueryCache())

  const [fetches, setFetches] = createSignal(
    queryClient().isFetching(filters as QueryFilters),
  )

  createComputed(() => {
    const [newFiltersObj, newOptionsObj = {}] = parseFilterArgs(
      arg1,
      arg2,
      arg3,
    )
    setFilters(newFiltersObj)
    setOptions(newOptionsObj)
  })

  const unsubscribe = queryCache().subscribe(() => {
    setFetches(queryClient().isFetching(filters() as QueryFilters))
  })

  onCleanup(() => {
    unsubscribe()
  })

  return fetches
}
