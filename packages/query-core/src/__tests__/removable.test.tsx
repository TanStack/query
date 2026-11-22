import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Removable } from '../removable'
import { defaultTimeoutProvider, timeoutManager } from '../timeoutManager'
import { setIsServer } from './utils'
import type { TimeoutCallback, TimeoutProvider } from '../timeoutManager'

class RemovableTest extends Removable {
  optionalRemoveSpy = vi.fn<() => void>()

  // Expose the protected members so they can be exercised directly.
  callScheduleGc(gcTime: number | undefined): void {
    this.scheduleGc(gcTime)
  }

  callUpdateGcTimestamp(gcTime: number | undefined): void {
    this.updateGcTimestamp(gcTime)
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
      setTimeout: vi.fn<TimeoutProvider<number>['setTimeout']>(
        (_callback: TimeoutCallback, _delay: number) => 123,
      ),
      clearTimeout: vi.fn<TimeoutProvider<number>['clearTimeout']>(),
      setInterval: vi.fn<TimeoutProvider<number>['setInterval']>(
        (_callback: TimeoutCallback, _delay: number) => 456,
      ),
      clearInterval: vi.fn<TimeoutProvider<number>['clearInterval']>(),
    }
  }

  let provider: ReturnType<typeof createMockProvider>

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date', 'performance'] })
    provider = createMockProvider()
    timeoutManager.setTimeoutProvider(provider)
  })

  afterEach(() => {
    timeoutManager.setTimeoutProvider(defaultTimeoutProvider)
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('recording removal times', () => {
    it('should default to 5 minutes when no gcTime is provided on the client', () => {
      const removable = new RemovableTest()

      removable.callScheduleGc(undefined)

      expect(provider.setTimeout).toHaveBeenCalledWith(
        expect.any(Function),
        5 * 60 * 1000,
      )
    })

    it('should use an explicit gcTime', () => {
      const removable = new RemovableTest()

      removable.callScheduleGc(1000)

      expect(provider.setTimeout).toHaveBeenCalledWith(
        expect.any(Function),
        1000,
      )
    })

    it('should default to Infinity on the server', () => {
      const resetIsServer = setIsServer(true)
      try {
        const removable = new RemovableTest()

        removable.callScheduleGc(undefined)

        expect(provider.setTimeout).not.toHaveBeenCalled()
      } finally {
        resetIsServer()
      }
    })

    it('should keep a later removal time from a longer gcTime recorded before', () => {
      const removable = new RemovableTest()

      // 0:00 removal at 5:00
      removable.callUpdateGcTimestamp(5 * 60 * 1000)
      // 1:00 removal at 2:00, earlier than 5:00
      vi.advanceTimersByTime(60 * 1000)
      removable.callScheduleGc(60 * 1000)
      // scheduled at 5:00, so 4 minutes
      expect(provider.setTimeout).toHaveBeenCalledWith(
        expect.any(Function),
        4 * 60 * 1000,
      )
    })

    it('should use a later removal time from a shorter gcTime recorded after', () => {
      const removable = new RemovableTest()

      // 0:00 removal at 1:00
      removable.callUpdateGcTimestamp(60 * 1000)
      // 2:00 removal at 2:30, later than 1:00
      vi.advanceTimersByTime(2 * 60 * 1000)
      removable.callScheduleGc(30 * 1000)
      // scheduled at 2:30, so 30 seconds
      expect(provider.setTimeout).toHaveBeenCalledWith(
        expect.any(Function),
        30 * 1000,
      )
    })
  })

  describe('scheduleGc', () => {
    it('should schedule optionalRemove at the recorded removal time', () => {
      const removable = new RemovableTest()
      removable.callScheduleGc(1000)

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

    it('should not schedule when the removal time is Infinity', () => {
      const removable = new RemovableTest()
      removable.callScheduleGc(Infinity)

      expect(provider.setTimeout).not.toHaveBeenCalled()
    })

    it('should clear a previously scheduled timeout before scheduling a new one', () => {
      const removable = new RemovableTest()

      removable.callScheduleGc(1000)
      removable.callScheduleGc(1000)

      // The second schedule clears the first timer before setting a new one.
      expect(provider.clearTimeout).toHaveBeenCalledWith(123)
      expect(provider.setTimeout).toHaveBeenCalledTimes(2)
    })

    it('should not move the removal time when the system clock changes', () => {
      const removable = new RemovableTest()

      removable.callUpdateGcTimestamp(5 * 60 * 1000)
      vi.advanceTimersByTime(60 * 1000)
      // The system clock jumps back an hour, but only a minute has elapsed
      vi.setSystemTime(Date.now() - 60 * 60 * 1000)
      removable.callScheduleGc(60 * 1000)

      expect(provider.setTimeout).toHaveBeenCalledWith(
        expect.any(Function),
        4 * 60 * 1000,
      )
    })

    it('should ignore a NaN gcTime', () => {
      const removable = new RemovableTest()

      removable.callUpdateGcTimestamp(1000)
      removable.callScheduleGc(NaN)

      expect(provider.setTimeout).toHaveBeenCalledWith(
        expect.any(Function),
        1000,
      )
    })

    it('should keep an earlier removal time and recover after a NaN gcTime', () => {
      const removable = new RemovableTest()

      removable.callUpdateGcTimestamp(5 * 60 * 1000)
      removable.callUpdateGcTimestamp(NaN)
      removable.callScheduleGc(1000)

      expect(provider.setTimeout).toHaveBeenCalledWith(
        expect.any(Function),
        5 * 60 * 1000,
      )
    })
  })

  describe('clearGcTimeout', () => {
    it('should clear a scheduled timeout', () => {
      const removable = new RemovableTest()
      removable.callScheduleGc(1000)

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
      removable.callScheduleGc(1000)

      removable.callClearGcTimeout()
      removable.callClearGcTimeout()

      expect(provider.clearTimeout).toHaveBeenCalledTimes(1)
    })
  })

  describe('destroy', () => {
    it('should clear the scheduled gc timeout', () => {
      const removable = new RemovableTest()
      removable.callScheduleGc(1000)

      removable.destroy()

      expect(provider.clearTimeout).toHaveBeenCalledWith(123)
    })
  })
})
