import { useQueryClient } from './useQueryClient.js'
import { createRawRef } from './containers.svelte.js'
import type {
  MutationCache,
  MutationState,
  QueryClient,
} from '@tanstack/query-core'
import type { MutationStateOptions } from './types.js'

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
  let [mutation, update] = createRawRef(getResult(mutationCache, options))
  $effect(() => update(getResult(mutationCache, options)))
  return mutation
}
