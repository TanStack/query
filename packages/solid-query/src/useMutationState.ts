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

/**
 * Gets the state of mutations in the cache.
 *
 * @template TMutation - Narrows the type of the `mutation` argument passed to `select`. This is a caller-side assertion — the mutation cache stores mutations as the base `Mutation` type, so it is the caller's responsibility to ensure `TMutation` matches the actual mutations in the cache (e.g. by specifying a `mutationKey` in `filters`).
 */
export function useMutationState<TResult = MutationState, TMutation extends Mutation<any, any, any, any> = Mutation<any, any, any, any>>(
  options: Accessor<MutationStateOptions<TResult>> = () => ({}),
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