import {
  DestroyRef,
  Injector,
  assertInInjectionContext,
  inject,
  runInInjectionContext,
  signal,
} from '@angular/core'
import { type QueryFilters, notifyManager } from '@tanstack/query-core'
import { injectQuery } from './injectQuery'
import { QUERY_CLIENT } from './injectQueryClient'
import type { Signal } from '@angular/core'

export function injectIsFetching(
  filters?: QueryFilters,
  injector?: Injector,
): Signal<number> {
  !injector && assertInInjectionContext(injectQuery)
  const assertedInjector = injector ?? inject(Injector)
  return runInInjectionContext(assertedInjector, () => {
    const queryClient = inject(QUERY_CLIENT)
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
