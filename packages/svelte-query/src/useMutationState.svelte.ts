import { replaceEqualDeep } from '@tanstack/query-core'
import { useQueryClient } from './useQueryClient.js'
import type {
  Mutation,
  MutationCache,
  MutationState,
  QueryClient,
} from '@tanstack/query-core'
import type { MutationStateOptions } from './types.js'

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
          ? (options.select as unknown as (mutation: Mutation) => TResult)(
              mutation,
            )
          : mutation.state) as TResult,
    )
}

export function useMutationState<
  TResult = MutationState,
  TMutation extends Mutation<any, any, any, any> =
    MutationTypeFromResult<TResult>,
>(
  options: MutationStateOptions<TResult, TMutation> = {},
  queryClient?: QueryClient,
): Array<TResult> {
  const mutationCache = useQueryClient(queryClient).getMutationCache()
  const result = $state(getResult(mutationCache, options))

  $effect(() => {
    const unsubscribe = mutationCache.subscribe(() => {
      const nextResult = replaceEqualDeep(
        result,
        getResult(mutationCache, options),
      )
      if (result !== nextResult) {
        Object.assign(result, nextResult)
      }
    })

    return unsubscribe
  })

  /*  $effect(() => {
    mutationCache.subscribe(() => {
      const nextResult = replaceEqualDeep(
        result.current,
        getResult(mutationCache, optionsRef),
      )
      if (result.current !== nextResult) {
        result = nextResult
        //notifyManager.schedule(onStoreChange)
      }
    })
  }) */
  return result
}
