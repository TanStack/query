import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CancelledError, canFetch, createRetryer } from '../retryer'
import { focusManager } from '../focusManager'
import { onlineManager } from '../onlineManager'

describe('createRetryer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    onlineManager.setOnline(true)
    focusManager.setFocused(undefined)
  })

  afterEach(() => {
    onlineManager.setOnline(true)
    focusManager.setFocused(undefined)
    vi.useRealTimers()
  })

  it('should resolve with the result of fn and set status to resolved', async () => {
    const fn = vi.fn().mockResolvedValue('success')
    const retryer = createRetryer<string>({
      fn,
      networkMode: 'online',
      canRun: () => true,
    })

    const promise = retryer.start()
    await vi.advanceTimersByTimeAsync(0)

    await expect(promise).resolves.toBe('success')
    expect(retryer.status()).toBe('resolved')
  })

  it('should reject after exhausting the retry limit and report each failure', async () => {
    const error = new Error('failed')
    const fn = vi.fn().mockRejectedValue(error)
    const onFail = vi.fn()
    const retryer = createRetryer({
      fn,
      retry: 2,
      onFail,
      networkMode: 'online',
      canRun: () => true,
    })

    const promise = retryer.start()
    await vi.advanceTimersByTimeAsync(10_000)

    await expect(promise).rejects.toBe(error)
    expect(fn).toHaveBeenCalledTimes(3)
    expect(onFail).toHaveBeenNthCalledWith(1, 1, error)
    expect(onFail).toHaveBeenNthCalledWith(2, 2, error)
    expect(retryer.status()).toBe('rejected')
  })

  it('should retry a synchronous throw and resolve once fn succeeds', async () => {
    let calls = 0
    const fn = vi.fn().mockImplementation(() => {
      calls++
      if (calls === 1) {
        throw new Error('sync throw')
      }
      return Promise.resolve('success')
    })
    const retryer = createRetryer({
      fn,
      retry: 1,
      networkMode: 'online',
      canRun: () => true,
    })

    const promise = retryer.start()
    await vi.advanceTimersByTimeAsync(5_000)

    await expect(promise).resolves.toBe('success')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should use the default exponential backoff capped at 30 seconds', async () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')
    let calls = 0
    const fn = vi.fn().mockImplementation(() => {
      calls++
      return calls < 7
        ? Promise.reject(new Error('failed'))
        : Promise.resolve('success')
    })
    const retryer = createRetryer({
      fn,
      retry: true,
      networkMode: 'online',
      canRun: () => true,
    })

    const promise = retryer.start()
    await vi.advanceTimersByTimeAsync(100_000)

    await expect(promise).resolves.toBe('success')
    const delays = setTimeoutSpy.mock.calls
      .filter((call) => typeof call[1] === 'number')
      .map((call) => call[1])
    expect(delays).toEqual([1000, 2000, 4000, 8000, 16000, 30000])
  })

  it('should reject with a CancelledError carrying the cancel options and call onCancel', async () => {
    const onCancel = vi.fn()
    const fn = vi.fn().mockImplementation(() => new Promise(() => {}))
    const retryer = createRetryer({
      fn,
      onCancel,
      networkMode: 'online',
      canRun: () => true,
    })

    const promise = retryer.start()
    retryer.cancel({ revert: true, silent: true })

    let caught: unknown
    await promise.catch((error) => {
      caught = error
    })

    expect(caught).toBeInstanceOf(CancelledError)
    expect((caught as CancelledError).revert).toBe(true)
    expect((caught as CancelledError).silent).toBe(true)
    expect(onCancel).toHaveBeenCalledWith(caught)
    expect(retryer.status()).toBe('rejected')
  })

  it('should ignore cancel after the retryer resolved', async () => {
    const onCancel = vi.fn()
    const fn = vi.fn().mockResolvedValue('success')
    const retryer = createRetryer({
      fn,
      onCancel,
      networkMode: 'online',
      canRun: () => true,
    })

    const promise = retryer.start()
    await vi.advanceTimersByTimeAsync(0)
    retryer.cancel()

    await expect(promise).resolves.toBe('success')
    expect(retryer.status()).toBe('resolved')
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('should reject the pending retry instead of re-running when cancelRetry was called', async () => {
    const error = new Error('failed')
    const fn = vi.fn().mockRejectedValue(error)
    const retryer = createRetryer({
      fn,
      retry: 1,
      networkMode: 'online',
      canRun: () => true,
    })

    const promise = retryer.start()
    await vi.advanceTimersByTimeAsync(0)
    expect(fn).toHaveBeenCalledTimes(1)

    retryer.cancelRetry()
    await vi.advanceTimersByTimeAsync(5_000)

    await expect(promise).rejects.toBe(error)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(retryer.status()).toBe('rejected')
  })

  it('should resume retrying after continueRetry reverts cancelRetry', async () => {
    let calls = 0
    const fn = vi.fn().mockImplementation(() => {
      calls++
      return calls === 1
        ? Promise.reject(new Error('failed'))
        : Promise.resolve('success')
    })
    const retryer = createRetryer({
      fn,
      retry: 1,
      networkMode: 'online',
      canRun: () => true,
    })

    const promise = retryer.start()
    await vi.advanceTimersByTimeAsync(0)
    retryer.cancelRetry()
    retryer.continueRetry()
    await vi.advanceTimersByTimeAsync(5_000)

    await expect(promise).resolves.toBe('success')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should pause when offline during a retry and continue when back online', async () => {
    let calls = 0
    const fn = vi.fn().mockImplementation(() => {
      calls++
      return calls === 1
        ? Promise.reject(new Error('failed'))
        : Promise.resolve('success')
    })
    const onPause = vi.fn()
    const onContinue = vi.fn()
    const retryer = createRetryer({
      fn,
      retry: 1,
      onPause,
      onContinue,
      networkMode: 'online',
      canRun: () => true,
    })

    const promise = retryer.start()
    onlineManager.setOnline(false)
    await vi.advanceTimersByTimeAsync(5_000)

    expect(onPause).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(retryer.status()).toBe('pending')

    onlineManager.setOnline(true)
    void retryer.continue()
    await vi.advanceTimersByTimeAsync(0)

    expect(onContinue).toHaveBeenCalledTimes(1)
    await expect(promise).resolves.toBe('success')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should run even when offline with networkMode "always"', async () => {
    onlineManager.setOnline(false)
    const fn = vi.fn().mockResolvedValue('success')
    const retryer = createRetryer({
      fn,
      networkMode: 'always',
      canRun: () => true,
    })

    const promise = retryer.start()
    await vi.advanceTimersByTimeAsync(0)

    await expect(promise).resolves.toBe('success')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should start offline with networkMode "offlineFirst" but pause when the retry stays offline', async () => {
    onlineManager.setOnline(false)
    let calls = 0
    const fn = vi.fn().mockImplementation(() => {
      calls++
      return calls === 1
        ? Promise.reject(new Error('failed'))
        : Promise.resolve('success')
    })
    const onPause = vi.fn()
    const retryer = createRetryer({
      fn,
      retry: 1,
      onPause,
      networkMode: 'offlineFirst',
      canRun: () => true,
    })

    void retryer.start()
    await vi.advanceTimersByTimeAsync(5_000)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(onPause).toHaveBeenCalledTimes(1)
    expect(retryer.status()).toBe('pending')
  })

  it('should reflect network availability in canFetch and canStart', () => {
    const canRun = () => true
    onlineManager.setOnline(false)

    expect(canFetch('online')).toBe(false)
    expect(canFetch('offlineFirst')).toBe(true)

    const onlineRetryer = createRetryer({
      fn: () => Promise.resolve(''),
      networkMode: 'online',
      canRun,
    })
    expect(onlineRetryer.canStart()).toBe(false)

    const offlineFirstRetryer = createRetryer({
      fn: () => Promise.resolve(''),
      networkMode: 'offlineFirst',
      canRun,
    })
    expect(offlineFirstRetryer.canStart()).toBe(true)

    onlineManager.setOnline(true)
    expect(onlineRetryer.canStart()).toBe(true)
  })

  it('should reuse the initialPromise on the first run and call fn only on retries', async () => {
    const fn = vi.fn().mockResolvedValue('from fn')
    const retryer = createRetryer({
      fn,
      initialPromise: Promise.reject(new Error('initial failed')),
      retry: 1,
      networkMode: 'online',
      canRun: () => true,
    })

    const promise = retryer.start()
    await vi.advanceTimersByTimeAsync(5_000)

    await expect(promise).resolves.toBe('from fn')
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
