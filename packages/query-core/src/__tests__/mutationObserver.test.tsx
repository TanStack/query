import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { MutationObserver } from '..'
import { createQueryClient, queryKey, sleep } from './utils'
import type { QueryClient } from '..'

describe('mutationObserver', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = createQueryClient()
    queryClient.mount()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  test('onUnsubscribe should not remove the current mutation observer if there is still a subscription', async () => {
    const mutation = new MutationObserver(queryClient, {
      mutationFn: (text: string) => sleep(20).then(() => text),
    })

    const subscription1Handler = vi.fn()
    const subscription2Handler = vi.fn()

    const unsubscribe1 = mutation.subscribe(subscription1Handler)
    const unsubscribe2 = mutation.subscribe(subscription2Handler)

    mutation.mutate('input')

    unsubscribe1()

    await vi.waitFor(() => {
      // 1 call: loading
      expect(subscription1Handler).toBeCalledTimes(1)
      // 2 calls: loading, success
      expect(subscription2Handler).toBeCalledTimes(2)
    })

    // Clean-up
    unsubscribe2()
  })

  test('unsubscribe should remove observer to trigger GC', async () => {
    const mutation = new MutationObserver(queryClient, {
      mutationFn: (text: string) => sleep(5).then(() => text),
      gcTime: 10,
    })

    const subscriptionHandler = vi.fn()

    const unsubscribe = mutation.subscribe(subscriptionHandler)

    mutation.mutate('input')
    await vi.waitFor(() =>
      expect(queryClient.getMutationCache().findAll()).toHaveLength(1),
    )

    unsubscribe()

    await vi.waitFor(() =>
      expect(queryClient.getMutationCache().findAll()).toHaveLength(0),
    )
  })

  test('reset should remove observer to trigger GC', async () => {
    const mutation = new MutationObserver(queryClient, {
      mutationFn: (text: string) => sleep(5).then(() => text),
      gcTime: 10,
    })

    const subscriptionHandler = vi.fn()

    const unsubscribe = mutation.subscribe(subscriptionHandler)

    mutation.mutate('input')
    await vi.waitFor(() =>
      expect(queryClient.getMutationCache().findAll()).toHaveLength(1),
    )

    mutation.reset()

    await vi.waitFor(() =>
      expect(queryClient.getMutationCache().findAll()).toHaveLength(0),
    )

    unsubscribe()
  })

  test('changing mutation keys should reset the observer', async () => {
    const key = queryKey()
    const mutation = new MutationObserver(queryClient, {
      mutationKey: [...key, '1'],
      mutationFn: (text: string) => sleep(5).then(() => text),
    })

    const subscriptionHandler = vi.fn()

    const unsubscribe = mutation.subscribe(subscriptionHandler)

    mutation.mutate('input')

    await vi.waitFor(() =>
      expect(mutation.getCurrentResult()).toMatchObject({
        status: 'success',
        data: 'input',
      }),
    )

    mutation.setOptions({
      mutationKey: [...key, '2'],
    })

    expect(mutation.getCurrentResult()).toMatchObject({
      status: 'idle',
    })

    unsubscribe()
  })

  test('changing mutation keys should not affect already existing mutations', async () => {
    const key = queryKey()
    const mutationObserver = new MutationObserver(queryClient, {
      mutationKey: [...key, '1'],
      mutationFn: (text: string) => sleep(5).then(() => text),
    })

    const subscriptionHandler = vi.fn()

    const unsubscribe = mutationObserver.subscribe(subscriptionHandler)

    mutationObserver.mutate('input')

    await vi.waitFor(() =>
      expect(
        queryClient.getMutationCache().find({ mutationKey: [...key, '1'] }),
      ).toMatchObject({
        options: { mutationKey: [...key, '1'] },
        state: {
          status: 'success',
          data: 'input',
        },
      }),
    )

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

  test('changing mutation meta should not affect successful mutations', async () => {
    const mutationObserver = new MutationObserver(queryClient, {
      meta: { a: 1 },
      mutationFn: (text: string) => sleep(5).then(() => text),
    })

    const subscriptionHandler = vi.fn()

    const unsubscribe = mutationObserver.subscribe(subscriptionHandler)

    mutationObserver.mutate('input')

    await vi.waitFor(() =>
      expect(queryClient.getMutationCache().find({})).toMatchObject({
        options: { meta: { a: 1 } },
        state: {
          status: 'success',
          data: 'input',
        },
      }),
    )

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

  test('mutation cache should have different meta when updated between mutations', async () => {
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

  test('changing mutation meta should not affect rejected mutations', async () => {
    const mutationObserver = new MutationObserver(queryClient, {
      meta: { a: 1 },
      mutationFn: (_: string) =>
        sleep(5).then(() => Promise.reject(new Error('err'))),
    })

    const subscriptionHandler = vi.fn()

    const unsubscribe = mutationObserver.subscribe(subscriptionHandler)

    mutationObserver.mutate('input').catch(() => undefined)
    await vi.waitFor(() =>
      expect(queryClient.getMutationCache().find({})).toMatchObject({
        options: { meta: { a: 1 } },
        state: {
          status: 'error',
        },
      }),
    )

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

  test('changing mutation meta should affect pending mutations', async () => {
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

  test('mutation callbacks should be called in correct order with correct arguments for success case', async () => {
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
    expect(onSuccess).toHaveBeenCalledWith('SUCCESS', 'success', undefined)
    expect(onSettled).toHaveBeenCalledTimes(1)
    expect(onSettled).toHaveBeenCalledWith(
      'SUCCESS',
      null,
      'success',
      undefined,
    )

    unsubscribe()
  })

  test('mutation callbacks should be called in correct order with correct arguments for error case', async () => {
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
    expect(onError).toHaveBeenCalledWith(error, 'error', undefined)
    expect(onSettled).toHaveBeenCalledTimes(1)
    expect(onSettled).toHaveBeenCalledWith(undefined, error, 'error', undefined)

    unsubscribe()
  })
})
