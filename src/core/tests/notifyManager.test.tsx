import { NotifyManager } from '../notifyManager'
import { sleep } from '../../devtools/tests/utils'

describe('notifyManager', () => {
  it('should use default notifyFn', async () => {
    const notifyManagerTest = new NotifyManager()
    const callbackSpy = jest.fn()
    notifyManagerTest.schedule(callbackSpy)
    await sleep(1)
    expect(callbackSpy).toHaveBeenCalled()
  })

  it('should use default batchNotifyFn', async () => {
    const notifyManagerTest = new NotifyManager()
    const callbackScheduleSpy = jest
      .fn()
      .mockImplementation(async () => await sleep(20))
    const callbackBatchLevel2Spy = jest.fn().mockImplementation(async () => {
      notifyManagerTest.schedule(callbackScheduleSpy)
    })
    const callbackBatchLevel1Spy = jest.fn().mockImplementation(async () => {
      notifyManagerTest.batch(callbackBatchLevel2Spy)
    })

    notifyManagerTest.batch(callbackBatchLevel1Spy)

    await sleep(30)
    expect(callbackBatchLevel1Spy).toHaveBeenCalledTimes(1)
    expect(callbackBatchLevel2Spy).toHaveBeenCalledTimes(1)
    expect(callbackScheduleSpy).toHaveBeenCalledTimes(1)
  })

  it('should flush if error is thrown', () => {
    const notifyManagerTest = new NotifyManager()
    const flushSpy = jest.fn()

    notifyManagerTest.flush = flushSpy

    try {
      notifyManagerTest.batch(() => {
        throw new Error('Foo')
      })
    } catch {}

    expect(flushSpy).toHaveBeenCalledTimes(1)
  })
})
