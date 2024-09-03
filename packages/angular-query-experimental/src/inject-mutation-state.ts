import {
  DestroyRef,
  NgZone,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core'
import { notifyManager, replaceEqualDeep } from '@tanstack/query-core'
import { assertInjector } from './util/assert-injector/assert-injector'
import { injectQueryClient } from './inject-query-client'
import { lazySignalInitializer } from './util/lazy-signal-initializer/lazy-signal-initializer'
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
    const queryClient = injectQueryClient()
    const ngZone = inject(NgZone)

    const mutationCache = queryClient.getMutationCache()

    return lazySignalInitializer((injector) => {
      const result = signal<Array<TResult>>(
        getResult(mutationCache, mutationStateOptionsFn()),
      )

      effect(
        () => {
          const mutationStateOptions = mutationStateOptionsFn()
          untracked(() => {
            // Setting the signal from an effect because it's both 'computed' from options()
            // and needs to be set imperatively in the mutationCache listener.
            result.set(getResult(mutationCache, mutationStateOptions))
          })
        },
        { injector },
      )

      const unsubscribe = mutationCache.subscribe(
        notifyManager.batchCalls(() => {
          const nextResult = replaceEqualDeep(
            result(),
            getResult(mutationCache, mutationStateOptionsFn()),
          )
          if (result() !== nextResult) {
            ngZone.run(() => {
              result.set(nextResult)
            })
          }
        }),
      )

      destroyRef.onDestroy(unsubscribe)

      return result
    })
  })
}
