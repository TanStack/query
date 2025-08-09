import {
  DestroyRef,
  Injector,
  NgZone,
  assertInInjectionContext,
  inject,
  signal,
} from '@angular/core'
import { QueryClient, notifyManager } from '@tanstack/query-core'
import type { MutationFilters } from '@tanstack/query-core'
import type { Signal } from '@angular/core'

export interface InjectIsMutatingOptions {
  /**
   * The `Injector` in which to create the isMutating signal.
   *
   * If this is not provided, the current injection context will be used instead (via `inject`).
   */
  injector?: Injector
}

/**
 * Injects a signal that tracks the number of mutations that your application is fetching.
 *
 * Can be used for app-wide loading indicators
 * @param filters - The filters to apply to the query.
 * @param options - Additional configuration
 * @returns signal with number of fetching mutations.
 */
export function injectIsMutating(
  filters?: MutationFilters,
  options?: InjectIsMutatingOptions,
): Signal<number> {
  !options?.injector && assertInInjectionContext(injectIsMutating)
  const injector = options?.injector ?? inject(Injector)
  const destroyRef = injector.get(DestroyRef)
  const ngZone = injector.get(NgZone)
  const queryClient = injector.get(QueryClient)

  const cache = queryClient.getMutationCache()
  // isMutating is the prev value initialized on mount *
  let isMutating = queryClient.isMutating(filters)

  const result = signal(isMutating)

  const unsubscribe = ngZone.runOutsideAngular(() =>
    cache.subscribe(
      notifyManager.batchCalls(() => {
        const newIsMutating = queryClient.isMutating(filters)
        if (isMutating !== newIsMutating) {
          // * and update with each change
          isMutating = newIsMutating
          ngZone.run(() => {
            result.set(isMutating)
          })
        }
      }),
    ),
  )

  destroyRef.onDestroy(unsubscribe)

  return result
}
