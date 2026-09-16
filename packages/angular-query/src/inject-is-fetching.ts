import { assertInInjectionContext, inject } from '@angular/core'
import { QueryClient } from '@tanstack/query-core'
import { injectExternalStore } from './utils/inject-external-store'
import type { QueryFilters } from '@tanstack/query-core'
import type { Signal } from '@angular/core'

/**
 * Injects a signal that tracks the number of queries that your application is loading or fetching in the
 * background (useful for app-wide loading indicators).
 *
 * Can be used for app-wide loading indicators
 * @param filters - A reactive factory for the filters.
 * @returns signal with number of loading or fetching queries.
 */
export function injectIsFetching(
  filters: () => QueryFilters = () => ({}),
): Signal<number> {
  if (typeof ngDevMode === 'undefined' || ngDevMode) {
    assertInInjectionContext(injectIsFetching)
  }
  const queryClient = inject(QueryClient)
  const cache = queryClient.getQueryCache()

  return injectExternalStore(() => ({
    getSnapshot: () => queryClient.isFetching(filters()),
    subscribe: (onStoreChange) => cache.subscribe(onStoreChange),
  }))
}
