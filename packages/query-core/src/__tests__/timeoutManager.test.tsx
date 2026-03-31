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
          expect.anything(),
        )

        // 3. Switching again with no intermediate calls should not warn
        vi.mocked(consoleErrorSpy).mockClear()
        const customProvider3 = createMockProvider('custom3')
        manager.setTimeoutProvider(customProvider3)
        expect(consoleErrorSpy).not.toHaveBeenCalled()
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
    })
  })
})
