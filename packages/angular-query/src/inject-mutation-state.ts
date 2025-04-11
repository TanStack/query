import { DestroyRef, NgZone, computed, inject, signal } from '@angular/core'
import {
  QueryClient,
  notifyManager,
  replaceEqualDeep,
} from '@tanstack/query-core'
import { assertInjector } from './util/assert-injector/assert-injector'
import type { Injector, Signal } from '@angular/core'
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

/**
 *
 * @param mutationCache
 * @param options
 */
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

/**
 * @public
 */
export interface InjectMutationStateOptions {
  /**
   * The `Injector` in which to create the mutation state signal.
   *
   * If this is not provided, the current injection context will be used instead (via `inject`).
   */
  injector?: Injector
}

/**
 * Injects a signal that tracks the state of all mutations.
 * @param injectMutationStateFn - A function that returns mutation state options.
 * @param options - The Angular injector to use.
 * @returns The signal that tracks the state of all mutations.
 * @public
 */
export function injectMutationState<TResult = MutationState>(
  injectMutationStateFn: () => MutationStateOptions<TResult> = () => ({}),
  options?: InjectMutationStateOptions,
): Signal<Array<TResult>> {
  return assertInjector(injectMutationState, options?.injector, () => {
    const destroyRef = inject(DestroyRef)
    const ngZone = inject(NgZone)
    const queryClient = inject(QueryClient)

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
  })
}
