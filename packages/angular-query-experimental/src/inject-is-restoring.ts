import { createNoopInjectionToken } from './util/create-injection-token/create-injection-token'
import type { Signal } from '@angular/core'

const tokens = createNoopInjectionToken<Signal<boolean>>('IsRestoringToken')

/**
 * Injects a signal that tracks whether a restore is currently in progress. {@link injectQuery} and friends also check this internally to avoid race conditions between the restore and mounting queries.
 * @param injector - The Angular injector to use.
 * @returns signal with boolean that indicates whether a restore is in progress.
 * @public
 */
export const injectIsRestoring = tokens[0]

/**
 * Used by angular query persist client plugin to provide the signal that tracks the restore state
 * @param isRestoring - a readonly signal that returns a boolean
 * @public
 */
export const provideIsRestoring = tokens[1]
