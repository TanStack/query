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
 * `useIsMutating` is an optional hook that returns the `number` of mutations that your application is fetching
 * (useful for app-wide loading indicators).
 *
 * @param filters - The {@link MutationFilters} to narrow down the matched mutations.
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
 * be used.
 * @returns Will be the `number` of the mutations that your application is currently fetching.
 *
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
 * `useMutationState` is a hook that gives you access to all mutations in the `MutationCache`. You can pass
 * `filters` ({@link MutationFilters}) to narrow down your mutations, and `select` to transform the mutation
 * state.
 *
 * @param options - The `filters` to narrow down matched mutations, and an optional `select` to transform the
 * mutation state.
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
 * be used.
 * @returns Will be an Array of whatever `select` returns for each matching mutation.
 *
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
 *
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
 *
 * @example
 * Access the latest mutation data via the `mutationKey`. Each invocation of `mutate` adds a new entry to the
 * mutation cache for `gcTime` milliseconds — check the last item that `useMutationState` returns to get the
 * latest invocation:
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
  const optionsRef = React.useRef(options)
  const result = React.useRef<Array<TResult>>(null)
  if (result.current === null) {
    result.current = getResult(mutationCache, options)
  }

  React.useEffect(() => {
    optionsRef.current = options
  })

  return React.useSyncExternalStore(
    React.useCallback(
      (onStoreChange) =>
        mutationCache.subscribe(() => {
          const nextResult = replaceEqualDeep(
            result.current,
            getResult(mutationCache, optionsRef.current),
          )
          if (result.current !== nextResult) {
            result.current = nextResult
            notifyManager.schedule(onStoreChange)
          }
        }),
      [mutationCache],
    ),
    () => result.current,
    () => result.current,
  )!
}
