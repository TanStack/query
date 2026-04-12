import { isSignal, provideZonelessChangeDetection, untracked } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { expect, vi } from 'vitest'
import { provideTanStackQuery } from '..'
import type { QueryClient } from '@tanstack/query-core'
import type { EnvironmentProviders, Provider, Signal } from '@angular/core'

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
