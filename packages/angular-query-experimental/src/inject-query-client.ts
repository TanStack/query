import { Injector, inject } from '@angular/core'
import { QueryClient } from '@tanstack/query-core'
import type { InjectOptions } from '@angular/core'

/**
 * Injects a `QueryClient` instance and allows passing a custom injector.
 *
 * You can also use `inject(QueryClient)` if you don't need to provide a custom injector.
 *
 * **Example**
 * ```ts
 * const queryClient = injectQueryClient();
 * ```
 * @param injectOptions - Type of the options argument to inject and optionally a custom injector.
 * @returns The `QueryClient` instance.
 * @public
 */
export function injectQueryClient(
  injectOptions: InjectOptions & { injector?: Injector } = {},
) {
  return (injectOptions.injector ?? inject(Injector)).get(QueryClient)
}
