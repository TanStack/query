import { notifyManager, replaceEqualDeep } from '@tanstack/query-core'
import { useQueryClient } from './useQueryClient'
import type {
  Mutation,
  MutationCache,
  MutationFilters,
  MutationState,
  QueryClient,
} from '@tanstack/query-core'

export function useIsMutating(
  filters?: MutationFilters,
  queryClient?: QueryClient,
): () => number {
  const client = useQueryClient(queryClient)
  const cache = client.getMutationCache()
  // isMutating is the prev value initialized on mount *
  let isMutating = client.isMutating(filters)

  const num = $state({ isMutating })
  $effect(() => {
    return cache.subscribe(
      notifyManager.batchCalls(() => {
        const newIisMutating = client.isMutating(filters)
        if (isMutating !== newIisMutating) {
          // * and update with each change
          isMutating = newIisMutating
          num.isMutating = isMutating
        }
      }),
    )
  })

  return () => num.isMutating
}
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
  options: MutationStateOptions<TResult> = {},
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
