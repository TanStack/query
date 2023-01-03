import type { QueryFilters } from '@tanstack/query-core'
import type { Accessor } from 'solid-js'
import { createMemo, createSignal, onCleanup } from 'solid-js'
import { useQueryClient } from './QueryClientProvider'
import type { ContextOptions } from './types'

type Options = () => {
  filters?: QueryFilters
  options?: ContextOptions
}

export function useIsFetching(options: Options = () => ({})): Accessor<number> {
  const queryClient = createMemo(() =>
    useQueryClient({ context: options().options?.context }),
  )
  const queryCache = createMemo(() => queryClient().getQueryCache())

  const [fetches, setFetches] = createSignal(
    queryClient().isFetching(options().filters),
  )

  const unsubscribe = queryCache().subscribe(() => {
    setFetches(queryClient().isFetching(options().filters))
  })

  onCleanup(unsubscribe)

  return fetches
}
