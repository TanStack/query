import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { MutationObserver, QueryClient } from '..'

describe('mutationObserver', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
    queryClient.mount()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  it('onUnsubscribe should not remove the current mutation observer if there is still a subscription', async () => {
    const mutation = new MutationObserver(queryClient, {
      mutationFn: (text: string) => sleep(20).then(() => text),
    })

    const subscription1Handler = vi.fn()
    const subscription2Handler = vi.fn()

    const unsubscribe1 = mutation.subscribe(subscription1Handler)
    const unsubscribe2 = mutation.subscribe(subscription2Handler)

    mutation.mutate('input')

    unsubscribe1()

    expect(subscription1Handler).toHaveBeenCalledTimes(1)
    expect(subscription2Handler).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(20)
    expect(subscription1Handler).toHaveBeenCalledTimes(1)
    expect(subscription2Handler).toHaveBeenCalledTimes(2)

    unsubscribe2()
  })

  it('unsubscribe should remove observer to trigger GC', async () => {
    const mutation = new MutationObserver(queryClient, {
      mutationFn: (text: string) => sleep(5).then(() => text),
      gcTime: 10,
    })

    const subscriptionHandler = vi.fn()

    const unsubscribe = mutation.subscribe(subscriptionHandler)

    mutation.mutate('input')

    await vi.advanceTimersByTimeAsync(5)
    expect(queryClient.getMutationCache().findAll()).toHaveLength(1)

    unsubscribe()

    await vi.advanceTimersByTimeAsync(10)
    expect(queryClient.getMutationCache().findAll()).toHaveLength(0)
  })

  it('resubscribing should reattach the observer to the in-flight mutation', async () => {
    const mutation = new MutationObserver(queryClient, {
      mutationFn: (text: string) => sleep(20).then(() => text),
    })

    const unsubscribe = mutation.subscribe(vi.fn())

    mutation.mutate('input')

    unsubscribe()

    const subscriptionHandler = vi.fn()
    mutation.subscribe(subscriptionHandler)

    await vi.advanceTimersByTimeAsync(20)
    expect(mutation.getCurrentResult()).toMatchObject({
      status: 'success',
      data: 'input',
    })
    expect(subscriptionHandler).toHaveBeenCalledTimes(1)
  })

  it('resubscribing should pick up a mutation that settled while unsubscribed', async () => {
    const mutation = new MutationObserver(queryClient, {
      mutationFn: (text: string) => sleep(20).then(() => text),
    })

    const unsubscribe = mutation.subscribe(vi.fn())

    mutation.mutate('input')

    unsubscribe()

    await vi.advanceTimersByTimeAsync(20)
    mutation.subscribe(vi.fn())

    expect(mutation.getCurrentResult()).toMatchObject({
      status: 'success',
      data: 'input',
    })
  })

  it('reset should remove observer to trigger GC', async () => {
    const mutation = new MutationObserver(queryClient, {
      mutationFn: (text: string) => sleep(5).then(() => text),
      gcTime: 10,
    })

    const subscriptionHandler = vi.fn()

    const unsubscribe = mutation.subscribe(subscriptionHandler)

    mutation.mutate('input')

    await vi.advanceTimersByTimeAsync(5)
    expect(queryClient.getMutationCache().findAll()).toHaveLength(1)

    mutation.reset()

    await vi.advanceTimersByTimeAsync(10)
    expect(queryClient.getMutationCache().findAll()).toHaveLength(0)

    unsubscribe()
  })

  it('changing mutation keys should reset the observer', async () => {
    const key = queryKey()
    const mutation = new MutationObserver(queryClient, {
      mutationKey: [...key, '1'],
      mutationFn: (text: string) => sleep(5).then(() => text),
    })

    const subscriptionHandler = vi.fn()

    const unsubscribe = mutation.subscribe(subscriptionHandler)

    mutation.mutate('input')

    await vi.advanceTimersByTimeAsync(5)
    expect(mutation.getCurrentResult()).toMatchObject({
      status: 'success',
      data: 'input',
    })

    mutation.setOptions({
      mutationKey: [...key, '2'],
    })

    expect(mutation.getCurrentResult()).toMatchObject({
      status: 'idle',
    })

    unsubscribe()
  })

  it('changing mutation keys should not affect already existing mutations', async () => {
    const key = queryKey()
    const mutationObserver = new MutationObserver(queryClient, {
      mutationKey: [...key, '1'],
      mutationFn: (text: string) => sleep(5).then(() => text),
    })

    const subscriptionHandler = vi.fn()

    const unsubscribe = mutationObserver.subscribe(subscriptionHandler)

    mutationObserver.mutate('input')

    await vi.advanceTimersByTimeAsync(5)
    expect(
      queryClient.getMutationCache().find({ mutationKey: [...key, '1'] }),
    ).toMatchObject({
      options: { mutationKey: [...key, '1'] },
      state: {
        status: 'success',
        data: 'input',
      },
    })

    mutationObserver.setOptions({
      mutationKey: [...key, '2'],
    })

    expect(
      queryClient.getMutationCache().find({ mutationKey: [...key, '1'] }),
    ).toMatchObject({
      options: { mutationKey: [...key, '1'] },
      state: {
        status: 'success',
        data: 'input',
      },
    })

    unsubscribe()
  })

  it('changing mutation meta should not affect successful mutations', async () => {
    const mutationObserver = new MutationObserver(queryClient, {
      meta: { a: 1 },
      mutationFn: (text: string) => sleep(5).then(() => text),
    })

    const subscriptionHandler = vi.fn()

    const unsubscribe = mutationObserver.subscribe(subscriptionHandler)

    mutationObserver.mutate('input')

    await vi.advanceTimersByTimeAsync(5)
    expect(queryClient.getMutationCache().find({})).toMatchObject({
      options: { meta: { a: 1 } },
      state: {
        status: 'success',
        data: 'input',
      },
    })

    mutationObserver.setOptions({
      meta: { a: 2 },
    })

    expect(queryClient.getMutationCache().find({})).toMatchObject({
      options: { meta: { a: 1 } },
      state: {
        status: 'success',
        data: 'input',
      },
    })

    unsubscribe()
  })

  it('mutation cache should have different meta when updated between mutations', async () => {
    const mutationFn = (text: string) => sleep(5).then(() => text)
    const mutationObserver = new MutationObserver(queryClient, {
      meta: { a: 1 },
      mutationFn,
    })

    const subscriptionHandler = vi.fn()

    const unsubscribe = mutationObserver.subscribe(subscriptionHandler)

    mutationObserver.mutate('input')
    await vi.advanceTimersByTimeAsync(5)

    mutationObserver.setOptions({
      meta: { a: 2 },
      mutationFn,
    })

    mutationObserver.mutate('input')
    await vi.advanceTimersByTimeAsync(5)

    const mutations = queryClient.getMutationCache().findAll()
    expect(mutations[0]).toMatchObject({
      options: { meta: { a: 1 } },
      state: {
        status: 'success',
        data: 'input',
      },
    })
    expect(mutations[1]).toMatchObject({
      options: { meta: { a: 2 } },
      state: {
        status: 'success',
        data: 'input',
      },
    })

    unsubscribe()
  })

  it('changing mutation meta should not affect rejected mutations', async () => {
    const mutationObserver = new MutationObserver(queryClient, {
      meta: { a: 1 },
      mutationFn: (_: string) =>
        sleep(5).then(() => Promise.reject(new Error('err'))),
    })

    const subscriptionHandler = vi.fn()

    const unsubscribe = mutationObserver.subscribe(subscriptionHandler)

    mutationObserver.mutate('input').catch(() => undefined)

    await vi.advanceTimersByTimeAsync(5)
    expect(queryClient.getMutationCache().find({})).toMatchObject({
      options: { meta: { a: 1 } },
      state: {
        status: 'error',
      },
    })

    mutationObserver.setOptions({
      meta: { a: 2 },
    })

    expect(queryClient.getMutationCache().find({})).toMatchObject({
      options: { meta: { a: 1 } },
      state: {
        status: 'error',
      },
    })

    unsubscribe()
  })

  it('changing mutation meta should affect pending mutations', async () => {
    const mutationObserver = new MutationObserver(queryClient, {
      meta: { a: 1 },
      mutationFn: (text: string) => sleep(20).then(() => text),
    })

    const subscriptionHandler = vi.fn()

    const unsubscribe = mutationObserver.subscribe(subscriptionHandler)

    mutationObserver.mutate('input')
    await vi.advanceTimersByTimeAsync(5)
    expect(queryClient.getMutationCache().find({})).toMatchObject({
      options: { meta: { a: 1 } },
      state: {
        status: 'pending',
      },
    })

    mutationObserver.setOptions({
      meta: { a: 2 },
    })

    expect(queryClient.getMutationCache().find({})).toMatchObject({
      options: { meta: { a: 2 } },
      state: {
        status: 'pending',
      },
    })

    unsubscribe()
  })

  it('mutation callbacks should be called in correct order with correct arguments for success case', async () => {
    const onSuccess = vi.fn()
    const onSettled = vi.fn()

    const mutationObserver = new MutationObserver(queryClient, {
      mutationFn: (text: string) => Promise.resolve(text.toUpperCase()),
    })

    const subscriptionHandler = vi.fn()
    const unsubscribe = mutationObserver.subscribe(subscriptionHandler)

    mutationObserver.mutate('success', {
      onSuccess,
      onSettled,
    })

    await vi.advanceTimersByTimeAsync(0)

    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledWith('SUCCESS', 'success', undefined, {
      client: queryClient,
      meta: undefined,
      mutationKey: undefined,
    })
    expect(onSettled).toHaveBeenCalledTimes(1)
    expect(onSettled).toHaveBeenCalledWith(
      'SUCCESS',
      null,
      'success',
      undefined,
      {
        client: queryClient,
        meta: undefined,
        mutationKey: undefined,
      },
    )

    unsubscribe()
  })

  it('mutation callbacks should be called in correct order with correct arguments for error case', async () => {
    const onError = vi.fn()
    const onSettled = vi.fn()

    const error = new Error('error')
    const mutationObserver = new MutationObserver(queryClient, {
      mutationFn: (_: string) => Promise.reject(error),
    })

    const subscriptionHandler = vi.fn()
    const unsubscribe = mutationObserver.subscribe(subscriptionHandler)

    mutationObserver
      .mutate('error', {
        onError,
        onSettled,
      })
      .catch(() => {})

    await vi.advanceTimersByTimeAsync(0)

    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith(error, 'error', undefined, {
      client: queryClient,
      meta: undefined,
      mutationKey: undefined,
    })
    expect(onSettled).toHaveBeenCalledTimes(1)
    expect(onSettled).toHaveBeenCalledWith(
      undefined,
      error,
      'error',
      undefined,
      {
        client: queryClient,
        meta: undefined,
        mutationKey: undefined,
      },
    )

    unsubscribe()
  })

  describe('nested mutate from per-call callbacks', () => {
    it('should call the outer mutate onSettled with the outer result when nested mutate starts from onSuccess', async () => {
      const outerOnSettled = vi.fn()
      const innerOnSettled = vi.fn()

      const mutationObserver = new MutationObserver(queryClient, {
        mutationFn: (text: string) => Promise.resolve(text),
      })
      const unsubscribe = mutationObserver.subscribe(vi.fn())

      mutationObserver.mutate('first', {
        onSuccess: () => {
          mutationObserver.mutate('second', {
            onSettled: innerOnSettled,
          })
        },
        onSettled: outerOnSettled,
      })

      await vi.advanceTimersByTimeAsync(0)

      expect(outerOnSettled).toHaveBeenCalledTimes(1)
      expect(outerOnSettled).toHaveBeenCalledWith(
        'first',
        null,
        'first',
        undefined,
        {
          client: queryClient,
          meta: undefined,
          mutationKey: undefined,
        },
      )
      expect(innerOnSettled).toHaveBeenCalledTimes(1)
      expect(innerOnSettled).toHaveBeenCalledWith(
        'second',
        null,
        'second',
        undefined,
        {
          client: queryClient,
          meta: undefined,
          mutationKey: undefined,
        },
      )
      expect(innerOnSettled).not.toHaveBeenCalledWith(
        'first',
        null,
        'first',
        undefined,
        {
          client: queryClient,
          meta: undefined,
          mutationKey: undefined,
        },
      )

      unsubscribe()
    })

    it('should not invoke the inner mutate onSettled with the outer result while the inner mutation is still pending', async () => {
      let resolveSecond: (value: string) => void
      const secondPromise = new Promise<string>((resolve) => {
        resolveSecond = resolve
      })
      const outerOnSettled = vi.fn()
      const innerOnSettled = vi.fn()

      const mutationObserver = new MutationObserver(queryClient, {
        mutationFn: (text: string) =>
          text === 'first' ? Promise.resolve(text) : secondPromise,
      })
      const unsubscribe = mutationObserver.subscribe(vi.fn())

      mutationObserver.mutate('first', {
        onSuccess: () => {
          mutationObserver.mutate('second', {
            onSettled: innerOnSettled,
          })
        },
        onSettled: outerOnSettled,
      })

      await vi.advanceTimersByTimeAsync(0)

      expect(outerOnSettled).toHaveBeenCalledTimes(1)
      expect(outerOnSettled).toHaveBeenCalledWith(
        'first',
        null,
        'first',
        undefined,
        {
          client: queryClient,
          meta: undefined,
          mutationKey: undefined,
        },
      )
      expect(innerOnSettled).not.toHaveBeenCalled()

      resolveSecond!('second')
      await vi.advanceTimersByTimeAsync(0)

      expect(innerOnSettled).toHaveBeenCalledTimes(1)
      expect(innerOnSettled).toHaveBeenCalledWith(
        'second',
        null,
        'second',
        undefined,
        {
          client: queryClient,
          meta: undefined,
          mutationKey: undefined,
        },
      )

      unsubscribe()
    })

    it('should call the outer mutate onSettled with the outer error when nested mutate starts from onError', async () => {
      const outerError = new Error('fail-first')
      const outerOnSettled = vi.fn()
      const innerOnSettled = vi.fn()

      const mutationObserver = new MutationObserver(queryClient, {
        mutationFn: (text: string) =>
          text === 'first' ? Promise.reject(outerError) : Promise.resolve(text),
      })
      const unsubscribe = mutationObserver.subscribe(vi.fn())

      mutationObserver
        .mutate('first', {
          onError: () => {
            mutationObserver.mutate('second', {
              onSettled: innerOnSettled,
            })
          },
          onSettled: outerOnSettled,
        })
        .catch(() => {})

      await vi.advanceTimersByTimeAsync(0)

      expect(outerOnSettled).toHaveBeenCalledTimes(1)
      expect(outerOnSettled).toHaveBeenCalledWith(
        undefined,
        outerError,
        'first',
        undefined,
        {
          client: queryClient,
          meta: undefined,
          mutationKey: undefined,
        },
      )
      expect(innerOnSettled).toHaveBeenCalledTimes(1)
      expect(innerOnSettled).toHaveBeenCalledWith(
        'second',
        null,
        'second',
        undefined,
        {
          client: queryClient,
          meta: undefined,
          mutationKey: undefined,
        },
      )
      expect(innerOnSettled).not.toHaveBeenCalledWith(
        undefined,
        outerError,
        'first',
        undefined,
        {
          client: queryClient,
          meta: undefined,
          mutationKey: undefined,
        },
      )

      unsubscribe()
    })

    it('should keep the outer onMutate result on the outer mutate onSettled when nested mutate starts from onSuccess', async () => {
      const outerOnSettled = vi.fn()
      const innerOnSettled = vi.fn()

      const mutationObserver = new MutationObserver(queryClient, {
        mutationFn: (text: string) => Promise.resolve(text),
        onMutate: (text: string) => ({ label: text }),
      })
      const unsubscribe = mutationObserver.subscribe(vi.fn())

      mutationObserver.mutate('first', {
        onSuccess: () => {
          mutationObserver.mutate('second', {
            onSettled: innerOnSettled,
          })
        },
        onSettled: outerOnSettled,
      })

      await vi.advanceTimersByTimeAsync(0)

      expect(outerOnSettled).toHaveBeenCalledWith(
        'first',
        null,
        'first',
        { label: 'first' },
        {
          client: queryClient,
          meta: undefined,
          mutationKey: undefined,
        },
      )
      expect(innerOnSettled).toHaveBeenCalledWith(
        'second',
        null,
        'second',
        { label: 'second' },
        {
          client: queryClient,
          meta: undefined,
          mutationKey: undefined,
        },
      )

      unsubscribe()
    })

    it('should not throw when nested mutate is called without options from onSuccess', async ({
      onTestFinished,
    }) => {
      const unhandledRejectionFn = vi.fn()
      process.on('unhandledRejection', unhandledRejectionFn)
      onTestFinished(() => {
        process.off('unhandledRejection', unhandledRejectionFn)
      })

      const outerOnSettled = vi.fn()
      const mutationObserver = new MutationObserver(queryClient, {
        mutationFn: (text: string) => Promise.resolve(text),
      })
      const unsubscribe = mutationObserver.subscribe(vi.fn())

      mutationObserver.mutate('first', {
        onSuccess: () => {
          mutationObserver.mutate('second')
        },
        onSettled: outerOnSettled,
      })

      await vi.advanceTimersByTimeAsync(0)

      expect(unhandledRejectionFn).not.toHaveBeenCalled()
      expect(outerOnSettled).toHaveBeenCalledTimes(1)
      expect(outerOnSettled).toHaveBeenCalledWith(
        'first',
        null,
        'first',
        undefined,
        {
          client: queryClient,
          meta: undefined,
          mutationKey: undefined,
        },
      )

      unsubscribe()
    })
  })

  describe('erroneous mutation callback', () => {
    it('onSuccess and onSettled is transferred to different execution context where it is reported', async ({
      onTestFinished,
    }) => {
      const unhandledRejectionFn = vi.fn()
      process.on('unhandledRejection', (error) => unhandledRejectionFn(error))
      onTestFinished(() => {
        process.off('unhandledRejection', unhandledRejectionFn)
      })

      const onSuccessError = new Error('onSuccess-error')
      const onSuccess = vi.fn(() => {
        throw onSuccessError
      })
      const onSettledError = new Error('onSettled-error')
      const onSettled = vi.fn(() => {
        throw onSettledError
      })

      const mutationObserver = new MutationObserver(queryClient, {
        mutationFn: (text: string) => Promise.resolve(text.toUpperCase()),
      })

      const subscriptionHandler = vi.fn()
      const unsubscribe = mutationObserver.subscribe(subscriptionHandler)

      mutationObserver.mutate('success', {
        onSuccess,
        onSettled,
      })

      await vi.advanceTimersByTimeAsync(0)

      expect(onSuccess).toHaveBeenCalledTimes(1)
      expect(onSettled).toHaveBeenCalledTimes(1)

      expect(unhandledRejectionFn).toHaveBeenCalledTimes(2)
      expect(unhandledRejectionFn).toHaveBeenNthCalledWith(1, onSuccessError)
      expect(unhandledRejectionFn).toHaveBeenNthCalledWith(2, onSettledError)

      expect(subscriptionHandler).toHaveBeenCalledTimes(2)

      unsubscribe()
    })

    it('onError and onSettled is transferred to different execution context where it is reported', async ({
      onTestFinished,
    }) => {
      const unhandledRejectionFn = vi.fn()
      process.on('unhandledRejection', (error) => unhandledRejectionFn(error))
      onTestFinished(() => {
        process.off('unhandledRejection', unhandledRejectionFn)
      })

      const onErrorError = new Error('onError-error')
      const onError = vi.fn(() => {
        throw onErrorError
      })
      const onSettledError = new Error('onSettled-error')
      const onSettled = vi.fn(() => {
        throw onSettledError
      })

      const error = new Error('error')
      const mutationObserver = new MutationObserver(queryClient, {
        mutationFn: (_: string) => Promise.reject(error),
      })

      const subscriptionHandler = vi.fn()
      const unsubscribe = mutationObserver.subscribe(subscriptionHandler)

      mutationObserver
        .mutate('error', {
          onError,
          onSettled,
        })
        .catch(() => {})

      await vi.advanceTimersByTimeAsync(0)

      expect(onError).toHaveBeenCalledTimes(1)
      expect(onSettled).toHaveBeenCalledTimes(1)

      expect(unhandledRejectionFn).toHaveBeenCalledTimes(2)
      expect(unhandledRejectionFn).toHaveBeenNthCalledWith(1, onErrorError)
      expect(unhandledRejectionFn).toHaveBeenNthCalledWith(2, onSettledError)

      expect(subscriptionHandler).toHaveBeenCalledTimes(2)

      unsubscribe()
    })
  })

  it('should not notify cache when setOptions is called with same options', () => {
    const mutationObserver = new MutationObserver(queryClient, {
      mutationFn: (text: string) => Promise.resolve(text),
    })

    const notifySpy = vi.spyOn(queryClient.getMutationCache(), 'notify')

    const unsubscribe = mutationObserver.subscribe(() => undefined)

    notifySpy.mockClear()

    // Call setOptions with the same options
    mutationObserver.setOptions({
      mutationFn: mutationObserver.options.mutationFn,
    })

    expect(notifySpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'observerOptionsUpdated' }),
    )

    unsubscribe()
  })
})
