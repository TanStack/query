import { DestroyRef, NgZone, inject, signal } from '@angular/core'
import { QueryClient, notifyManager } from '@tanstack/query-core'
import { assertInjector } from './util/assert-injector/assert-injector'
import type { MutationFilters } from '@tanstack/query-core'
import type { Injector, Signal } from '@angular/core'

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
 * @public
 */
export function injectIsMutating(
  filters?: MutationFilters,
  options?: InjectIsMutatingOptions,
): Signal<number> {
  return assertInjector(injectIsMutating, options?.injector, () => {
    const destroyRef = inject(DestroyRef)
    const ngZone = inject(NgZone)
    const queryClient = inject(QueryClient)

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
  })
}
