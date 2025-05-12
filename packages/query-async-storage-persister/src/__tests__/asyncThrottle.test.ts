import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { sleep } from '@tanstack/query-test-utils'
import { asyncThrottle } from '../asyncThrottle'

describe('asyncThrottle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('basic', async () => {
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

    expect(mockFunc).toBeCalledTimes(2)
    expect(mockFunc.mock.calls[1]?.[0]).toBe(3)
    expect(execTimeStamps.length).toBe(2)
    expect(execTimeStamps[1]! - execTimeStamps[0]!).toBeGreaterThanOrEqual(
      interval,
    )
  })

  test('Bug #3331 case 1: Special timing', async () => {
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

    expect(mockFunc).toBeCalledTimes(2)
    expect(mockFunc.mock.calls[1]?.[0]).toBe(4)
    expect(execTimeStamps.length).toBe(2)
    expect(execTimeStamps[1]! - execTimeStamps[0]!).toBeGreaterThanOrEqual(
      interval,
    )
  })

  test('Bug #3331 case 2: "func" execution time is greater than the interval.', async () => {
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

    expect(mockFunc).toBeCalledTimes(2)
    expect(mockFunc.mock.calls[1]?.[0]).toBe(3)
    expect(execTimeStamps.length).toBe(2)
    expect(execTimeStamps[1]! - execTimeStamps[0]!).toBeGreaterThanOrEqual(
      interval,
    )
  })

  test('"func" throw error not break next invoke', async () => {
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

    expect(mockFunc).toBeCalledTimes(2)
    expect(mockFunc.mock.calls[1]?.[0]).toBe(2)
  })

  test('"onError" should be called when "func" throw error', () => {
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

  test('should throw error when "func" is not a function', () => {
    expect(() => asyncThrottle(1 as any)).toThrowError()
  })
})
