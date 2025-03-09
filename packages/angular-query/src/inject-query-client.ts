import { Injector, inject } from '@angular/core'
import { QueryClient } from '@tanstack/query-core'
import type { InjectOptions } from '@angular/core'

/**
 * Injects a `QueryClient` instance and allows passing a custom injector.
 * @param injectOptions - Type of the options argument to inject and optionally a custom injector.
 * @returns The `QueryClient` instance.
 * @public
 * @deprecated Use `inject(QueryClient)` instead.
 * If you need to get a `QueryClient` from a custom injector, use `injector.get(QueryClient)`.
 *
 *
 * **Example**
 * ```ts
 * const queryClient = injectQueryClient();
 * ```
 */
export function injectQueryClient(
  injectOptions: InjectOptions & { injector?: Injector } = {},
) {
  return (injectOptions.injector ?? inject(Injector)).get(QueryClient)
}
