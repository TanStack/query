import {
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  untrack,
} from 'solid-js'
import { replaceEqualDeep } from '@tanstack/query-core'
import { useQueryClientResolver } from './QueryClientProvider'
import type {
  Mutation,
  MutationCache,
  MutationFilters,
  MutationState,
} from '@tanstack/query-core'
import type { Accessor } from 'solid-js'
import type { QueryClient } from './QueryClient'

type MutationTypeFromResult<TResult> = [TResult] extends [
  MutationState<
    infer TData,
    infer TError,
    infer TVariables,
    infer TOnMutateResult
  >,
]
  ? Mutation<TData, TError, TVariables, TOnMutateResult>
  : Mutation

type MutationStateOptions<
  TResult = MutationState,
  TMutation extends Mutation<any, any, any, any> =
    MutationTypeFromResult<TResult>,
> = {
  filters?: MutationFilters
  select?: (mutation: TMutation) => TResult
}

function getResult<
  TResult = MutationState,
  TMutation extends Mutation<any, any, any, any> =
    MutationTypeFromResult<TResult>,
>(
  mutationCache: MutationCache,
  options: MutationStateOptions<TResult, TMutation>,
): Array<TResult> {
  return mutationCache
    .findAll(options.filters)
    .map(
      (mutation): TResult =>
        (options.select
          ? options.select(mutation as TMutation)
          : mutation.state) as TResult,
    )
}

export function useMutationState<
  TResult = MutationState,
  TMutation extends Mutation<any, any, any, any> =
    MutationTypeFromResult<TResult>,
>(
  options: Accessor<MutationStateOptions<TResult, TMutation>> = () => ({}),
  queryClient?: Accessor<QueryClient>,
): Accessor<Array<TResult>> {
  const resolveClient = useQueryClientResolver(queryClient)
  const client = createMemo(() => resolveClient())
  const mutationCache = createMemo(() => client().getMutationCache())

  const [result, setResult] = createSignal(
    getResult(mutationCache(), options()),
  )

  createEffect(() => {
    const unsubscribe = mutationCache().subscribe(() => {
      // `subscribe` invokes this synchronously, so reading `result` while the
      // enclosing effect is still tracking would make the effect depend on the
      // signal it sets, re-running and re-subscribing on every mutation.
      const previousResult = untrack(result)
      const nextResult = replaceEqualDeep(
        previousResult,
        getResult(mutationCache(), options()),
      )
      if (previousResult !== nextResult) {
        setResult(nextResult)
      }
    })

    onCleanup(unsubscribe)
  })

  return result
}
