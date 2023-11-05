import {
  DestroyRef,
  assertInInjectionContext,
  inject,
  runInInjectionContext,
  signal,
} from '@angular/core'
import { type MutationFilters, notifyManager } from '@tanstack/query-core'
import { assertInjector } from 'ngxtension/assert-injector'
import { injectQuery } from './injectQuery'
import { QUERY_CLIENT } from './injectQueryClient'
import type { Injector, Signal } from '@angular/core'

export function injectIsMutating(
  filters?: MutationFilters,
  injector?: Injector,
): Signal<number> {
  injector = assertInjector(injectQuery, injector)
  return runInInjectionContext(injector, () => {
    const queryClient = inject(QUERY_CLIENT)

    assertInInjectionContext(injectIsMutating)
    const cache = queryClient.getMutationCache()
    // isMutating is the prev value initialized on mount *
    let isMutating = queryClient.isMutating(filters)

    const result = signal(isMutating)
    const unsubscribe = cache.subscribe(
      notifyManager.batchCalls(() => {
        const newIsMutating = queryClient.isMutating(filters)
        if (isMutating !== newIsMutating) {
          // * and update with each change
          isMutating = newIsMutating
          result.set(isMutating)
        }
      }),
    )
    const destroyRef = inject(DestroyRef)
    destroyRef.onDestroy(unsubscribe)
    return result
  })
}
