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
 * `useMutationState` gives you access to all mutations (matching the given `filters`), including ones that
 * were created by a different component or hook instance, or even ones no longer mounted.
 *
 * @param options - The `filters` to narrow down matched mutations, and an optional `select` to transform the
 * mutation state.
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
 * be used.
 * @returns An Array of whatever `select` returns for each matching mutation.
 *
 * @example
 * Get all variables of all running mutations:
 * ```svelte
 * <script lang="ts">
 *   import { useMutationState } from '@tanstack/svelte-query'
 *
 *   const pendingVariables = useMutationState({
 *     filters: { status: 'pending' },
 *     select: (mutation) => mutation.state.variables,
 *   })
 * </script>
 *
 * {pendingVariables.length} posts saving...
 * ```
 *
 * @example
 * Get all data for specific mutations via the `mutationKey`:
 * ```svelte
 * <script lang="ts">
 *   import { createMutation, useMutationState } from '@tanstack/svelte-query'
 *
 *   const mutationKey = ['posts']
 *
 *   // Some mutation that we want to get the state for
 *   const mutation = createMutation(() => ({
 *     mutationKey,
 *     mutationFn: createPosts,
 *   }))
 *
 *   const savedPosts = useMutationState({
 *     // this mutation key needs to match the mutation key of the given mutation (see above)
 *     filters: { mutationKey, status: 'success' },
 *     select: (mutation) => mutation.state.data,
 *   })
 * </script>
 *
 * <button onclick={() => mutation.mutate(['New Post'])}>
 *   Create post ({savedPosts.length} saved so far)
 * </button>
 * ```
 *
 * @example
 * Access the latest mutation data via the `mutationKey`. Each invocation of `mutate` adds a new entry to the
 * mutation cache for `gcTime` milliseconds — check the last item that `useMutationState` returns to get the
 * latest successful mutation (the `status: 'success'` filter above excludes pending/errored ones):
 * ```svelte
 * <script lang="ts">
 *   import { useMutationState } from '@tanstack/svelte-query'
 *
 *   const savedPosts = useMutationState({
 *     filters: { mutationKey: ['posts'], status: 'success' },
 *     select: (mutation) => mutation.state.data,
 *   })
 *
 *   const latestSavedPost = $derived(savedPosts[savedPosts.length - 1])
 * </script>
 *
 * {latestSavedPost ? 'Saved' : 'Nothing saved yet'}
 * ```
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
        result.splice(0, result.length, ...nextResult)
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
