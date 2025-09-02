import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  TimeoutManager,
  defaultTimeoutProvider,
  managedClearInterval,
  managedClearTimeout,
  managedSetInterval,
  managedSetTimeout,
  systemSetTimeoutZero,
  timeoutManager,
} from '../timeoutManager'

describe('timeoutManager', () => {
  function createMockProvider(name: string = 'custom') {
    return {
      name,
      setTimeout: vi.fn(() => 123),
      clearTimeout: vi.fn(),
      setInterval: vi.fn(() => 456),
      clearInterval: vi.fn(),
    }
  }

  beforeEach(() => {
    vi.spyOn(console, 'warn')
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
      clearTimeout(timeoutId)

      manager.clearTimeout(200)
      expect(clearTimeoutSpy).toHaveBeenCalledWith(200)

      const intervalId = manager.setInterval(callback, 300)
      expect(setIntervalSpy).toHaveBeenCalledWith(callback, 300)
      clearInterval(intervalId)

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
        expect(console.warn).not.toHaveBeenCalled()

        // Make a call. The next switch should warn
        manager.setTimeout(vi.fn(), 100)

        // 2. switching after making a call should warn
        const customProvider2 = createMockProvider('custom2')
        manager.setTimeoutProvider(customProvider2)
        expect(console.warn).toHaveBeenCalledWith(
          '[timeoutManager]: Switching to custom2 provider after calls to custom provider might result in unexpected behavior.',
        )

        // 3. Switching again with no intermediate calls should not warn
        vi.mocked(console.warn).mockClear()
        const customProvider3 = createMockProvider('custom3')
        manager.setTimeoutProvider(customProvider3)
        expect(console.warn).not.toHaveBeenCalled()
      })
    })

    it('throws if provider returns non-convertible value from setTimeout/setInterval', () => {
      const invalidValue = { invalid: true } as any
      const customProvider = createMockProvider('badProvider')
      customProvider.setTimeout = vi.fn(() => invalidValue)
      customProvider.setInterval = vi.fn(() => invalidValue)
      manager.setTimeoutProvider(customProvider)

      const callback = vi.fn()

      expect(() => manager.setTimeout(callback, 100)).toThrow(
        'TimeoutManager: could not convert badProvider provider timeout ID to valid number',
      )

      expect(() => manager.setInterval(callback, 100)).toThrow(
        'TimeoutManager: could not convert badProvider provider timeout ID to valid number',
      )
    })
  })

  describe('globalThis timeoutManager instance', () => {
    it('should be an instance of TimeoutManager', () => {
      expect(timeoutManager).toBeInstanceOf(TimeoutManager)
    })
  })

  describe('exported functions', () => {
    let provider: ReturnType<typeof createMockProvider>
    let callNumber = 0
    beforeEach(() => {
      callNumber = 0
      provider = createMockProvider()
      timeoutManager.setTimeoutProvider(provider)
    })
    afterEach(() => {
      timeoutManager.setTimeoutProvider(defaultTimeoutProvider)
    })

    const callbackArgs = () => [vi.fn(), 100 * ++callNumber] as const

    describe('managedSetTimeout', () => {
      it('should call timeoutManager.setTimeout', () => {
        const spy = vi.spyOn(timeoutManager, 'setTimeout')
        const args = callbackArgs()

        const result = managedSetTimeout(...args)

        expect(spy).toHaveBeenCalledWith(...args)
        expect(result).toBe(123)
      })
    })

    describe('managedClearTimeout', () => {
      it('should call timeoutManager.clearTimeout', () => {
        const spy = vi.spyOn(timeoutManager, 'clearTimeout')
        const timeoutId = 123

        managedClearTimeout(timeoutId)

        expect(spy).toHaveBeenCalledWith(timeoutId)

        spy.mockRestore()
      })
    })

    describe('managedSetInterval', () => {
      it('should call timeoutManager.setInterval', () => {
        const spy = vi.spyOn(timeoutManager, 'setInterval')
        const args = callbackArgs()

        const result = managedSetInterval(...args)

        expect(spy).toHaveBeenCalledWith(...args)
        expect(result).toBe(456)
      })
    })

    describe('managedClearInterval', () => {
      it('should call timeoutManager.clearInterval', () => {
        const spy = vi.spyOn(timeoutManager, 'clearInterval')
        const intervalId = 456

        managedClearInterval(intervalId)

        expect(spy).toHaveBeenCalledWith(intervalId)
      })
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
