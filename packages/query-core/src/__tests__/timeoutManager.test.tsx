import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  TimeoutManager,
  TimeoutProvider,
  defaultTimeoutProvider,
  timeoutManager,
  managedSetTimeout,
  managedClearTimeout,
  managedSetInterval,
  managedClearInterval,
  systemSetTimeoutZero,
  type TimeoutProviderId,
  type TimeoutCallback,
  type ManagedTimerId,
} from '../timeoutManager'

describe('timeoutManager', () => {
  let originalConsoleWarn: typeof console.warn

  beforeEach(() => {
    originalConsoleWarn = console.warn
    console.warn = vi.fn()
  })

  afterEach(() => {
    console.warn = originalConsoleWarn
    vi.restoreAllMocks()
  })

  describe('types', () => {
    it('should have correct type definitions', () => {
      const callback: TimeoutCallback = () => {}
      const timeoutId: TimeoutProviderId = 123
      const nodeTimeoutId = { [Symbol.toPrimitive]: () => 456 }
      const managedId: ManagedTimerId = 789

      expect(typeof callback).toBe('function')
      expect(typeof timeoutId).toBe('number')
      expect(typeof nodeTimeoutId[Symbol.toPrimitive]()).toBe('number')
      expect(typeof managedId).toBe('number')
    })
  })

  describe('defaultTimeoutProvider', () => {
    it('should have correct name', () => {
      expect(defaultTimeoutProvider.name).toBe('default')
    })

    it('should use global setTimeout', () => {
      const callback = vi.fn()
      const delay = 100
      
      const timeoutId = defaultTimeoutProvider.setTimeout(callback, delay)
      
      // In Node.js, setTimeout can return a Timeout object or number
      expect(timeoutId).toBeDefined()
      expect(Number(timeoutId)).toBeGreaterThan(0)
      
      defaultTimeoutProvider.clearTimeout(Number(timeoutId))
    })

    it('should use global setInterval', () => {
      const callback = vi.fn()
      const delay = 100
      
      const intervalId = defaultTimeoutProvider.setInterval(callback, delay)
      
      // In Node.js, setInterval can return an Interval object or number
      expect(intervalId).toBeDefined()
      expect(Number(intervalId)).toBeGreaterThan(0)
      
      defaultTimeoutProvider.clearInterval(Number(intervalId))
    })

    it('should handle clearTimeout with undefined', () => {
      expect(() => defaultTimeoutProvider.clearTimeout(undefined)).not.toThrow()
    })

    it('should handle clearInterval with undefined', () => {
      expect(() => defaultTimeoutProvider.clearInterval(undefined)).not.toThrow()
    })
  })

  describe('TimeoutManager', () => {
    let manager: TimeoutManager

    beforeEach(() => {
      manager = new TimeoutManager()
    })

    describe('constructor and properties', () => {
      it('should start with default provider', () => {
        const callback = vi.fn()
        manager.setTimeout(callback, 0)
        expect(console.warn).not.toHaveBeenCalled()
      })
    })

    describe('setTimeoutProvider', () => {
      it('should set a new timeout provider', () => {
        const customProvider: TimeoutProvider = {
          name: 'custom',
          setTimeout: vi.fn(() => 123),
          clearTimeout: vi.fn(),
          setInterval: vi.fn(() => 456),
          clearInterval: vi.fn(),
        }

        manager.setTimeoutProvider(customProvider)
        
        const callback = vi.fn()
        manager.setTimeout(callback, 100)
        
        expect(customProvider.setTimeout).toHaveBeenCalledWith(callback, 100)
      })

      it('should warn when switching providers after provider calls', () => {
        const callback = vi.fn()
        
        // Make a setTimeout call with default provider
        manager.setTimeout(callback, 0)
        
        const customProvider: TimeoutProvider = {
          name: 'custom',
          setTimeout: vi.fn(() => 123),
          clearTimeout: vi.fn(),
          setInterval: vi.fn(() => 456),
          clearInterval: vi.fn(),
        }
        
        // Switch to custom provider
        manager.setTimeoutProvider(customProvider)
        
        expect(console.warn).toHaveBeenCalledWith(
          '[timeoutManager]: Switching to custom provider after calls to default provider might result in unexpected behavior.'
        )
      })

      it('should not warn when switching to the same provider', () => {
        const callback = vi.fn()
        
        // Make a setTimeout call
        manager.setTimeout(callback, 0)
        
        // Set the same provider again
        manager.setTimeoutProvider(defaultTimeoutProvider)
        
        expect(console.warn).not.toHaveBeenCalled()
      })

      it('should not warn on first provider switch before provider calls', () => {
        const customProvider: TimeoutProvider = {
          name: 'custom',
          setTimeout: vi.fn(() => 123),
          clearTimeout: vi.fn(),
          setInterval: vi.fn(() => 456),
          clearInterval: vi.fn(),
        }
        
        manager.setTimeoutProvider(customProvider)
        
        expect(console.warn).not.toHaveBeenCalled()
      })

      it('should return early when setting the same provider', () => {
        const customProvider: TimeoutProvider = {
          name: 'custom',
          setTimeout: vi.fn(() => 123),
          clearTimeout: vi.fn(),
          setInterval: vi.fn(() => 456),
          clearInterval: vi.fn(),
        }
        
        manager.setTimeoutProvider(customProvider)
        manager.setTimeoutProvider(customProvider) // Set same provider again
        
        expect(console.warn).not.toHaveBeenCalled()
      })

      it('should reset providerCalled flag when switching providers', () => {
        const callback = vi.fn()
        
        // Make a setTimeout call
        manager.setTimeout(callback, 0)
        
        const customProvider: TimeoutProvider = {
          name: 'custom',
          setTimeout: vi.fn(() => 123),
          clearTimeout: vi.fn(),
          setInterval: vi.fn(() => 456),
          clearInterval: vi.fn(),
        }
        
        // Switch providers (will warn)
        manager.setTimeoutProvider(customProvider)
        expect(console.warn).toHaveBeenCalledTimes(1)
        
        const anotherProvider: TimeoutProvider = {
          name: 'another',
          setTimeout: vi.fn(() => 789),
          clearTimeout: vi.fn(),
          setInterval: vi.fn(() => 101),
          clearInterval: vi.fn(),
        }
        
        // Switch again without making any calls - should not warn since flag was reset
        manager.setTimeoutProvider(anotherProvider)
        expect(console.warn).toHaveBeenCalledTimes(1)
      })
    })

    describe('setTimeout', () => {
      it('should call provider setTimeout and return number', () => {
        const callback = vi.fn()
        const delay = 100
        
        const timeoutId = manager.setTimeout(callback, delay)
        
        expect(typeof timeoutId).toBe('number')
        expect(timeoutId).toBeGreaterThan(0)
      })

      it('should set providerCalled flag on setTimeout', () => {
        const callback = vi.fn()
        
        manager.setTimeout(callback, 0)
        
        const customProvider: TimeoutProvider = {
          name: 'custom',
          setTimeout: vi.fn(() => 123),
          clearTimeout: vi.fn(),
          setInterval: vi.fn(() => 456),
          clearInterval: vi.fn(),
        }
        
        manager.setTimeoutProvider(customProvider)
        
        expect(console.warn).toHaveBeenCalledWith(
          '[timeoutManager]: Switching to custom provider after calls to default provider might result in unexpected behavior.'
        )
      })

      it('should set providerCalled flag on setInterval', () => {
        const callback = vi.fn()
        
        manager.setInterval(callback, 100)
        
        const customProvider: TimeoutProvider = {
          name: 'custom',
          setTimeout: vi.fn(() => 123),
          clearTimeout: vi.fn(),
          setInterval: vi.fn(() => 456),
          clearInterval: vi.fn(),
        }
        
        manager.setTimeoutProvider(customProvider)
        
        expect(console.warn).toHaveBeenCalledWith(
          '[timeoutManager]: Switching to custom provider after calls to default provider might result in unexpected behavior.'
        )
      })

      it('should handle provider returning object with Symbol.toPrimitive', () => {
        const nodeTimeoutLike = {
          [Symbol.toPrimitive]: () => 42
        }
        
        const customProvider: TimeoutProvider = {
          name: 'custom',
          setTimeout: vi.fn(() => nodeTimeoutLike),
          clearTimeout: vi.fn(),
          setInterval: vi.fn(() => 456),
          clearInterval: vi.fn(),
        }
        
        manager.setTimeoutProvider(customProvider)
        
        const callback = vi.fn()
        const timeoutId = manager.setTimeout(callback, 100)
        
        expect(timeoutId).toBe(42)
      })

      it('should throw error when provider returns non-convertible value', () => {
        const invalidValue = { invalid: true } as any
        
        const customProvider: TimeoutProvider = {
          name: 'badProvider',
          setTimeout: vi.fn(() => invalidValue),
          clearTimeout: vi.fn(),
          setInterval: vi.fn(() => 456),
          clearInterval: vi.fn(),
        }
        
        manager.setTimeoutProvider(customProvider)
        
        const callback = vi.fn()
        
        expect(() => manager.setTimeout(callback, 100)).toThrow(
          'TimeoutManager: could not convert badProvider provider timeout ID to valid number'
        )
      })
    })

    describe('clearTimeout', () => {
      it('should call provider clearTimeout', () => {
        const customProvider: TimeoutProvider = {
          name: 'custom',
          setTimeout: vi.fn(() => 123),
          clearTimeout: vi.fn(),
          setInterval: vi.fn(() => 456),
          clearInterval: vi.fn(),
        }
        
        manager.setTimeoutProvider(customProvider)
        
        const timeoutId = 42
        manager.clearTimeout(timeoutId)
        
        expect(customProvider.clearTimeout).toHaveBeenCalledWith(timeoutId)
      })

      it('should handle undefined timeoutId', () => {
        const customProvider: TimeoutProvider = {
          name: 'custom',
          setTimeout: vi.fn(() => 123),
          clearTimeout: vi.fn(),
          setInterval: vi.fn(() => 456),
          clearInterval: vi.fn(),
        }
        
        manager.setTimeoutProvider(customProvider)
        
        expect(() => manager.clearTimeout(undefined)).not.toThrow()
        expect(customProvider.clearTimeout).toHaveBeenCalledWith(undefined)
      })
    })

    describe('setInterval', () => {
      it('should call provider setInterval and return number', () => {
        const callback = vi.fn()
        const delay = 100
        
        const intervalId = manager.setInterval(callback, delay)
        
        expect(typeof intervalId).toBe('number')
        expect(intervalId).toBeGreaterThan(0)
      })

      it('should handle provider returning object with Symbol.toPrimitive', () => {
        const nodeIntervalLike = {
          [Symbol.toPrimitive]: () => 99
        }
        
        const customProvider: TimeoutProvider = {
          name: 'custom',
          setTimeout: vi.fn(() => 123),
          clearTimeout: vi.fn(),
          setInterval: vi.fn(() => nodeIntervalLike),
          clearInterval: vi.fn(),
        }
        
        manager.setTimeoutProvider(customProvider)
        
        const callback = vi.fn()
        const intervalId = manager.setInterval(callback, 100)
        
        expect(intervalId).toBe(99)
      })

      it('should throw error when provider returns non-convertible value', () => {
        const invalidValue = { invalid: true } as any
        
        const customProvider: TimeoutProvider = {
          name: 'badProvider',
          setTimeout: vi.fn(() => 123),
          clearTimeout: vi.fn(),
          setInterval: vi.fn(() => invalidValue),
          clearInterval: vi.fn(),
        }
        
        manager.setTimeoutProvider(customProvider)
        
        const callback = vi.fn()
        
        expect(() => manager.setInterval(callback, 100)).toThrow(
          'TimeoutManager: could not convert badProvider provider timeout ID to valid number'
        )
      })
    })

    describe('clearInterval', () => {
      it('should call provider clearInterval', () => {
        const customProvider: TimeoutProvider = {
          name: 'custom',
          setTimeout: vi.fn(() => 123),
          clearTimeout: vi.fn(),
          setInterval: vi.fn(() => 456),
          clearInterval: vi.fn(),
        }
        
        manager.setTimeoutProvider(customProvider)
        
        const intervalId = 88
        manager.clearInterval(intervalId)
        
        expect(customProvider.clearInterval).toHaveBeenCalledWith(intervalId)
      })

      it('should handle undefined intervalId', () => {
        const customProvider: TimeoutProvider = {
          name: 'custom',
          setTimeout: vi.fn(() => 123),
          clearTimeout: vi.fn(),
          setInterval: vi.fn(() => 456),
          clearInterval: vi.fn(),
        }
        
        manager.setTimeoutProvider(customProvider)
        
        expect(() => manager.clearInterval(undefined)).not.toThrow()
        expect(customProvider.clearInterval).toHaveBeenCalledWith(undefined)
      })
    })
  })

  describe('global timeoutManager instance', () => {
    it('should be an instance of TimeoutManager', () => {
      expect(timeoutManager).toBeInstanceOf(TimeoutManager)
    })
  })

  describe('managed utility functions', () => {
    describe('managedSetTimeout', () => {
      it('should call timeoutManager.setTimeout', () => {
        const spy = vi.spyOn(timeoutManager, 'setTimeout')
        const callback = vi.fn()
        const delay = 50
        
        managedSetTimeout(callback, delay)
        
        expect(spy).toHaveBeenCalledWith(callback, delay)
        
        spy.mockRestore()
      })

      it('should return timeout ID', () => {
        const callback = vi.fn()
        const timeoutId = managedSetTimeout(callback, 0)
        
        expect(typeof timeoutId).toBe('number')
        expect(timeoutId).toBeGreaterThan(0)
        
        managedClearTimeout(timeoutId)
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

      it('should handle undefined timeoutId', () => {
        const spy = vi.spyOn(timeoutManager, 'clearTimeout')
        
        expect(() => managedClearTimeout(undefined)).not.toThrow()
        expect(spy).toHaveBeenCalledWith(undefined)
        
        spy.mockRestore()
      })
    })

    describe('managedSetInterval', () => {
      it('should call timeoutManager.setInterval', () => {
        const spy = vi.spyOn(timeoutManager, 'setInterval')
        const callback = vi.fn()
        const delay = 50
        
        managedSetInterval(callback, delay)
        
        expect(spy).toHaveBeenCalledWith(callback, delay)
        
        spy.mockRestore()
      })

      it('should return interval ID', () => {
        const callback = vi.fn()
        const intervalId = managedSetInterval(callback, 100)
        
        expect(typeof intervalId).toBe('number')
        expect(intervalId).toBeGreaterThan(0)
        
        managedClearInterval(intervalId)
      })
    })

    describe('managedClearInterval', () => {
      it('should call timeoutManager.clearInterval', () => {
        const spy = vi.spyOn(timeoutManager, 'clearInterval')
        const intervalId = 456
        
        managedClearInterval(intervalId)
        
        expect(spy).toHaveBeenCalledWith(intervalId)
        
        spy.mockRestore()
      })

      it('should handle undefined intervalId', () => {
        const spy = vi.spyOn(timeoutManager, 'clearInterval')
        
        expect(() => managedClearInterval(undefined)).not.toThrow()
        expect(spy).toHaveBeenCalledWith(undefined)
        
        spy.mockRestore()
      })
    })
  })

  describe('systemSetTimeoutZero', () => {
    it('should use global setTimeout with 0 delay', () => {
      const originalSetTimeout = global.setTimeout
      const setTimeoutSpy = vi.fn()
      global.setTimeout = setTimeoutSpy
      
      const callback = vi.fn()
      systemSetTimeoutZero(callback)
      
      expect(setTimeoutSpy).toHaveBeenCalledWith(callback, 0)
      
      global.setTimeout = originalSetTimeout
    })

    it('should call callback on next tick', async () => {
      let called = false
      const callback = () => {
        called = true
      }
      
      systemSetTimeoutZero(callback)
      expect(called).toBe(false)
      
      // Wait for next tick
      await new Promise(resolve => setTimeout(resolve, 1))
      expect(called).toBe(true)
    })
  })

  describe('providerIdToNumber function (via public API)', () => {
    it('should handle regular numbers', () => {
      const manager = new TimeoutManager()
      const callback = vi.fn()
      
      const customProvider: TimeoutProvider = {
        name: 'test',
        setTimeout: vi.fn(() => 42),
        clearTimeout: vi.fn(),
        setInterval: vi.fn(() => 99),
        clearInterval: vi.fn(),
      }
      
      manager.setTimeoutProvider(customProvider)
      
      expect(manager.setTimeout(callback, 0)).toBe(42)
      expect(manager.setInterval(callback, 0)).toBe(99)
    })

    it('should handle objects with Symbol.toPrimitive', () => {
      const manager = new TimeoutManager()
      const callback = vi.fn()
      
      const timeoutObj = { [Symbol.toPrimitive]: () => 100 }
      const intervalObj = { [Symbol.toPrimitive]: () => 200 }
      
      const customProvider: TimeoutProvider = {
        name: 'test',
        setTimeout: vi.fn(() => timeoutObj),
        clearTimeout: vi.fn(),
        setInterval: vi.fn(() => intervalObj),
        clearInterval: vi.fn(),
      }
      
      manager.setTimeoutProvider(customProvider)
      
      expect(manager.setTimeout(callback, 0)).toBe(100)
      expect(manager.setInterval(callback, 0)).toBe(200)
    })

    it('should throw error for non-convertible values', () => {
      const manager = new TimeoutManager()
      const callback = vi.fn()
      
      const customProvider: TimeoutProvider = {
        name: 'errorProvider',
        setTimeout: vi.fn(() => ({ invalid: true } as any)),
        clearTimeout: vi.fn(),
        setInterval: vi.fn(() => ({ invalid: true } as any)),
        clearInterval: vi.fn(),
      }
      
      manager.setTimeoutProvider(customProvider)
      
      expect(() => manager.setTimeout(callback, 0)).toThrow(
        'TimeoutManager: could not convert errorProvider provider timeout ID to valid number'
      )
      
      expect(() => manager.setInterval(callback, 0)).toThrow(
        'TimeoutManager: could not convert errorProvider provider timeout ID to valid number'
      )
    })
  })

  describe('integration tests', () => {
    it('should work with real timeouts', async () => {
      let executed = false
      const callback = () => {
        executed = true
      }
      
      const timeoutId = managedSetTimeout(callback, 10)
      expect(typeof timeoutId).toBe('number')
      expect(executed).toBe(false)
      
      await new Promise(resolve => setTimeout(resolve, 15))
      expect(executed).toBe(true)
    })

    it('should work with clearing timeouts', async () => {
      let executed = false
      const callback = () => {
        executed = true
      }
      
      const timeoutId = managedSetTimeout(callback, 10)
      managedClearTimeout(timeoutId)
      
      await new Promise(resolve => setTimeout(resolve, 20))
      expect(executed).toBe(false)
    })

    it('should work with real intervals', async () => {
      let count = 0
      const callback = () => {
        count++
      }
      
      const intervalId = managedSetInterval(callback, 10)
      expect(typeof intervalId).toBe('number')
      
      await new Promise(resolve => setTimeout(resolve, 25))
      managedClearInterval(intervalId)
      
      expect(count).toBeGreaterThanOrEqual(2)
    })

    it('should handle custom provider workflow', () => {
      const customTimeouts = new Map<number, { callback: () => void; delay: number }>()
      let nextId = 1
      
      const customProvider: TimeoutProvider = {
        name: 'customTest',
        setTimeout: (callback, delay) => {
          const id = nextId++
          customTimeouts.set(id, { callback, delay })
          return id
        },
        clearTimeout: (id) => {
          if (id !== undefined) {
            customTimeouts.delete(id)
          }
        },
        setInterval: (callback, delay) => {
          const id = nextId++
          customTimeouts.set(id, { callback, delay })
          return id
        },
        clearInterval: (id) => {
          if (id !== undefined) {
            customTimeouts.delete(id)
          }
        },
      }
      
      const manager = new TimeoutManager()
      manager.setTimeoutProvider(customProvider)
      
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      
      const timeout1 = manager.setTimeout(callback1, 100)
      const timeout2 = manager.setTimeout(callback2, 200)
      
      expect(customTimeouts.size).toBe(2)
      expect(customTimeouts.get(timeout1)?.delay).toBe(100)
      expect(customTimeouts.get(timeout2)?.delay).toBe(200)
      
      manager.clearTimeout(timeout1)
      expect(customTimeouts.size).toBe(1)
      expect(customTimeouts.has(timeout1)).toBe(false)
      expect(customTimeouts.has(timeout2)).toBe(true)
    })
  })
})