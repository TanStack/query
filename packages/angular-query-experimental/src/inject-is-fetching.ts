import {
  DestroyRef,
  Injector,
  NgZone,
  assertInInjectionContext,
  inject,
  signal,
} from '@angular/core'
import { QueryClient, notifyManager } from '@tanstack/query-core'
import type { QueryFilters } from '@tanstack/query-core'
import type { Signal } from '@angular/core'

export interface InjectIsFetchingOptions {
  /**
   * The `Injector` in which to create the isFetching signal.
   *
   * If this is not provided, the current injection context will be used instead (via `inject`).
   */
  injector?: Injector
}

/**
 * Injects a signal that tracks the number of queries that your application is loading or fetching in the
 * background (useful for app-wide loading indicators).
 *
 * @param filters - The {@link QueryFilters} to narrow down the matched queries.
 * @param options - Additional configuration
 * @returns A `Signal` with the number of queries that your application is currently loading or fetching in
 * the background.
 *
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
 *   isFetchingPosts = injectIsFetching({ queryKey: ['posts'] })
 * }
 * ```
 *
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
 *   isFetching = injectIsFetching()
 * }
 * ```
 */
export function injectIsFetching(
  filters?: QueryFilters,
  options?: InjectIsFetchingOptions,
): Signal<number> {
  !options?.injector && assertInInjectionContext(injectIsFetching)
  const injector = options?.injector ?? inject(Injector)
  const destroyRef = injector.get(DestroyRef)
  const ngZone = injector.get(NgZone)
  const queryClient = injector.get(QueryClient)

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
}
