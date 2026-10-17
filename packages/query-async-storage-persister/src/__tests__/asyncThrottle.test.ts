import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sleep } from '@tanstack/query-test-utils'
import { asyncThrottle } from '../asyncThrottle'

describe('asyncThrottle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should throttle calls to run at most once per interval with the latest arguments', async () => {
    const interval = 10
    const execTimeStamps: Array<number> = []
    const mockFunc = vi.fn(
      async (id: number, complete?: (value?: unknown) => void) => {
        await sleep(1)
        execTimeStamps.push(Date.now())
        if (complete) {
          complete(id)
        }
      },
    )
    const testFunc = asyncThrottle(mockFunc, { interval })

    testFunc(1)
    await vi.advanceTimersByTimeAsync(1)

    testFunc(2)
    await vi.advanceTimersByTimeAsync(1)

    new Promise((resolve) => testFunc(3, resolve))

    await vi.advanceTimersToNextTimerAsync()
    await vi.advanceTimersByTimeAsync(interval)
    expect(mockFunc).toHaveBeenCalledTimes(2)
    expect(mockFunc.mock.calls[1]?.[0]).toBe(3)
    expect(execTimeStamps.length).toBe(2)
    expect(execTimeStamps[1]! - execTimeStamps[0]!).toBeGreaterThanOrEqual(
      interval,
    )
  })

  it('should handle special timing (Bug #3331 case 1)', async () => {
    const interval = 1000
    const execTimeStamps: Array<number> = []
    const mockFunc = vi.fn(
      async (id: number, complete?: (value?: unknown) => void) => {
        await sleep(30)
        execTimeStamps.push(Date.now())
        if (complete) {
          complete(id)
        }
      },
    )
    const testFunc = asyncThrottle(mockFunc, { interval })

    testFunc(1)
    testFunc(2)
    await vi.advanceTimersByTimeAsync(35)
    testFunc(3)
    await vi.advanceTimersByTimeAsync(35)
    new Promise((resolve) => testFunc(4, resolve))

    await vi.advanceTimersToNextTimerAsync()
    await vi.advanceTimersByTimeAsync(interval)
    expect(mockFunc).toHaveBeenCalledTimes(2)
    expect(mockFunc.mock.calls[1]?.[0]).toBe(4)
    expect(execTimeStamps.length).toBe(2)
    expect(execTimeStamps[1]! - execTimeStamps[0]!).toBeGreaterThanOrEqual(
      interval,
    )
  })

  it('should handle "func" execution time greater than the interval (Bug #3331 case 2)', async () => {
    const interval = 1000
    const execTimeStamps: Array<number> = []
    const mockFunc = vi.fn(
      async (id: number, complete?: (value?: unknown) => void) => {
        await sleep(interval + 10)
        execTimeStamps.push(Date.now())
        if (complete) {
          complete(id)
        }
      },
    )
    const testFunc = asyncThrottle(mockFunc, { interval })

    testFunc(1)
    testFunc(2)
    new Promise((resolve) => testFunc(3, resolve))

    await vi.advanceTimersToNextTimerAsync()
    await vi.advanceTimersByTimeAsync(interval + 10)
    await vi.advanceTimersByTimeAsync(interval + 10)
    expect(mockFunc).toHaveBeenCalledTimes(2)
    expect(mockFunc.mock.calls[1]?.[0]).toBe(3)
    expect(execTimeStamps.length).toBe(2)
    expect(execTimeStamps[1]! - execTimeStamps[0]!).toBeGreaterThanOrEqual(
      interval,
    )
  })

  it('should not break next invoke when "func" throws error', async () => {
    const interval = 10

    const mockFunc = vi.fn(
      async (id: number, complete?: (value?: unknown) => void) => {
        if (id === 1) throw new Error('error')
        await sleep(1)
        if (complete) {
          complete(id)
        }
      },
    )
    const testFunc = asyncThrottle(mockFunc, { interval })

    testFunc(1)
    await vi.advanceTimersByTimeAsync(1)

    new Promise((resolve) => testFunc(2, resolve))
    await vi.advanceTimersByTimeAsync(interval)
    expect(mockFunc).toHaveBeenCalledTimes(2)
    expect(mockFunc.mock.calls[1]?.[0]).toBe(2)
  })

  it('should call "onError" when "func" throws error', () => {
    const err = new Error('error')
    const handleError = (e: unknown) => {
      expect(e).toBe(err)
    }

    const testFunc = asyncThrottle(
      () => {
        throw err
      },
      { onError: handleError },
    )
    testFunc()
  })

  it('should throw error when "func" is not a function', () => {
    expect(() => asyncThrottle(1 as any)).toThrow()
  })
})
