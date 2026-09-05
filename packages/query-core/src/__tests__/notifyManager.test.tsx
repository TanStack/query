import {
  afterEach,
  assertType,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from 'vitest'
import { sleep } from '@tanstack/query-test-utils'
import { createNotifyManager } from '../notifyManager'

describe('notifyManager', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should use default notifyFn', async () => {
    const notifyManagerTest = createNotifyManager()
    const callbackSpy = vi.fn()
    notifyManagerTest.schedule(callbackSpy)
    await vi.advanceTimersByTimeAsync(0)
    expect(callbackSpy).toHaveBeenCalled()
  })

  it('should use default batchNotifyFn', async () => {
    const notifyManagerTest = createNotifyManager()
    const callbackScheduleSpy = vi.fn().mockImplementation(() => sleep(20))
    const callbackBatchLevel2Spy = vi.fn().mockImplementation(() => {
      notifyManagerTest.schedule(callbackScheduleSpy)
    })
    const callbackBatchLevel1Spy = vi.fn().mockImplementation(() => {
      notifyManagerTest.batch(callbackBatchLevel2Spy)
    })
    notifyManagerTest.batch(callbackBatchLevel1Spy)

    await vi.advanceTimersByTimeAsync(0)
    expect(callbackBatchLevel1Spy).toHaveBeenCalledTimes(1)
    expect(callbackBatchLevel2Spy).toHaveBeenCalledTimes(1)
    expect(callbackScheduleSpy).toHaveBeenCalledTimes(1)
  })

  it('should use a custom scheduler when configured', async () => {
    const customCallback = vi.fn((cb) => queueMicrotask(cb))

    const notifyManagerTest = createNotifyManager()
    const notifySpy = vi.fn()
    notifyManagerTest.setScheduler(customCallback)
    notifyManagerTest.setNotifyFunction(notifySpy)

    notifyManagerTest.batch(() => notifyManagerTest.schedule(vi.fn))

    expect(customCallback).toHaveBeenCalledOnce()

    await vi.advanceTimersByTimeAsync(0)
    expect(notifySpy).toHaveBeenCalledTimes(1)
  })

  it('should notify if error is thrown', async () => {
    const notifyManagerTest = createNotifyManager()
    const notifySpy = vi.fn()

    notifyManagerTest.setNotifyFunction(notifySpy)

    try {
      notifyManagerTest.batch(() => {
        notifyManagerTest.schedule(vi.fn)
        throw new Error('Foo')
      })
    } catch {}

    await vi.advanceTimersByTimeAsync(0)

    expect(notifySpy).toHaveBeenCalledTimes(1)
  })

  it('typeDefs should catch proper signatures', () => {
    const notifyManagerTest = createNotifyManager()

    // we define some fn with its signature:
    const fn: (a: string, b: number) => string = (a, b) => a + b

    // now someFn expect to be called with args [a: string, b: number]
    const someFn = notifyManagerTest.batchCalls(fn)

    expectTypeOf(someFn).parameters.toEqualTypeOf<Parameters<typeof fn>>()
    assertType<Parameters<typeof someFn>>(['im happy', 4])
    assertType<Parameters<typeof someFn>>([
      'im not happy',
      // @ts-expect-error
      false,
    ])
  })

  it('should use custom batch notify function', async () => {
    const notifyManagerTest = createNotifyManager()
    const batchNotifySpy = vi.fn((cb) => cb())
    const callbackSpy1 = vi.fn()
    const callbackSpy2 = vi.fn()

    notifyManagerTest.setBatchNotifyFunction(batchNotifySpy)

    notifyManagerTest.batch(() => {
      notifyManagerTest.schedule(callbackSpy1)
      notifyManagerTest.schedule(callbackSpy2)
    })

    await vi.advanceTimersByTimeAsync(0)

    expect(batchNotifySpy).toHaveBeenCalled()
    expect(callbackSpy1).toHaveBeenCalled()
    expect(callbackSpy2).toHaveBeenCalled()
  })

  it('should batch calls correctly', async () => {
    const notifyManagerTest = createNotifyManager()
    const callbackSpy = vi.fn()

    const batchedFn = notifyManagerTest.batchCalls((a: number, b: string) => {
      callbackSpy(a, b)
    })

    batchedFn(1, 'test')
    await vi.advanceTimersByTimeAsync(0)

    expect(callbackSpy).toHaveBeenCalledWith(1, 'test')
  })

  it('should not schedule anything when a batch is empty', () => {
    const notifyManagerTest = createNotifyManager()
    const schedulerSpy = vi.fn((cb) => queueMicrotask(cb))
    notifyManagerTest.setScheduler(schedulerSpy)

    notifyManagerTest.batch(() => {})

    expect(schedulerSpy).not.toHaveBeenCalled()
  })

  it('should notify scheduled callbacks individually outside of a batch', async () => {
    const notifyManagerTest = createNotifyManager()
    const notifySpy = vi.fn()
    const batchNotifySpy = vi.fn((cb) => cb())
    notifyManagerTest.setNotifyFunction(notifySpy)
    notifyManagerTest.setBatchNotifyFunction(batchNotifySpy)

    notifyManagerTest.schedule(vi.fn())
    notifyManagerTest.schedule(vi.fn())
    await vi.advanceTimersByTimeAsync(0)

    expect(notifySpy).toHaveBeenCalledTimes(2)
    expect(batchNotifySpy).not.toHaveBeenCalled()
  })

  it('should only flush after the outermost batch ends', async () => {
    const notifyManagerTest = createNotifyManager()
    const schedulerSpy = vi.fn((cb) => queueMicrotask(cb))
    notifyManagerTest.setScheduler(schedulerSpy)
    const innerCallback = vi.fn()
    const outerCallback = vi.fn()

    notifyManagerTest.batch(() => {
      notifyManagerTest.batch(() => {
        notifyManagerTest.schedule(innerCallback)
      })

      // the inner batch ending must not flush the queue yet
      expect(schedulerSpy).not.toHaveBeenCalled()

      notifyManagerTest.schedule(outerCallback)
    })

    expect(schedulerSpy).toHaveBeenCalledOnce()

    await vi.advanceTimersByTimeAsync(0)
    expect(innerCallback).toHaveBeenCalledTimes(1)
    expect(outerCallback).toHaveBeenCalledTimes(1)
  })

  it('should return the result of the batched callback', () => {
    const notifyManagerTest = createNotifyManager()

    const result = notifyManagerTest.batch(() => 42)

    expect(result).toBe(42)
  })

  it('should dispatch schedules immediately after a batch threw', async () => {
    const notifyManagerTest = createNotifyManager()
    const schedulerSpy = vi.fn((cb) => queueMicrotask(cb))
    notifyManagerTest.setScheduler(schedulerSpy)
    const callbackSpy = vi.fn()

    expect(() =>
      notifyManagerTest.batch(() => {
        throw new Error('Foo')
      }),
    ).toThrow('Foo')

    // the transaction must be released, otherwise this schedule would be
    // queued forever instead of being dispatched
    notifyManagerTest.schedule(callbackSpy)
    expect(schedulerSpy).toHaveBeenCalledOnce()

    await vi.advanceTimersByTimeAsync(0)
    expect(callbackSpy).toHaveBeenCalledTimes(1)
  })

  it('should defer notifications scheduled with the default scheduler to a macrotask', async () => {
    const notifyManagerTest = createNotifyManager()
    const callbackSpy = vi.fn()

    notifyManagerTest.schedule(callbackSpy)

    // the default scheduler is based on setTimeout(0), so draining microtasks
    // alone must not run the notification
    await Promise.resolve()
    expect(callbackSpy).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(0)
    expect(callbackSpy).toHaveBeenCalledTimes(1)
  })
})
