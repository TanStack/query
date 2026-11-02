import { vi } from 'vitest'

/**
 * Switches to fake timers until a test's `using` declaration disposes the result.
 * @returns A disposable that switches back to real timers.
 * @example
 * ```ts
 * it('waits', async () => {
 *   using _timers = fakeTimers()
 *   await vi.advanceTimersByTimeAsync(10)
 * })
 * ```
 */
export const fakeTimers = (): Disposable => {
  vi.useFakeTimers()
  return {
    [Symbol.dispose]: () => {
      vi.useRealTimers()
    },
  }
}
