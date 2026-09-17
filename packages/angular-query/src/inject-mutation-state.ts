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

export type MutationStateOptions<
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
 * Injects a signal that tracks the state of all mutations.
 * @param options - A function that returns mutation state options.
 * @returns The signal that tracks the state of all mutations.
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
