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
  injector?: Injector
}

/**
 * Injects a signal that tracks the state of all mutations.
 * @param mutationStateOptionsFn - A function that returns mutation state options.
 * @param options - The Angular injector to use.
 * @returns The signal that tracks the state of all mutations.
 * @public
 */
export function injectMutationState<TResult = MutationState>(
  mutationStateOptionsFn: () => MutationStateOptions<TResult> = () => ({}),
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
        getResult(mutationCache, mutationStateOptionsFn()),
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
            getResult(mutationCache, mutationStateOptionsFn()),
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
