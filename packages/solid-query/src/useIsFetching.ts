import type { QueryFilters } from '@tanstack/query-core'

import type { ContextOptions, SolidQueryFilters } from './types'
import { useQueryClient } from './QueryClientProvider'
import type { Accessor } from 'solid-js'
import { createSignal, onCleanup, createComputed, createMemo } from 'solid-js'
import { normalizeFilterArgs } from './utils'

interface Options extends ContextOptions {}

export function useIsFetching(
  filtersArgs?: SolidQueryFilters,
  optionsArgs?: Options,
): Accessor<number> {
  const [filtersObj, optionsObj = {}] = normalizeFilterArgs(
    filtersArgs,
    optionsArgs,
  )

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
    const [newFiltersObj, newOptionsObj = {}] = normalizeFilterArgs(
      filtersArgs,
      optionsArgs,
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
