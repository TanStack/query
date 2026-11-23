import { assertInInjectionContext, inject } from '@angular/core'
import { QueryClient, getMutationCache } from '@tanstack/query-core'
import { injectExternalStore } from './utils/inject-external-store'
import type { Signal } from '@angular/core'
import type { MutationFilters } from '@tanstack/query-core'

/**
 * Injects a signal that tracks the number of mutations that your application currently has `pending`
 * (useful for app-wide loading indicators).
 * @param filters - A function returning the {@link MutationFilters} to narrow down the matched mutations.
 * Similar to `computed` from Angular, this function runs in the reactive context, so signals read inside it
 * re-narrow the matched mutations.
 * @returns A `Signal` with the number of mutations that your application currently has `pending`.
 * @example
 * ```angular-ts
 * @Component({
 *   selector: 'posts-mutating-indicator',
 *   template: `
 *     @if (isMutatingPosts()) {
 *       <span>Saving posts...</span>
 *     }
 *   `,
 * })
 * export class PostsMutatingIndicator {
 *   // How many mutations matching the posts prefix are in progress?
 *   readonly isMutatingPosts = injectIsMutating(() => ({ mutationKey: ['posts'] }))
 * }
 * ```
 */
export function injectIsMutating(
  filters: () => Omit<MutationFilters, 'status'> = () => ({}),
): Signal<number> {
  if (typeof ngDevMode === 'undefined' || ngDevMode) {
    assertInInjectionContext(injectIsMutating)
  }
  const queryClient = inject(QueryClient)
  const cache = getMutationCache(queryClient)

  return injectExternalStore(() => ({
    getSnapshot: () => queryClient.isMutating(filters()),
    subscribe: (onStoreChange) => cache.subscribe(onStoreChange),
  }))
}
