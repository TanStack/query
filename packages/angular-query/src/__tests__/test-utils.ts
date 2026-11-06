// cspell:ignore ZONEFUL zoneful
import {
  isSignal,
  provideZoneChangeDetection,
  provideZonelessChangeDetection,
  untracked,
} from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { expect, vi } from 'vitest'
import { provideTanStackQuery } from '..'
import type { QueryClient } from '@tanstack/query-core'
import type { EnvironmentProviders, Provider, Signal } from '@angular/core'

/**
 * Use the same change-detection mode as the test runner. The default runner
 * is zoneless; the zoneful runner sets ANGULAR_QUERY_ZONEFUL before loading
 * tests and installs the real Zone.js testing patches.
 */
export function provideAngularQueryChangeDetection(): EnvironmentProviders {
  return process.env.ANGULAR_QUERY_ZONEFUL === 'true'
    ? provideZoneChangeDetection()
    : provideZonelessChangeDetection()
}

function evaluateSignals<T extends Record<string, any>>(
  obj: T,
): { [K in keyof T]: ReturnType<T[K]> } {
  const result: Partial<{ [K in keyof T]: ReturnType<T[K]> }> = {}

  untracked(() => {
    for (const key in obj) {
      if (
        Object.prototype.hasOwnProperty.call(obj, key) &&
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
      provideAngularQueryChangeDetection(),
      provideTanStackQuery(() => queryClient),
      ...(options.providers ?? []),
    ],
  })
}

/**
 * Advances zero-delay timers and their promise continuations in fake-timer tests.
 * Angular rendering may require a subsequent change-detection pass.
 */
export async function flushQueryUpdates() {
  await vi.advanceTimersByTimeAsync(0)
}
