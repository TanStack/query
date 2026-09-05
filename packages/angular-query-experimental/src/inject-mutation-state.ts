import {
  DestroyRef,
  Injector,
  NgZone,
  assertInInjectionContext,
  computed,
  inject,
  signal,
} from '@angular/core'
import {
  QueryClient,
  notifyManager,
  replaceEqualDeep,
} from '@tanstack/query-core'
import type { Signal } from '@angular/core'
import type {
  Mutation,
  MutationCache,
  MutationFilters,
  MutationState,
} from '@tanstack/query-core'

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

export interface InjectMutationStateOptions {
  /**
   * The `Injector` in which to create the mutation state signal.
   *
   * If this is not provided, the current injection context will be used instead (via `inject`).
   */
  injector?: Injector
}

/**
 * Injects a signal that gives you access to all mutations in the `MutationCache`. You can pass `filters`
 * ({@link MutationFilters}) to narrow down your mutations, and `select` to transform the mutation state.
 *
 * @param injectMutationStateFn - A function returning the `filters` to narrow down matched mutations, and an
 * optional `select` to transform the mutation state. Similar to `computed` from Angular, this function runs
 * in the reactive context, so signals read inside it re-narrow the matched mutations.
 * @param options - Additional configuration
 * @returns A `Signal` with an Array of whatever `select` returns for each matching mutation.
 *
 * @example
 * Get all variables of all running mutations:
 * ```angular-ts
 * @Component({
 *   selector: 'pending-posts',
 *   template: `{{ pendingVariables().length }} posts saving...`,
 * })
 * export class PendingPosts {
 *   pendingVariables = injectMutationState(() => ({
 *     filters: { status: 'pending' },
 *     select: (mutation) => mutation.state.variables,
 *   }))
 * }
 * ```
 *
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
 *   createPostMutation = injectMutation(() => ({
 *     mutationKey,
 *     mutationFn: createPosts,
 *   }))
 *
 *   savedPosts = injectMutationState(() => ({
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
export function injectMutationState<TResult = MutationState>(
  injectMutationStateFn: () => MutationStateOptions<TResult> = () => ({}),
  options?: InjectMutationStateOptions,
): Signal<Array<TResult>> {
  !options?.injector && assertInInjectionContext(injectMutationState)
  const injector = options?.injector ?? inject(Injector)
  const destroyRef = injector.get(DestroyRef)
  const ngZone = injector.get(NgZone)
  const queryClient = injector.get(QueryClient)
  const mutationCache = queryClient.getMutationCache()

  /**
   * Computed signal that gets result from mutation cache based on passed options
   * First element is the result, second element is the time when the result was set
   */
  const resultFromOptionsSignal = computed(() => {
    return [
      getResult(mutationCache, injectMutationStateFn()),
      performance.now(),
    ] as const
  })

  /**
   * Signal that contains result set by subscriber
   * First element is the result, second element is the time when the result was set
   */
  const resultFromSubscriberSignal = signal<[Array<TResult>, number] | null>(
    null,
  )

  /**
   * Returns the last result by either subscriber or options
   */
  const effectiveResultSignal = computed(() => {
    const optionsResult = resultFromOptionsSignal()
    const subscriberResult = resultFromSubscriberSignal()
    return subscriberResult && subscriberResult[1] > optionsResult[1]
      ? subscriberResult[0]
      : optionsResult[0]
  })

  const unsubscribe = ngZone.runOutsideAngular(() =>
    mutationCache.subscribe(
      notifyManager.batchCalls(() => {
        const [lastResult] = effectiveResultSignal()
        const nextResult = replaceEqualDeep(
          lastResult,
          getResult(mutationCache, injectMutationStateFn()),
        )
        if (lastResult !== nextResult) {
          ngZone.run(() => {
            resultFromSubscriberSignal.set([nextResult, performance.now()])
          })
        }
      }),
    ),
  )

  destroyRef.onDestroy(unsubscribe)

  return effectiveResultSignal
}
