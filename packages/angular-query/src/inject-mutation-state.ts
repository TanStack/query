import { assertInInjectionContext, inject } from '@angular/core'
import { QueryClient } from '@tanstack/query-core'
import { injectExternalStore } from './utils/inject-external-store'
import type { Signal } from '@angular/core'
import type {
  Mutation,
  MutationCache,
  MutationFilters,
  MutationState,
} from '@tanstack/query-core'

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

/**
 * Filters and optional projection for observing entries in the mutation cache.
 */
export type MutationStateOptions<
  TResult = MutationState,
  TMutation extends Mutation<any, any, any, any> =
    MutationTypeFromResult<TResult>,
> = {
  /**
   * Restricts the mutation cache entries included in the result.
   */
  filters?: MutationFilters
  /**
   * Maps each matching mutation to the value exposed in the result signal.
   */
  select?: (mutation: TMutation) => TResult
}

/**
 * Reads and projects the matching entries in a mutation cache.
 * @param mutationCache - The cache to inspect.
 * @param options - Filters and an optional projection for each entry.
 * @returns The selected values, or each matching mutation state.
 */
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
 * Injects a signal that gives you access to all mutations in the `MutationCache`. You can pass `filters`
 * ({@link MutationFilters}) to narrow down your mutations, and `select` to transform the mutation state.
 * @param options - A function returning the `filters` to narrow down matched mutations, and an optional
 * `select` to transform the mutation state. Similar to `computed` from Angular, this function runs in the
 * reactive context, so signals read inside it re-narrow the matched mutations.
 * @returns A `Signal` with an Array of whatever `select` returns for each matching mutation.
 * @example
 * Get all variables of all running mutations:
 * ```angular-ts
 * @Component({
 *   selector: 'pending-posts',
 *   template: `{{ pendingVariables().length }} posts saving...`,
 * })
 * export class PendingPosts {
 *   readonly pendingVariables = injectMutationState(() => ({
 *     filters: { status: 'pending' },
 *     select: (mutation) => mutation.state.variables,
 *   }))
 * }
 * ```
 * @example
 * Get all data for specific mutations via the `mutationKey`:
 * ```angular-ts
 * const mutationKey = ['posts']
 *
 * @Component({
 *   selector: 'posts',
 *   template: `
 *     <button (click)="createPost()">
 *       Create post ({{ savedPosts().length }} saved so far)
 *     </button>
 *   `,
 * })
 * export class Posts {
 *   // Some mutation that we want to get the state for
 *   readonly createPostMutation = injectMutation(() => ({
 *     mutationKey,
 *     mutationFn: createPosts,
 *   }))
 *
 *   readonly savedPosts = injectMutationState(() => ({
 *     // this mutation key needs to match the mutation key of the given mutation (see above)
 *     filters: { mutationKey, status: 'success' },
 *     select: (mutation) => mutation.state.data,
 *   }))
 *
 *   createPost() {
 *     this.createPostMutation.mutate(['New Post'])
 *   }
 * }
 * ```
 */
export function injectMutationState<
  TResult = MutationState,
  TMutation extends Mutation<any, any, any, any> =
    MutationTypeFromResult<TResult>,
>(
  options: () => MutationStateOptions<TResult, TMutation> = () => ({}),
): Signal<Array<TResult>> {
  if (typeof ngDevMode === 'undefined' || ngDevMode) {
    assertInInjectionContext(injectMutationState)
  }
  const queryClient = inject(QueryClient)
  const mutationCache = queryClient.getMutationCache()

  return injectExternalStore(
    () => ({
      getSnapshot: () => getResult(mutationCache, options()),
      subscribe: (onStoreChange) => mutationCache.subscribe(onStoreChange),
    }),
    {
      equal: (previous, next) =>
        previous.length === next.length &&
        previous.every((value, index) => Object.is(value, next[index])),
    },
  )
}
