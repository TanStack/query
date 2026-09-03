import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Removable } from '../removable'
import { defaultTimeoutProvider, timeoutManager } from '../timeoutManager'
import { setIsServer } from './utils'
import type { TimeoutCallback } from '../timeoutManager'

class RemovableTest extends Removable {
  optionalRemoveSpy = vi.fn()

  // Expose the protected members so they can be exercised directly.
  callScheduleGc(): void {
    this.scheduleGc()
  }

  callUpdateGcTime(newGcTime: number | undefined): void {
    this.updateGcTime(newGcTime)
  }

  callClearGcTimeout(): void {
    this.clearGcTimeout()
  }

  protected optionalRemove(): void {
    this.optionalRemoveSpy()
  }
}

describe('Removable', () => {
  function createMockProvider() {
    return {
      setTimeout: vi.fn((_callback: TimeoutCallback, _delay: number) => 123),
      clearTimeout: vi.fn(),
      setInterval: vi.fn((_callback: TimeoutCallback, _delay: number) => 456),
      clearInterval: vi.fn(),
    }
  }

  let provider: ReturnType<typeof createMockProvider>

  beforeEach(() => {
    provider = createMockProvider()
    timeoutManager.setTimeoutProvider(provider)
  })

  afterEach(() => {
    timeoutManager.setTimeoutProvider(defaultTimeoutProvider)
    vi.restoreAllMocks()
  })

  describe('updateGcTime', () => {
    it('should default to 5 minutes when no gcTime is provided on the client', () => {
      const removable = new RemovableTest()

      removable.callUpdateGcTime(undefined)

      expect(removable.gcTime).toBe(5 * 60 * 1000)
    })

    it('should use the provided gcTime when it is larger than the default', () => {
      const removable = new RemovableTest()

      removable.callUpdateGcTime(10 * 60 * 1000)

      expect(removable.gcTime).toBe(10 * 60 * 1000)
    })

    it('should use an explicit gcTime even when it is smaller than the default', () => {
      const removable = new RemovableTest()

      removable.callUpdateGcTime(1000)

      expect(removable.gcTime).toBe(1000)
    })

    it('should never decrease an already larger gcTime', () => {
      const removable = new RemovableTest()

      removable.callUpdateGcTime(10 * 60 * 1000)
      removable.callUpdateGcTime(1000)

      expect(removable.gcTime).toBe(10 * 60 * 1000)
    })

    it('should default to Infinity on the server', () => {
      const resetIsServer = setIsServer(true)
      try {
        const removable = new RemovableTest()

        removable.callUpdateGcTime(undefined)

        expect(removable.gcTime).toBe(Infinity)
      } finally {
        resetIsServer()
      }
    })
  })

  describe('scheduleGc', () => {
    it('should schedule optionalRemove after a valid gcTime', () => {
      const removable = new RemovableTest()
      removable.callUpdateGcTime(1000)

      removable.callScheduleGc()

      expect(provider.setTimeout).toHaveBeenCalledTimes(1)
      expect(provider.setTimeout).toHaveBeenCalledWith(
        expect.any(Function),
        1000,
      )

      // The scheduled callback should invoke optionalRemove.
      const [scheduledCallback] = provider.setTimeout.mock.lastCall ?? []
      expect(removable.optionalRemoveSpy).toHaveBeenCalledTimes(0)
      scheduledCallback?.()
      expect(removable.optionalRemoveSpy).toHaveBeenCalledTimes(1)
    })

    it('should not schedule when gcTime is not a valid timeout', () => {
      const removable = new RemovableTest()
      removable.gcTime = Infinity

      removable.callScheduleGc()

      expect(provider.setTimeout).not.toHaveBeenCalled()
    })

    it('should clear a previously scheduled timeout before scheduling a new one', () => {
      const removable = new RemovableTest()
      removable.callUpdateGcTime(1000)

      removable.callScheduleGc()
      removable.callScheduleGc()

      // The second schedule clears the first timer before setting a new one.
      expect(provider.clearTimeout).toHaveBeenCalledWith(123)
      expect(provider.setTimeout).toHaveBeenCalledTimes(2)
    })
  })

  describe('clearGcTimeout', () => {
    it('should clear a scheduled timeout', () => {
      const removable = new RemovableTest()
      removable.callUpdateGcTime(1000)
      removable.callScheduleGc()

      removable.callClearGcTimeout()

      expect(provider.clearTimeout).toHaveBeenCalledWith(123)
    })

    it('should do nothing when no timeout is scheduled', () => {
      const removable = new RemovableTest()

      removable.callClearGcTimeout()

      expect(provider.clearTimeout).not.toHaveBeenCalled()
    })

    it('should not clear the same timeout twice', () => {
      const removable = new RemovableTest()
      removable.callUpdateGcTime(1000)
      removable.callScheduleGc()

      removable.callClearGcTimeout()
      removable.callClearGcTimeout()

      expect(provider.clearTimeout).toHaveBeenCalledTimes(1)
    })
  })

  describe('destroy', () => {
    it('should clear the scheduled gc timeout', () => {
      const removable = new RemovableTest()
      removable.callUpdateGcTime(1000)
      removable.callScheduleGc()

      removable.destroy()

      expect(provider.clearTimeout).toHaveBeenCalledWith(123)
    })
  })
})
