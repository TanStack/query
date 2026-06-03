import { replaceEqualDeep } from '@tanstack/query-core'
import { useQueryClient } from './useQueryClient.js'
import type {
  Mutation,
  MutationCache,
  MutationState,
  QueryClient,
} from '@tanstack/query-core'
import type { MutationStateOptions, MutationTypeFromResult } from './types.js'

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

/**
 * @template TResult - The type of values returned by the `select` callback.
 * @template TMutation - Narrows the type of the `mutation` argument passed to
 * `select`. This is a caller-side assertion — the mutation cache stores
 * mutations as the base `Mutation` type, so it is the caller's responsibility
 * to ensure `TMutation` matches the actual mutations in the cache (e.g. by
 * specifying a `mutationKey` in `filters`).
 */
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
