import { createMemo } from 'solid-js'
import { replaceEqualDeep } from '@tanstack/query-core'
import { createCacheAggregate } from './cacheAggregate'
import { useQueryClient } from './QueryClientProvider'
import type {
  Mutation,
  MutationCache,
  MutationFilters,
  MutationState,
} from '@tanstack/query-core'
import type { Accessor } from 'solid-js'
import type { QueryClient } from './QueryClient'

type MutationStateOptions<TResult = MutationState> = {
  filters?: MutationFilters
  select?: (mutation: Mutation) => TResult
}

function getResult<TResult = MutationState>(
  mutationCache: MutationCache,
  options: MutationStateOptions<TResult>,
): Array<TResult> {
  return mutationCache
    .findAll(options.filters)
    .map(
      (mutation): TResult =>
        (options.select ? options.select(mutation) : mutation.state) as TResult,
    )
}

export function useMutationState<TResult = MutationState>(
  options: Accessor<MutationStateOptions<TResult>> = () => ({}),
  queryClient?: Accessor<QueryClient>,
): Accessor<Array<TResult>> {
  const client = createMemo(() => useQueryClient(queryClient?.()))
  return createCacheAggregate<Array<TResult>>(
    (onEvent) => client().getMutationCache().subscribe(onEvent),
    // Structural sharing against the previous committed value keeps
    // unchanged mutation states referentially stable across syncs.
    (prev) => replaceEqualDeep(prev, getResult(client().getMutationCache(), options())),
    [],
  )
}
