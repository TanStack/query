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
 * Injects a readonly signal that is true while the persistence integration restores
 * cached query data. Returns false when no restoration is in progress.
 * @returns The current restoration state.
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
 */
export function provideIsRestoring(
  isRestoringFactory: () => Signal<boolean>,
): Provider {
  return {
    provide: IS_RESTORING,
    useFactory: isRestoringFactory,
  }
}
