import {
  InjectionToken,
  Injector,
  assertInInjectionContext,
  inject,
  signal,
} from '@angular/core'
import type { Provider, Signal } from '@angular/core'

const IS_RESTORING = new InjectionToken(
  typeof ngDevMode === 'undefined' || ngDevMode
    ? 'TANSTACK_QUERY_IS_RESTORING'
    : '',
  {
    // Default value when not provided
    factory: () => signal(false).asReadonly(),
  },
)

/**
 * The `Injector` in which to create the isRestoring signal.
 *
 * If this is not provided, the current injection context will be used instead (via `inject`).
 */
interface InjectIsRestoringOptions {
  injector?: Injector
}

/**
 * Injects a signal that tracks whether a restore is currently in progress. {@link injectQuery} and friends also check this internally to avoid race conditions between the restore and initializing queries.
 * @param options - Options for injectIsRestoring.
 * @returns signal with boolean that indicates whether a restore is in progress.
 * @public
 */
export function injectIsRestoring(options?: InjectIsRestoringOptions) {
  !options?.injector && assertInInjectionContext(injectIsRestoring)
  const injector = options?.injector ?? inject(Injector)
  return injector.get(IS_RESTORING)
}

/**
 * Used by TanStack Query Angular persist client plugin to provide the signal that tracks the restore state
 * @param isRestoring - a readonly signal that returns a boolean
 * @returns Provider for the `isRestoring` signal
 * @public
 */
export function provideIsRestoring(isRestoring: Signal<boolean>): Provider {
  return {
    provide: IS_RESTORING,
    useValue: isRestoring,
  }
}
