import {
  InjectionToken,
  assertInInjectionContext,
  inject,
  signal,
} from '@angular/core'
import type { Provider, Signal } from '@angular/core'

/**
 * Internal token used to track isRestoring state, accessible in public API through `injectIsRestoring` and set via `provideIsRestoring`
 */
const IS_RESTORING = new InjectionToken('', {
  factory: () => signal(false).asReadonly(),
})

/**
 * Injects a signal that tracks whether a restore (e.g. from a persisted client, wired up via
 * `withPersistQueryClient`) is currently in progress. `injectQuery` and friends also check this internally
 * to avoid race conditions between the restore and initializing queries.
 * @returns A readonly `Signal<boolean>` — `true` while a restore is in progress, `false` otherwise (the
 * default when no persistence integration is registered).
 */
export function injectIsRestoring() {
  if (typeof ngDevMode === 'undefined' || ngDevMode) {
    assertInInjectionContext(injectIsRestoring)
  }
  return inject(IS_RESTORING)
}

/**
 * Supplies injector-scoped restoration state to the Angular Query integrations.
 * The factory runs once in Angular's injection context.
 * @internal
 * @param isRestoringFactory - Produces the restoration signal for this injector.
 * @returns The provider that makes the restoration state injectable.
 */
export function provideIsRestoring(
  isRestoringFactory: () => Signal<boolean>,
): Provider {
  return {
    provide: IS_RESTORING,
    useFactory: isRestoringFactory,
  }
}
