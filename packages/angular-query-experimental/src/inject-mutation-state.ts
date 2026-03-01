import {
  DestroyRef,
  Injector,
  NgZone,
  assertInInjectionContext,
  computed,
  inject,
  signal,
  untracked,
} from '@angular/core'
import { QueryClient, replaceEqualDeep } from '@tanstack/query-core'
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
 * @param mutationStateFn - A function that returns mutation state options.
 * @param options - The Angular injector to use.
 * @returns The signal that tracks the state of all mutations.
 */
export function injectMutationState<TResult = MutationState>(
  mutationStateFn: () => MutationStateOptions<TResult> = () => ({}),
  options?: InjectMutationStateOptions,
): Signal<Array<TResult>> {
  !options?.injector && assertInInjectionContext(injectMutationState)
  const injector = options?.injector ?? inject(Injector)
  const destroyRef = injector.get(DestroyRef)
  const ngZone = injector.get(NgZone)
  const queryClient = injector.get(QueryClient)
  const mutationCache = queryClient.getMutationCache()

  /**
   * Returning a writable signal from a computed is similar to `linkedSignal`,
   * but compatible with Angular < 19
   *
   * Compared to `linkedSignal`, this pattern requires extra parentheses:
   * - Accessing value: `result()()`
   * - Setting value: `result().set(newValue)`
   */
  const linkedStateSignal = computed(() =>
    signal(getResult(mutationCache, mutationStateFn())),
  )

  const updateMutationState = () =>
    ngZone.run(() =>
      untracked(() =>
        linkedStateSignal().update((current) => {
          const next = getResult(mutationCache, mutationStateFn())
          return replaceEqualDeep(current, next)
        }),
      ),
    )

  const unsubscribe = ngZone.runOutsideAngular(() =>
    mutationCache.subscribe(updateMutationState),
  )

  destroyRef.onDestroy(unsubscribe)

  return computed(() => linkedStateSignal()())
}
