import { DestroyRef, inject, signal } from '@angular/core'
import { type QueryFilters, notifyManager } from '@tanstack/query-core'
import { assertInjector } from 'ngxtension/assert-injector'
import { injectQueryClient } from './injectQueryClient'
import type { Injector, Signal } from '@angular/core'

export function injectIsFetching(
  filters?: QueryFilters,
  injector?: Injector,
): Signal<number> {
  return assertInjector(injectIsFetching, injector, () => {
    const queryClient = injectQueryClient()
    const destroyRef = inject(DestroyRef)

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
          result.set(isFetching)
        }
      }),
    )

    destroyRef.onDestroy(unsubscribe)

    return result
  })
}
