import { assertInInjectionContext, inject } from '@angular/core'
import {
  QueryClient,
  countFetchingQueries,
  getQueryCache,
} from '@tanstack/query-core'
import { injectExternalStore } from './utils/inject-external-store'
import type { Signal } from '@angular/core'
import type { QueryFilters } from '@tanstack/query-core'

/**
 * Injects a signal that tracks the number of queries that your application is loading or fetching in the
 * background (useful for app-wide loading indicators).
 * @param filters - A function returning the {@link QueryFilters} to narrow down the matched queries. Similar
 * to `computed` from Angular, this function runs in the reactive context, so signals read inside it
 * re-narrow the matched queries.
 * @returns A `Signal` with the number of queries that your application is currently loading or fetching in
 * the background.
 * @example
 * ```angular-ts
 * @Component({
 *   selector: 'posts-fetching-indicator',
 *   template: `
 *     @if (isFetchingPosts()) {
 *       <span>Refreshing posts...</span>
 *     }
 *   `,
 * })
 * export class PostsFetchingIndicator {
 *   // How many queries matching the posts prefix are fetching?
 *   readonly isFetchingPosts = injectIsFetching(() => ({ queryKey: ['posts'] }))
 * }
 * ```
 * @example
 * A global loading indicator for any query fetching in the background, not just the ones on screen:
 * ```angular-ts
 * @Component({
 *   selector: 'global-loading-indicator',
 *   template: `
 *     @if (isFetching()) {
 *       <div>Queries are fetching in the background...</div>
 *     }
 *   `,
 * })
 * export class GlobalLoadingIndicator {
 *   readonly isFetching = injectIsFetching()
 * }
 * ```
 */
export function injectIsFetching(
  filters: () => Omit<QueryFilters, 'fetchStatus'> = () => ({}),
): Signal<number> {
  if (typeof ngDevMode === 'undefined' || ngDevMode) {
    assertInInjectionContext(injectIsFetching)
  }
  const queryClient = inject(QueryClient)
  const cache = getQueryCache(queryClient)

  return injectExternalStore(() => ({
    getSnapshot: () => countFetchingQueries(queryClient, filters()),
    subscribe: (onStoreChange) => cache.subscribe(onStoreChange),
  }))
}
