import { DestroyRef, effect, inject, signal } from '@angular/core'
import {
  type DefaultError,
  type Mutation,
  type MutationCache,
  type MutationFilters,
  type MutationState,
  notifyManager,
  replaceEqualDeep,
} from '@tanstack/query-core'
import { assertInjector } from './util/assert-injector/assert-injector'
import { injectQueryClient } from './inject-query-client'
import type { Injector, Signal } from '@angular/core'

type MutationStateOptions<TResult = MutationState> = {
  filters?: MutationFilters
  select?: (
    mutation: Mutation<unknown, DefaultError, unknown, unknown>,
  ) => TResult
}

function getResult<TResult = MutationState>(
  mutationCache: MutationCache,
  options: MutationStateOptions<TResult>,
): Array<TResult> {
  return mutationCache
    .findAll(options.filters)
    .map(
      (mutation): TResult =>
        (options.select
          ? options.select(
              mutation as Mutation<unknown, DefaultError, unknown, unknown>,
            )
          : mutation.state) as TResult,
    )
}

export function injectMutationState<TResult = MutationState>(
  options: () => MutationStateOptions<TResult> = () => ({}),
  injector?: Injector,
): Signal<Array<TResult>> {
  return assertInjector(injectMutationState, injector, () => {
    const destroyRef = inject(DestroyRef)
    const queryClient = injectQueryClient()

    const mutationCache = queryClient.getMutationCache()

    const result = signal<Array<TResult>>(getResult(mutationCache, options()))

    effect(
      () => {
        // Setting the signal from an effect because it's both 'computed' from options()
        // and needs to be set imperatively in the mutationCache listener.
        result.set(getResult(mutationCache, options()))
      },
      {
        allowSignalWrites: true,
      },
    )

    const unsubscribe = mutationCache.subscribe(
      notifyManager.batchCalls(() => {
        const nextResult = replaceEqualDeep(
          result(),
          getResult(mutationCache, options()),
        )
        if (result() !== nextResult) {
          result.set(nextResult)
        }
      }),
    )

    destroyRef.onDestroy(unsubscribe)

    return result
  })
}
