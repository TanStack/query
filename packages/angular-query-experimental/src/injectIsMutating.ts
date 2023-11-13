import { DestroyRef, inject, signal } from '@angular/core'
import { type MutationFilters, notifyManager } from '@tanstack/query-core'
import { assertInjector } from 'ngxtension/assert-injector'
import { injectQueryClient } from './injectQueryClient'
import type { Injector, Signal } from '@angular/core'

export function injectIsMutating(
  filters?: MutationFilters,
  injector?: Injector,
): Signal<number> {
  return assertInjector(injectIsMutating, injector, () => {
    const queryClient = injectQueryClient()
    const destroyRef = inject(DestroyRef)

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

    destroyRef.onDestroy(unsubscribe)

    return result
  })
}
