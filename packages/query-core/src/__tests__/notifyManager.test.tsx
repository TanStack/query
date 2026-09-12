import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
})
