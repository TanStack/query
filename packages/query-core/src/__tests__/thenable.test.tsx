import { describe, expect, it, vi } from 'vitest'
import { pendingThenable, tryResolveSync } from '../thenable'
import type { FulfilledThenable, RejectedThenable } from '../thenable'

describe('pendingThenable', () => {
  it('should start out pending with resolve and reject attached', () => {
    const thenable = pendingThenable<string>()

    expect(thenable.status).toBe('pending')
    expect(typeof thenable.resolve).toBe('function')
    expect(typeof thenable.reject).toBe('function')
  })

  it('should expose the value and drop the pending props once resolved', async () => {
    const thenable = pendingThenable<string>()

    thenable.resolve('data')

    expect(thenable.status).toBe('fulfilled')
    expect((thenable as unknown as FulfilledThenable<string>).value).toBe('data')
    expect(thenable.resolve).toBeUndefined()
    expect(thenable.reject).toBeUndefined()
    await expect(thenable).resolves.toBe('data')
  })

  it('should expose the reason and drop the pending props once rejected', async () => {
    const thenable = pendingThenable<string>()
    const reason = new Error('error')

    thenable.reject(reason)

    expect(thenable.status).toBe('rejected')
    expect((thenable as unknown as RejectedThenable<string>).reason).toBe(reason)
    expect(thenable.resolve).toBeUndefined()
    expect(thenable.reject).toBeUndefined()
    await expect(thenable).rejects.toBe(reason)
  })

  it('should not reject a second time after being resolved', async () => {
    const thenable = pendingThenable<string>()

    thenable.resolve('data')
    // `reject` is deleted on finalize, so a late caller cannot settle it twice
    expect(thenable.reject).toBeUndefined()

    await expect(thenable).resolves.toBe('data')
  })

  it('should not report an unhandled rejection when nobody awaits it', async () => {
    const onUnhandledRejection = vi.fn()
    process.on('unhandledRejection', onUnhandledRejection)

    pendingThenable<string>().reject(new Error('error'))
    // unhandled rejections are reported after the microtask queue drains
    await new Promise((resolve) => setTimeout(resolve, 0))

    process.off('unhandledRejection', onUnhandledRejection)
    expect(onUnhandledRejection).not.toHaveBeenCalled()
  })
})

describe('tryResolveSync', () => {
  it('should return undefined for an already resolved native promise', () => {
    // `then` on a native promise always defers to a microtask, so the data is
    // never synchronously available
    expect(tryResolveSync(Promise.resolve('data'))).toBeUndefined()
  })

  it('should return the data of a thenable that resolves synchronously', () => {
    const thenable = {
      then: (onFulfilled: (value: string) => unknown) => {
        onFulfilled('data')
        return Promise.resolve('data')
      },
    } as unknown as Promise<string>

    expect(tryResolveSync(thenable)).toEqual({ data: 'data' })
  })

  it('should support a synchronous thenable whose then() has no catch', () => {
    // a React thenable is not always a full promise, so `then` may return
    // something without a `catch` method
    const thenable = {
      then: (onFulfilled: (value: string) => unknown) => {
        onFulfilled('data')
      },
    } as unknown as Promise<string>

    expect(tryResolveSync(thenable)).toEqual({ data: 'data' })
  })

  it('should return undefined when a synchronous thenable resolves with undefined', () => {
    const thenable = {
      then: (onFulfilled: (value: undefined) => unknown) => {
        onFulfilled(undefined)
      },
    } as unknown as Promise<undefined>

    expect(tryResolveSync(thenable)).toBeUndefined()
  })

  it('should return undefined for a rejected promise without leaving it unhandled', async () => {
    const onUnhandledRejection = vi.fn()
    process.on('unhandledRejection', onUnhandledRejection)

    expect(tryResolveSync(Promise.reject(new Error('error')))).toBeUndefined()
    await new Promise((resolve) => setTimeout(resolve, 0))

    process.off('unhandledRejection', onUnhandledRejection)
    expect(onUnhandledRejection).not.toHaveBeenCalled()
  })
})
