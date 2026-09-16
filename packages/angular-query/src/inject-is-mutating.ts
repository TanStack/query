import { assertInInjectionContext, inject } from '@angular/core'
import { QueryClient } from '@tanstack/query-core'
import { injectExternalStore } from './utils/inject-external-store'
import type { MutationFilters } from '@tanstack/query-core'
import type { Signal } from '@angular/core'

/**
 * Injects a signal that tracks the number of mutations that your application currently has `pending`
 * (useful for app-wide loading indicators).
 *
 * Can be used for app-wide loading indicators
 * @param filters - A reactive factory for the filters.
 * @returns A read-only signal with the number of fetching mutations.
 */
export function injectIsMutating(
  filters: () => MutationFilters = () => ({}),
): Signal<number> {
  if (typeof ngDevMode === 'undefined' || ngDevMode) {
    assertInInjectionContext(injectIsMutating)
  }
  const queryClient = inject(QueryClient)
  const cache = queryClient.getMutationCache()

  return injectExternalStore(() => ({
    getSnapshot: () => queryClient.isMutating(filters()),
    subscribe: (onStoreChange) => cache.subscribe(onStoreChange),
  }))
}
