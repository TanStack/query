import { createNotifyManager } from '../notifyManager'
import { sleep } from './utils'
import { describe, it, expect, vi } from 'vitest'

describe('notifyManager', () => {
  it('should use default notifyFn', async () => {
    const notifyManagerTest = createNotifyManager()
    const callbackSpy = vi.fn()
    notifyManagerTest.schedule(callbackSpy)
    await sleep(1)
    expect(callbackSpy).toHaveBeenCalled()
  })

  it('should use default batchNotifyFn', async () => {
    const notifyManagerTest = createNotifyManager()
    const callbackScheduleSpy = vi
      .fn()
      .mockImplementation(async () => await sleep(20))
    const callbackBatchLevel2Spy = vi.fn().mockImplementation(async () => {
      notifyManagerTest.schedule(callbackScheduleSpy)
    })
    const callbackBatchLevel1Spy = vi.fn().mockImplementation(async () => {
      notifyManagerTest.batch(callbackBatchLevel2Spy)
    })

    notifyManagerTest.batch(callbackBatchLevel1Spy)

    await sleep(30)
    expect(callbackBatchLevel1Spy).toHaveBeenCalledTimes(1)
    expect(callbackBatchLevel2Spy).toHaveBeenCalledTimes(1)
    expect(callbackScheduleSpy).toHaveBeenCalledTimes(1)
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

    // needed for scheduleMicroTask to kick in
    await sleep(1)

    expect(notifySpy).toHaveBeenCalledTimes(1)
  })
})
