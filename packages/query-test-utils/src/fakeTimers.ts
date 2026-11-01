import { vi } from 'vitest'

/**
 * Switches to fake timers until the returned object is disposed, for a test to hold with `using`.
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
