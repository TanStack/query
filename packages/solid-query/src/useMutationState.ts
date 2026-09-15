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

/**
 * `useMutationState` is a hook that gives you access to all mutations in the `MutationCache`. You can pass
 * `filters` ({@link MutationFilters}) to narrow down your mutations, and `select` to transform the mutation
 * state.
 *
 * @param options - An accessor returning the `filters` to narrow down matched mutations, and an optional
 * `select` to transform the mutation state.
 * @param queryClient - An accessor for a custom `QueryClient`. Otherwise, the one from the nearest context
 * will be used.
 * @returns An accessor for an array of whatever `select` returns for each matching mutation.
 *
 * @example
 * Get all variables of all running mutations:
 * ```tsx
 * import { useMutationState } from '@tanstack/solid-query'
 *
 * function PendingPosts() {
 *   const pendingVariables = useMutationState(() => ({
 *     filters: { status: 'pending' },
 *     select: (mutation) => mutation.state.variables,
 *   }))
 *
 *   return <>{pendingVariables().length} posts saving...</>
 * }
 * ```
 *
 * @example
 * Get all data for specific mutations via the `mutationKey`:
 * ```tsx
 * import { useMutation, useMutationState } from '@tanstack/solid-query'
 *
 * const mutationKey = ['posts']
 *
 * function Posts() {
 *   // Some mutation that we want to get the state for
 *   const createPostsMutation = useMutation(() => ({
 *     mutationKey,
 *     mutationFn: createPosts,
 *   }))
 *
 *   const savedPosts = useMutationState(() => ({
 *     // this mutation key needs to match the mutation key of the given mutation (see above)
 *     filters: { mutationKey, status: 'success' },
 *     select: (mutation) => mutation.state.data,
 *   }))
 *
 *   return (
 *     <button onClick={() => createPostsMutation.mutate(['New Post'])}>
 *       Create post ({savedPosts().length} saved so far)
 *     </button>
 *   )
 * }
 * ```
 *
 * @example
 * Access the latest successful mutation data via the `mutationKey`. Each invocation of `mutate` adds a new
 * entry to the mutation cache for `gcTime` milliseconds — with the `status: 'success'` filter below, check the
 * last item that `useMutationState` returns to get the latest successful invocation:
 * ```tsx
 * import { useMutationState } from '@tanstack/solid-query'
 *
 * function LatestPost() {
 *   const savedPosts = useMutationState(() => ({
 *     filters: { mutationKey: ['posts'], status: 'success' },
 *     select: (mutation) => mutation.state.data,
 *   }))
 *
 *   const latestPost = () => savedPosts()[savedPosts().length - 1]
 *
 *   return <span>{latestPost()?.title}</span>
 * }
 * ```
 */
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
