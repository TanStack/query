import {
  InjectionToken,
  Injector,
  assertInInjectionContext,
  inject,
  signal,
} from '@angular/core'
import type { Provider, Signal } from '@angular/core'

/**
 * Internal token used to track isRestoring state, accessible in public API through `injectIsRestoring` and set via `provideIsRestoring`
 */
const IS_RESTORING = new InjectionToken('', {
  // Default value when not provided
  factory: () => signal(false).asReadonly(),
})

interface InjectIsRestoringOptions {
  /**
   * The `Injector` to use to get the isRestoring signal.
   *
   * If this is not provided, the current injection context will be used instead (via `inject`).
   */
  injector?: Injector
}

/**
 * Injects a signal that tracks whether a restore (e.g. from a persisted client, wired up via
 * `provideIsRestoring`) is currently in progress. `injectQuery` and friends also check this internally to
 * avoid race conditions between the restore and initializing queries.
 * @param options - Additional configuration
 * @returns A readonly `Signal<boolean>` — `true` while a restore is in progress, `false` otherwise (the
 * default when no `provideIsRestoring` provider is registered).
 */
export function injectIsRestoring(options?: InjectIsRestoringOptions) {
  !options?.injector && assertInInjectionContext(injectIsRestoring)
  const injector = options?.injector ?? inject(Injector)
  return injector.get(IS_RESTORING)
}

/**
 * Registers a provider for the restore state read by `injectIsRestoring`. Wire this up wherever you drive a
 * restore yourself — e.g. a persist-client integration — so `injectQuery` and friends can defer subscribing
 * to their observer (avoiding a race with the restore) until the restore signal flips back to `false`.
 * @param isRestoring - A readonly `Signal<boolean>` that tracks the restore state.
 * @returns A provider for the `isRestoring` signal.
 */
export function provideIsRestoring(isRestoring: Signal<boolean>): Provider {
  return {
    provide: IS_RESTORING,
    useValue: isRestoring,
  }
}
