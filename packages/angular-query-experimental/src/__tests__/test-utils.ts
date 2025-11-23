import {
  isSignal,
  provideZonelessChangeDetection,
  untracked,
} from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { expect, vi } from 'vitest'
import { provideTanStackQuery } from '..'
import type { QueryClient } from '@tanstack/query-core'
import type {
  EnvironmentProviders,
  Provider,
  Signal,
  Type,
} from '@angular/core'

// Evaluate all signals on an object and return the result
function evaluateSignals<T extends Record<string, any>>(
  obj: T,
): { [K in keyof T]: ReturnType<T[K]> } {
  const result: Partial<{ [K in keyof T]: ReturnType<T[K]> }> = {}

  untracked(() => {
    for (const key in obj) {
      if (
        Object.prototype.hasOwnProperty.call(obj, key) &&
        // Only evaluate signals, not normal functions
        isSignal(obj[key])
      ) {
        const func = obj[key]
        result[key] = func()
      }
    }
  })

  return result as { [K in keyof T]: ReturnType<T[K]> }
}

export const expectSignals = <T extends Record<string, any>>(
  obj: T,
  expected: Partial<{
    [K in keyof T]: T[K] extends Signal<any> ? ReturnType<T[K]> : never
  }>,
): void => {
  expect(evaluateSignals(obj)).toMatchObject(expected)
}

/**
 * Reset Angular's TestBed and configure the standard TanStack Query providers for tests.
 * Pass additional providers (including EnvironmentProviders) via the options argument.
 */
export function setupTanStackQueryTestBed(
  queryClient: QueryClient,
  options: { providers?: Array<Provider | EnvironmentProviders> } = {},
) {
  TestBed.resetTestingModule()
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideTanStackQuery(queryClient),
      ...(options.providers ?? []),
    ],
  })
}

/**
 * TanStack Query schedules notifyManager updates with setTimeout(0); when fake timers
 * are enabled, advance them so PendingTasks sees the queued work.
 */
export async function flushQueryUpdates() {
  await vi.advanceTimersByTimeAsync(0)
}

const SIGNAL_BASED_INPUT_FLAG = 1

/**
 * Register a signal-based input on a test-only component/dir so Angular marks the
 * `input.required()` member as bound before the initial change detection run.
 *
 * After migrating to Angular 21 we can use the CLI to compile and run Vitest tests
 * and this helper should be obsolete.
 */
export function registerSignalInput<T>(
  type: Type<T>,
  inputName: keyof T & string,
) {
  const definition = (type as any).ɵcmp ?? (type as any).ɵdir
  if (!definition) {
    throw new Error(`Component ${type.name} is missing its definition`)
  }

  definition.inputs = {
    ...(definition.inputs ?? {}),
    [inputName]: [inputName, SIGNAL_BASED_INPUT_FLAG, null],
  }
  definition.declaredInputs = {
    ...(definition.declaredInputs ?? {}),
    [inputName]: inputName,
  }
}
