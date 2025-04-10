import { DestroyRef, NgZone, inject, signal } from '@angular/core'
import { QueryClient, notifyManager } from '@tanstack/query-core'
import { assertInjector } from './util/assert-injector/assert-injector'
import type { QueryFilters } from '@tanstack/query-core'
import type { Injector, Signal } from '@angular/core'

export interface InjectIsFetchingOptions {
  /**
   * The `Injector` in which to create the isFetching signal.
   *
   * If this is not provided, the current injection context will be used instead (via `inject`).
   */
  injector?: Injector
}

/**
 * Injects a signal that tracks the number of queries that your application is loading or
 * fetching in the background.
 *
 * Can be used for app-wide loading indicators
 * @param filters - The filters to apply to the query.
 * @param options - Additional configuration
 * @returns signal with number of loading or fetching queries.
 * @public
 */
export function injectIsFetching(
  filters?: QueryFilters,
  options?: InjectIsFetchingOptions,
): Signal<number> {
  return assertInjector(injectIsFetching, options?.injector, () => {
    const destroyRef = inject(DestroyRef)
    const ngZone = inject(NgZone)
    const queryClient = inject(QueryClient)

    const cache = queryClient.getQueryCache()
    // isFetching is the prev value initialized on mount *
    let isFetching = queryClient.isFetching(filters)

    const result = signal(isFetching)

    const unsubscribe = ngZone.runOutsideAngular(() =>
      cache.subscribe(
        notifyManager.batchCalls(() => {
          const newIsFetching = queryClient.isFetching(filters)
          if (isFetching !== newIsFetching) {
            // * and update with each change
            isFetching = newIsFetching
            ngZone.run(() => {
              result.set(isFetching)
            })
          }
        }),
      ),
    )

    destroyRef.onDestroy(unsubscribe)

    return result
  })
}
