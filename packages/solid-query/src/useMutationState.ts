import { createEffect, createMemo, createSignal, onCleanup } from 'solid-js'
import { replaceEqualDeep } from '@tanstack/query-core'
import { useQueryClient } from './QueryClientProvider'
import type {
  Mutation,
  MutationCache,
  MutationFilters,
  MutationState,
} from '@tanstack/query-core'
import type { Accessor } from 'solid-js'
import type { QueryClient } from './QueryClient'

type MutationStateOptions<
  TResult = MutationState,
  TMutation extends Mutation<any, any, any, any> = Mutation,
> = {
  filters?: MutationFilters
  select?: (mutation: TMutation) => TResult
}

function getResult<TResult = MutationState, TMutation extends Mutation<any, any, any, any> = Mutation>(
  mutationCache: MutationCache,
  options: MutationStateOptions<TResult, TMutation>,
): Array<TResult> {
  return mutationCache
    .findAll(options.filters)
    .map(
      (mutation): TResult =>
        (options.select
          ? options.select(mutation as unknown as TMutation)
          : mutation.state) as TResult,
    )
}

export function useMutationState<
  TResult = MutationState,
  TMutation extends Mutation<any, any, any, any> = Mutation,
>(
  options: Accessor<MutationStateOptions<TResult, TMutation>> = () => ({}),
  queryClient?: Accessor<QueryClient>,
): Accessor<Array<TResult>> {
  const client = createMemo(() => useQueryClient(queryClient?.()))
  const mutationCache = createMemo(() => client().getMutationCache())

  const [result, setResult] = createSignal(
    getResult(mutationCache(), options()),
  )

  createEffect(() => {
    const unsubscribe = mutationCache().subscribe(() => {
      const nextResult = replaceEqualDeep(
        result(),
        getResult(mutationCache(), options()),
      )
      if (result() !== nextResult) {
        setResult(nextResult)
      }
    })

    onCleanup(unsubscribe)
  })

  return result
}
