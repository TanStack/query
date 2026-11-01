'use client'
import * as React from 'react'

import { notifyManager, replaceEqualDeep } from '@tanstack/query-core'
import { useQueryClient } from './QueryClientProvider'
import type {
  Mutation,
  MutationCache,
  MutationFilters,
  MutationState,
  QueryClient,
} from '@tanstack/query-core'

/**
 * The `useIsMutating` hook returns the `number` of mutations that your application currently has `pending`
 * (useful for app-wide loading indicators).
 * @param filters - The {@link MutationFilters} to narrow down the matched mutations.
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
 * be used.
 * @returns Will be the `number` of the mutations that your application currently has `pending`.
 * @example
 * ```tsx
 * import { useIsMutating } from '@tanstack/react-query'
 *
 * function PostsMutatingIndicator() {
 *   // How many mutations matching the posts prefix are in progress?
 *   const isMutatingPosts = useIsMutating({ mutationKey: ['posts'] })
 *
 *   return isMutatingPosts ? <span>Saving posts...</span> : null
 * }
 * ```
 */
export function useIsMutating(
  filters?: MutationFilters,
  queryClient?: QueryClient,
): number {
  const client = useQueryClient(queryClient)
  return useMutationState(
    { filters: { ...filters, status: 'pending' } },
    client,
  ).length
}

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

/**
 * Creates snapshot getters that share equal selected results across renders.
 * A new getter is created on each render. Each getter caches its snapshot until the matching mutations
 * or their states change.
 * @returns A factory for snapshot getters with a shared result cache.
 */
function createSnapshotFactory<
  TResult = MutationState,
  TMutation extends Mutation<any, any, any, any> =
    MutationTypeFromResult<TResult>,
>() {
  let previousResult: Array<TResult> | undefined

  return (
    mutationCache: MutationCache,
    options: MutationStateOptions<TResult, TMutation>,
  ) => {
    let inputs: Array<unknown> = []
    let snapshot: Array<TResult> | undefined

    return (): Array<TResult> => {
      const mutations = mutationCache.findAll(options.filters)
      const nextInputs = mutations.flatMap((mutation) => [
        mutation,
        mutation.state,
      ])

      if (
        !snapshot ||
        nextInputs.length !== inputs.length ||
        nextInputs.some((input, index) => !Object.is(input, inputs[index]))
      ) {
        inputs = nextInputs
        snapshot = replaceEqualDeep(
          previousResult,
          mutations.map(
            (mutation): TResult =>
              (options.select
                ? options.select(mutation as TMutation)
                : mutation.state) as TResult,
          ),
        )
        previousResult = snapshot
      }

      return snapshot
    }
  }
}

/**
 * `useMutationState` is a hook that gives you access to all mutations in the `MutationCache`. You can pass
 * `filters` ({@link MutationFilters}) to narrow down your mutations, and `select` to transform the mutation
 * state.
 * @param options - The `filters` to narrow down matched mutations, and an optional `select` to transform the
 * mutation state.
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
 * be used.
 * @returns Will be an Array of whatever `select` returns for each matching mutation.
 * @example
 * Get all variables of all running mutations:
 * ```tsx
 * import { useMutationState } from '@tanstack/react-query'
 *
 * function PendingPosts() {
 *   const pendingVariables = useMutationState({
 *     filters: { status: 'pending' },
 *     select: (mutation) => mutation.state.variables,
 *   })
 *
 *   return <>{pendingVariables.length} posts saving...</>
 * }
 * ```
 * @example
 * Get all data for specific mutations via the `mutationKey`:
 * ```tsx
 * import { useMutation, useMutationState } from '@tanstack/react-query'
 *
 * const mutationKey = ['posts']
 *
 * function Posts() {
 *   // Some mutation that we want to get the state for
 *   const mutation = useMutation({
 *     mutationKey,
 *     mutationFn: createPosts,
 *   })
 *
 *   const savedPosts = useMutationState({
 *     // this mutation key needs to match the mutation key of the given mutation (see above)
 *     filters: { mutationKey, status: 'success' },
 *     select: (mutation) => mutation.state.data,
 *   })
 *
 *   return (
 *     <button onClick={() => mutation.mutate(['New Post'])}>
 *       Create post ({savedPosts.length} saved so far)
 *     </button>
 *   )
 * }
 * ```
 * @example
 * Access the latest successful mutation data via the `mutationKey`. Each invocation of `mutate` adds a new
 * entry to the mutation cache for `gcTime` milliseconds — with the `status: 'success'` filter below, check the
 * last item that `useMutationState` returns to get the latest successful invocation:
 * ```tsx
 * import { useMutationState } from '@tanstack/react-query'
 *
 * function LatestPost() {
 *   const savedPosts = useMutationState({
 *     filters: { mutationKey: ['posts'], status: 'success' },
 *     select: (mutation) => mutation.state.data,
 *   })
 *
 *   const latestSavedPost = savedPosts[savedPosts.length - 1]
 *
 *   return <>{latestSavedPost ? 'Saved' : 'Nothing saved yet'}</>
 * }
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
  const [createSnapshot] = React.useState(() =>
    createSnapshotFactory<TResult, TMutation>(),
  )
  const getSnapshot = createSnapshot(mutationCache, options)

  return React.useSyncExternalStore(
    React.useCallback(
      (onStoreChange) =>
        mutationCache.subscribe(notifyManager.batchCalls(onStoreChange)),
      [mutationCache],
    ),
    getSnapshot,
    getSnapshot,
  )
}
