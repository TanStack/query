import { DestroyRef, NgZone, inject, signal } from '@angular/core'
import { QueryClient, notifyManager } from '@tanstack/query-core'
import { assertInjector } from './util/assert-injector/assert-injector'
import type { QueryFilters } from '@tanstack/query-core'
import type { Injector, Signal } from '@angular/core'

/**
 * Injects a signal that tracks the number of queries that your application is loading or
 * fetching in the background.
 *
 * Can be used for app-wide loading indicators
 * @param filters - The filters to apply to the query.
 * @param injector - The Angular injector to use.
 * @returns signal with number of loading or fetching queries.
 * @public
 */
export function injectIsFetching(
  filters?: QueryFilters,
  injector?: Injector,
): Signal<number> {
  return assertInjector(injectIsFetching, injector, () => {
    const destroyRef = inject(DestroyRef)
    const ngZone = inject(NgZone)
    const queryClient = inject(QueryClient)

    const cache = queryClient.getQueryCache()
    // isFetching is the prev value initialized on mount *
    let isFetching = queryClient.isFetching(filters)

    const result = signal(isFetching)

    const unsubscribe = cache.subscribe(
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
    )

    destroyRef.onDestroy(unsubscribe)

    return result
  })
}
