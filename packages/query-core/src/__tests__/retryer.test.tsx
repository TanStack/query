import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { createRetryer } from '../retryer'
import { onlineManager } from '../onlineManager'

describe('retryer (windowless env)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(onlineManager, 'isOnline').mockReturnValue(true)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  test('defaults retry to 3 when window is undefined', async () => {
    const originalWindow = (globalThis as any).window
    // simulate windowless client runtime (vscode/chrome extension contexts)
    ;(globalThis as any).window = undefined

    try {
      let attempts = 0

      const retryer = createRetryer({
        fn: () => {
          attempts++
          if (attempts <= 3) throw new Error('nope')
          return 'ok'
        },
        networkMode: 'online',
        canRun: () => true,
      })

      retryer.start()

      // defaultRetryDelay: min(1000 * 2^failureCount, 30000)
      // retry 1: delay = 1000 * 2^1 = 2000
      await vi.advanceTimersByTimeAsync(2000)
      // retry 2: delay = 1000 * 2^2 = 4000
      await vi.advanceTimersByTimeAsync(4000)
      // retry 3: delay = 1000 * 2^3 = 8000
      await vi.advanceTimersByTimeAsync(8000)

      await vi.advanceTimersByTimeAsync(0) // flush microtasks

      expect(attempts).toBe(4) // 1 initial + 3 retries
    } finally {
      ;(globalThis as any).window = originalWindow
    }
  })
})
