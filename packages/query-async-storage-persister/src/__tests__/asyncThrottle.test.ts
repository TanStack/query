import { asyncThrottle } from '../asyncThrottle'
import { sleep as delay } from './utils'

describe('asyncThrottle', () => {
  test('basic', async () => {
    const interval = 10
    const execTimeStamps: number[] = []
    const mockFunc = jest.fn(
      async (id: number, complete?: (value?: unknown) => void) => {
        await delay(1)
        execTimeStamps.push(Date.now())
        if (complete) {
          complete(id)
        }
      },
    )
    const testFunc = asyncThrottle(mockFunc, { interval })

    testFunc(1)
    await delay(1)
    testFunc(2)
    await delay(1)
    await new Promise((resolve) => testFunc(3, resolve))

    expect(mockFunc).toBeCalledTimes(2)
    expect(mockFunc.mock.calls[1]?.[0]).toBe(3)
    expect(execTimeStamps.length).toBe(2)
    expect(execTimeStamps[1]! - execTimeStamps[0]!).toBeGreaterThanOrEqual(
      interval,
    )
  })

  test('Bug #3331 case 1: Special timing', async () => {
    const interval = 1000
    const execTimeStamps: number[] = []
    const mockFunc = jest.fn(
      async (id: number, complete?: (value?: unknown) => void) => {
        await delay(30)
        execTimeStamps.push(Date.now())
        if (complete) {
          complete(id)
        }
      },
    )
    const testFunc = asyncThrottle(mockFunc, { interval })

    testFunc(1)
    testFunc(2)
    await delay(35)
    testFunc(3)
    await delay(35)
    await new Promise((resolve) => testFunc(4, resolve))

    expect(mockFunc).toBeCalledTimes(2)
    expect(mockFunc.mock.calls[1]?.[0]).toBe(4)
    expect(execTimeStamps.length).toBe(2)
    expect(execTimeStamps[1]! - execTimeStamps[0]!).toBeGreaterThanOrEqual(
      interval,
    )
  })

  test('Bug #3331 case 2: "func" execution time is greater than the interval.', async () => {
    const interval = 1000
    const execTimeStamps: number[] = []
    const mockFunc = jest.fn(
      async (id: number, complete?: (value?: unknown) => void) => {
        await delay(interval + 10)
        execTimeStamps.push(Date.now())
        if (complete) {
          complete(id)
        }
      },
    )
    const testFunc = asyncThrottle(mockFunc, { interval })

    testFunc(1)
    testFunc(2)
    await new Promise((resolve) => testFunc(3, resolve))

    expect(mockFunc).toBeCalledTimes(2)
    expect(mockFunc.mock.calls[1]?.[0]).toBe(3)
    expect(execTimeStamps.length).toBe(2)
    expect(execTimeStamps[1]! - execTimeStamps[0]!).toBeGreaterThanOrEqual(
      interval,
    )
  })

  test('"func" throw error not break next invoke', async () => {
    const mockFunc = jest.fn(
      async (id: number, complete?: (value?: unknown) => void) => {
        if (id === 1) throw new Error('error')
        await delay(1)
        if (complete) {
          complete(id)
        }
      },
    )
    const testFunc = asyncThrottle(mockFunc, { interval: 10 })

    testFunc(1)
    await delay(1)
    await new Promise((resolve) => testFunc(2, resolve))

    expect(mockFunc).toBeCalledTimes(2)
    expect(mockFunc.mock.calls[1]?.[0]).toBe(2)
  })

  test('"onError" should be called when "func" throw error', (done) => {
    const err = new Error('error')
    const handleError = (e: unknown) => {
      expect(e).toBe(err)
      done()
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
