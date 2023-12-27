import { describe, expect, it, vi } from 'vitest'
import { createNotifyManager } from '../notifyManager'
import { sleep } from './utils'

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

  it('should schedule a microTask when configured', async () => {
    const notifyManagerTest = createNotifyManager()
    const notifySpy = vi.fn()
    notifyManagerTest.setBatchMethod({ type: "tick" })
    notifyManagerTest.setNotifyFunction(notifySpy)

    notifyManagerTest.batch(() => notifyManagerTest.schedule(vi.fn))

    expect(notifySpy).toHaveBeenCalledTimes(0)

    // wait until the microtask has run
    await new Promise<void>(res => queueMicrotask(res))

    expect(notifySpy).toHaveBeenCalledTimes(1)

  })

  it('should use requestAnimationFrame when configured', async () => {
    // mock requestAnimationFrame global with queueMicrotask
    const requestAnimationFrameMock = vi.fn((cb: (ts: number) => void) => {
      queueMicrotask(() => cb(performance.now()))
    })
    vi.stubGlobal("requestAnimationFrame", requestAnimationFrameMock);

    const notifyManagerTest = createNotifyManager()
    const notifySpy = vi.fn()
    notifyManagerTest.setBatchMethod({ type: "raf" })
    notifyManagerTest.setNotifyFunction(notifySpy)

    notifyManagerTest.batch(() => notifyManagerTest.schedule(vi.fn))

    expect(notifySpy).toHaveBeenCalledTimes(0)
    expect(requestAnimationFrameMock).toHaveBeenCalledOnce()

    // wait until the microtask has run
    await new Promise<void>(res => queueMicrotask(res))

    expect(notifySpy).toHaveBeenCalledTimes(1)
    vi.unstubAllGlobals()
  })

  it('should use a custom callback when configured', async () => {
    const customCallback = vi.fn((cb) => queueMicrotask(cb));

    const notifyManagerTest = createNotifyManager()
    const notifySpy = vi.fn()
    notifyManagerTest.setBatchMethod({ type: "custom", fn: customCallback })
    notifyManagerTest.setNotifyFunction(notifySpy)

    notifyManagerTest.batch(() => notifyManagerTest.schedule(vi.fn))

    expect(customCallback).toHaveBeenCalledOnce();

    // wait until the microtask has run
    await new Promise<void>(res => queueMicrotask(res))

    expect(notifySpy).toHaveBeenCalledTimes(1)
  })

  it('should use timeout when configured', async () => {
    const setTimeoutMock = vi.fn((cb: () => void, _delay: number) => queueMicrotask(cb))
    vi.stubGlobal("setTimeout", setTimeoutMock)

    const notifyManagerTest = createNotifyManager()
    const notifySpy = vi.fn()
    notifyManagerTest.setBatchMethod({ type: "timer" })
    notifyManagerTest.setNotifyFunction(notifySpy);

    notifyManagerTest.batch(() => notifyManagerTest.schedule(vi.fn))

    expect(setTimeoutMock).toHaveBeenCalledOnce();
    expect(setTimeoutMock).toHaveBeenCalledWith(expect.anything(), 0);

    // wait until the microtask has run
    await new Promise<void>(res => queueMicrotask(res))
    expect(notifySpy).toHaveBeenCalledOnce();

    vi.unstubAllGlobals()
  })

  it('should use timeout with configured delay', async () => {
    const setTimeoutMock = vi.fn((cb: () => void, _delay: number) => queueMicrotask(cb))
    vi.stubGlobal("setTimeout", setTimeoutMock)

    const notifyManagerTest = createNotifyManager()
    const notifySpy = vi.fn()
    notifyManagerTest.setBatchMethod({ type: "timer", timeout: 42 })
    notifyManagerTest.setNotifyFunction(notifySpy);

    notifyManagerTest.batch(() => notifyManagerTest.schedule(vi.fn))

    expect(setTimeoutMock).toHaveBeenCalledOnce();
    expect(setTimeoutMock).toHaveBeenCalledWith(expect.anything(), 42);

    // wait until the microtask has run
    await new Promise<void>(res => queueMicrotask(res))
    expect(notifySpy).toHaveBeenCalledOnce();

    vi.unstubAllGlobals()
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
    } catch { }

    // needed for setTimeout to kick in
    await sleep(1)

    expect(notifySpy).toHaveBeenCalledTimes(1)
  })

  it('typedefs should catch proper signatures', async () => {
    const notifyManagerTest = createNotifyManager()

    // we define some fn with its signature:
    const fn: (a: string, b: number) => string = (a, b) => a + b

    //now somefn expect to be called with args [a: string, b: number]
    const someFn = notifyManagerTest.batchCalls(fn)

    someFn('im happy', 4)

    //@ts-expect-error
    someFn('im not happy', false)
  })
})
