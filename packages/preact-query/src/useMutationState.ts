import { notifyManager, replaceEqualDeep } from '@tanstack/query-core'
import type {
  Mutation,
  MutationCache,
  MutationFilters,
  MutationState,
  QueryClient,
} from '@tanstack/query-core'
import { useCallback, useEffect, useRef } from 'preact/hooks'

import { useQueryClient } from './QueryClientProvider'
import { useSyncExternalStore } from './utils'

/**
 * `useIsMutating` is an optional hook that returns the `number` of mutations that your application is fetching
 * (useful for app-wide loading indicators).
 *
 * @param filters - The {@link MutationFilters} to narrow down the matched mutations.
 * @param queryClient - Use this to use a custom QueryClient. Otherwise, the one from the nearest context will
 * be used.
 * @returns Will be the `number` of the mutations that your application is currently fetching.
 *
 * @example
 * ```tsx
 * import { useIsMutating } from '@tanstack/preact-query'
 *
 * // How many mutations are fetching?
 * const isMutating = useIsMutating()
 * // How many mutations matching the posts prefix are fetching?
 * const isMutatingPosts = useIsMutating({ mutationKey: ['posts'] })
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
 * @param queryClient - Use this to use a custom QueryClient. Otherwise, the one from the nearest context will
 * be used.
 * @returns Will be an Array of whatever `select` returns for each matching mutation.
 *
 * @example
 * Get all variables of all running mutations:
 * ```tsx
 * import { useMutationState } from '@tanstack/preact-query'
 *
 * const variables = useMutationState({
 *   filters: { status: 'pending' },
 *   select: (mutation) => mutation.state.variables,
 * })
 * ```
 *
 * @example
 * Get all data for specific mutations via the `mutationKey`:
 * ```tsx
 * import { useMutation, useMutationState } from '@tanstack/preact-query'
 *
 * const mutationKey = ['posts']
 *
 * // Some mutation that we want to get the state for
 * const mutation = useMutation({
 *   mutationKey,
 *   mutationFn: createPosts,
 * })
 *
 * const data = useMutationState({
 *   // this mutation key needs to match the mutation key of the given mutation (see above)
 *   filters: { mutationKey },
 *   select: (mutation) => mutation.state.data,
 * })
 * ```
 *
 * @example
 * Access the latest mutation data via the `mutationKey`. Each invocation of `mutate` adds a new entry to the
 * mutation cache for `gcTime` milliseconds — check the last item that `useMutationState` returns to get the
 * latest invocation:
 * ```tsx
 * const data = useMutationState({
 *   filters: { mutationKey: ['posts'] },
 *   select: (mutation) => mutation.state.data,
 * })
 *
 * const latest = data[data.length - 1]
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
  const optionsRef = useRef(options)
  const result = useRef<Array<TResult>>(null)
  if (result.current === null) {
    result.current = getResult(mutationCache, options)
  }

  useEffect(() => {
    optionsRef.current = options
  })

  return useSyncExternalStore(
    useCallback(
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
  )!
}
