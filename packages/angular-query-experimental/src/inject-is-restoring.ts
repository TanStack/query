import {
  InjectionToken,
  Injector,
  assertInInjectionContext,
  computed,
  inject,
} from '@angular/core'
import type { Provider, Signal } from '@angular/core'

const IsRestoring = new InjectionToken<Signal<boolean>>('IsRestoring')

/**
 * The `Injector` in which to create the isRestoring signal.
 *
 * If this is not provided, the current injection context will be used instead (via `inject`).
 */
interface InjectIsRestoringOptions {
  injector?: Injector
}

/**
 * Injects a signal that tracks whether a restore is currently in progress. {@link injectQuery} and friends also check this internally to avoid race conditions between the restore and mounting queries.
 * @param options - Options for injectIsRestoring.
 * @returns signal with boolean that indicates whether a restore is in progress.
 * @public
 */
export function injectIsRestoring(
  options?: InjectIsRestoringOptions,
): Signal<boolean> {
  !options?.injector && assertInInjectionContext(injectIsRestoring)
  const injector = options?.injector ?? inject(Injector)
  return injector.get(
    IsRestoring,
    computed(() => false),
    { optional: true },
  )
}

/**
 * Used by TanStack Query Angular persist client plugin to provide the signal that tracks the restore state
 * @param isRestoring - a readonly signal that returns a boolean
 * @returns Provider for the `isRestoring` signal
 * @public
 */
export function provideIsRestoring(isRestoring: Signal<boolean>): Provider {
  return {
    provide: IsRestoring,
    useValue: isRestoring,
  }
}
