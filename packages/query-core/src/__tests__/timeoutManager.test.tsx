import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  TimeoutManager,
  defaultTimeoutProvider,
  systemSetTimeoutZero,
  timeoutManager,
} from '../timeoutManager'
import type { MockInstance } from 'vitest'

describe('timeoutManager', () => {
  function createMockProvider(name: string = 'custom') {
    return {
      __TEST_ONLY__name: name,
      setTimeout: vi.fn(() => 123),
      clearTimeout: vi.fn(),
      setInterval: vi.fn(() => 456),
      clearInterval: vi.fn(),
    }
  }

  let consoleErrorSpy: MockInstance<typeof console.error>

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('TimeoutManager', () => {
    let manager: TimeoutManager

    beforeEach(() => {
      manager = new TimeoutManager()
    })

    it('by default proxies calls to globalThis setTimeout/clearTimeout', () => {
      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')
      const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')
      const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')

      const callback = vi.fn()
      const timeoutId = manager.setTimeout(callback, 100)
      expect(setTimeoutSpy).toHaveBeenCalledWith(callback, 100)
      clearTimeout(Number(timeoutId))

      manager.clearTimeout(200)
      expect(clearTimeoutSpy).toHaveBeenCalledWith(200)

      const intervalId = manager.setInterval(callback, 300)
      expect(setIntervalSpy).toHaveBeenCalledWith(callback, 300)
      clearInterval(Number(intervalId))

      manager.clearInterval(400)
      expect(clearIntervalSpy).toHaveBeenCalledWith(400)
    })

    describe('timer behavior', () => {
      beforeEach(() => {
        vi.useFakeTimers()
      })

      afterEach(() => {
        vi.useRealTimers()
      })

      it('should invoke the callback after the given delay', async () => {
        const callback = vi.fn()
        manager.setTimeout(callback, 100)

        await vi.advanceTimersByTimeAsync(99)
        expect(callback).not.toHaveBeenCalled()

        await vi.advanceTimersByTimeAsync(1)
        expect(callback).toHaveBeenCalledTimes(1)
      })

      it('should not invoke the callback after clearTimeout', async () => {
        const callback = vi.fn()
        const timeoutId = manager.setTimeout(callback, 100)

        manager.clearTimeout(timeoutId)
        await vi.advanceTimersByTimeAsync(1000)

        expect(callback).not.toHaveBeenCalled()
      })

      it('should invoke interval callbacks repeatedly until clearInterval', async () => {
        const callback = vi.fn()
        const intervalId = manager.setInterval(callback, 100)

        await vi.advanceTimersByTimeAsync(350)
        expect(callback).toHaveBeenCalledTimes(3)

        manager.clearInterval(intervalId)
        await vi.advanceTimersByTimeAsync(300)

        expect(callback).toHaveBeenCalledTimes(3)
      })
    })

    describe('setTimeoutProvider', () => {
      it('proxies calls to the configured timeout provider', () => {
        const customProvider = createMockProvider()
        manager.setTimeoutProvider(customProvider)

        const callback = vi.fn()

        manager.setTimeout(callback, 100)
        expect(customProvider.setTimeout).toHaveBeenCalledWith(callback, 100)

        manager.clearTimeout(999)
        expect(customProvider.clearTimeout).toHaveBeenCalledWith(999)

        manager.setInterval(callback, 200)
        expect(customProvider.setInterval).toHaveBeenCalledWith(callback, 200)

        manager.clearInterval(888)
        expect(customProvider.clearInterval).toHaveBeenCalledWith(888)
      })

      it('warns when switching providers after making call', () => {
        // 1. switching before making any calls does not warn
        const customProvider = createMockProvider()
        manager.setTimeoutProvider(customProvider)
        expect(consoleErrorSpy).not.toHaveBeenCalled()

        // Make a call. The next switch should warn
        manager.setTimeout(vi.fn(), 100)

        // 2. switching after making a call should warn
        const customProvider2 = createMockProvider('custom2')
        manager.setTimeoutProvider(customProvider2)
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringMatching(
            /\[timeoutManager\]: Switching .* might result in unexpected behavior\..*/,
          ),
          { previous: customProvider, provider: customProvider2 },
        )

        // 3. Switching again with no intermediate calls should not warn
        vi.mocked(consoleErrorSpy).mockClear()
        const customProvider3 = createMockProvider('custom3')
        manager.setTimeoutProvider(customProvider3)
        expect(consoleErrorSpy).not.toHaveBeenCalled()
      })

      it('warns when switching providers after an setInterval call', () => {
        const customProvider = createMockProvider('custom')
        manager.setTimeoutProvider(customProvider)
        manager.setInterval(vi.fn(), 100)

        const customProvider2 = createMockProvider('custom2')
        manager.setTimeoutProvider(customProvider2)

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringMatching(
            /\[timeoutManager\]: Switching .* might result in unexpected behavior\..*/,
          ),
          { previous: customProvider, provider: customProvider2 },
        )
      })

      it('does not warn when re-setting the same provider after calls', () => {
        const customProvider = createMockProvider()
        manager.setTimeoutProvider(customProvider)
        manager.setTimeout(vi.fn(), 100)

        manager.setTimeoutProvider(customProvider)

        expect(consoleErrorSpy).not.toHaveBeenCalled()
      })

      it('does not warn when only clear functions were called before switching', () => {
        const customProvider = createMockProvider('custom')
        manager.setTimeoutProvider(customProvider)
        manager.clearTimeout(1)
        manager.clearInterval(2)

        const customProvider2 = createMockProvider('custom2')
        manager.setTimeoutProvider(customProvider2)

        expect(consoleErrorSpy).not.toHaveBeenCalled()
      })

      it('does not warn when switching providers after calls in production', () => {
        try {
          vi.stubEnv('NODE_ENV', 'production')

          const customProvider = createMockProvider('custom')
          manager.setTimeoutProvider(customProvider)
          manager.setTimeout(vi.fn(), 100)

          const customProvider2 = createMockProvider('custom2')
          manager.setTimeoutProvider(customProvider2)

          expect(consoleErrorSpy).not.toHaveBeenCalled()
        } finally {
          vi.unstubAllEnvs()
        }
      })

      it('passes non-number timer ids through to the provider untouched', () => {
        const customProvider = createMockProvider()
        const objectTimerId = { [Symbol.toPrimitive]: () => 123 }
        customProvider.setTimeout.mockReturnValueOnce(objectTimerId)
        manager.setTimeoutProvider(customProvider)

        const timeoutId = manager.setTimeout(vi.fn(), 100)
        expect(timeoutId).toBe(objectTimerId)

        manager.clearTimeout(timeoutId)
        expect(customProvider.clearTimeout).toHaveBeenCalledWith(objectTimerId)
      })

      it('forwards undefined timer ids to the clear functions as a no-op', () => {
        const customProvider = createMockProvider()
        manager.setTimeoutProvider(customProvider)

        expect(() => manager.clearTimeout(undefined)).not.toThrow()
        expect(customProvider.clearTimeout).toHaveBeenCalledWith(undefined)

        expect(() => manager.clearInterval(undefined)).not.toThrow()
        expect(customProvider.clearInterval).toHaveBeenCalledWith(undefined)
      })

      it('returns the timer ids produced by the provider', () => {
        const customProvider = createMockProvider()
        manager.setTimeoutProvider(customProvider)

        expect(manager.setTimeout(vi.fn(), 100)).toBe(123)
        expect(manager.setInterval(vi.fn(), 100)).toBe(456)
      })
    })
  })

  describe('globalThis timeoutManager instance', () => {
    it('should be an instance of TimeoutManager', () => {
      expect(timeoutManager).toBeInstanceOf(TimeoutManager)
    })
  })

  describe('exported functions', () => {
    let provider: ReturnType<typeof createMockProvider>
    beforeEach(() => {
      provider = createMockProvider()
      timeoutManager.setTimeoutProvider(provider)
    })
    afterEach(() => {
      timeoutManager.setTimeoutProvider(defaultTimeoutProvider)
    })

    describe('systemSetTimeoutZero', () => {
      it('should use globalThis setTimeout with 0 delay', () => {
        const spy = vi.spyOn(globalThis, 'setTimeout')

        const callback = vi.fn()
        systemSetTimeoutZero(callback)

        expect(spy).toHaveBeenCalledWith(callback, 0)
        clearTimeout(spy.mock.results[0]?.value)
      })

      it('should not be mediated by the timeoutManager provider', () => {
        const spy = vi.spyOn(globalThis, 'setTimeout')

        const callback = vi.fn()
        systemSetTimeoutZero(callback)

        expect(spy).toHaveBeenCalledTimes(1)
        expect(provider.setTimeout).not.toHaveBeenCalled()
        clearTimeout(spy.mock.results[0]?.value)
      })

      it('should invoke the callback on the next event loop tick', async () => {
        vi.useFakeTimers()
        try {
          const callback = vi.fn()
          systemSetTimeoutZero(callback)
          expect(callback).not.toHaveBeenCalled()

          await vi.advanceTimersByTimeAsync(0)
          expect(callback).toHaveBeenCalledTimes(1)
        } finally {
          vi.useRealTimers()
        }
      })
    })
  })
})
