import { InjectionToken, computed, inject } from '@angular/core'
import { assertInjector } from './util/assert-injector/assert-injector'
import type { Injector, Provider, Signal } from '@angular/core'

const IsRestoring = new InjectionToken<Signal<boolean>>('IsRestoring')

/**
 * Injects a signal that tracks whether a restore is currently in progress. {@link injectQuery} and friends also check this internally to avoid race conditions between the restore and mounting queries.
 * @param injector - The Angular injector to use.
 * @returns signal with boolean that indicates whether a restore is in progress.
 * @public
 */
export function injectIsRestoring(injector?: Injector): Signal<boolean> {
  return assertInjector(
    injectIsRestoring,
    injector,
    () => inject(IsRestoring, { optional: true }) ?? computed(() => false),
  )
}

/**
 * Used by angular query persist client plugin to provide the signal that tracks the restore state
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
