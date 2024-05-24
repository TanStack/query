import { readable } from 'svelte/store'
import { notifyManager, replaceEqualDeep } from '@tanstack/query-core'
import { useQueryClient } from './useQueryClient'
import type {
  DefaultError,
  Mutation,
  MutationCache,
  MutationState,
  QueryClient,
} from '@tanstack/query-core'
import type { Readable } from 'svelte/store'
import type { MutationStateOptions } from './types'

function getResult<TResult = MutationState>(
  mutationCache: MutationCache,
  options: MutationStateOptions<TResult>,
): Array<TResult> {
  return mutationCache
    .findAll(options.filters)
    .map(
      (mutation): TResult =>
        (options.select
          ? options.select(
              mutation as Mutation<unknown, DefaultError, unknown, unknown>,
            )
          : mutation.state) as TResult,
    )
}

export function useMutationState<TResult = MutationState>(
  options: MutationStateOptions<TResult> = {},
  queryClient?: QueryClient,
): Readable<Array<TResult>> {
  const client = useQueryClient(queryClient)
  const mutationCache = client.getMutationCache()

  let result = getResult(mutationCache, options)

  const { subscribe } = readable(result, (set) => {
    return mutationCache.subscribe(
      notifyManager.batchCalls(() => {
        const nextResult = replaceEqualDeep(
          result,
          getResult(mutationCache, options),
        )
        if (result !== nextResult) {
          result = nextResult
          set(result)
        }
      }),
    )
  })

  return { subscribe }
}
