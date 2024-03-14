import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { waitFor } from '@testing-library/react'
import { MutationObserver } from '..'
import { createQueryClient, queryKey, sleep } from './utils'
import type { QueryClient } from '..'

describe('mutationObserver', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createQueryClient()
    queryClient.mount()
  })

  afterEach(() => {
    queryClient.clear()
  })

  test('onUnsubscribe should not remove the current mutation observer if there is still a subscription', async () => {
    const mutation = new MutationObserver(queryClient, {
      mutationFn: async (text: string) => {
        await sleep(20)
        return text
      },
    })

    const subscription1Handler = vi.fn()
    const subscription2Handler = vi.fn()

    const unsubscribe1 = mutation.subscribe(subscription1Handler)
    const unsubscribe2 = mutation.subscribe(subscription2Handler)

    mutation.mutate('input')

    unsubscribe1()

    await waitFor(() => {
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
      mutationFn: async (text: string) => {
        await sleep(5)
        return text
      },
      gcTime: 10,
    })

    const subscriptionHandler = vi.fn()

    const unsubscribe = mutation.subscribe(subscriptionHandler)

    await mutation.mutate('input')

    expect(queryClient.getMutationCache().findAll()).toHaveLength(1)

    unsubscribe()

    await waitFor(() =>
      expect(queryClient.getMutationCache().findAll()).toHaveLength(0),
    )
  })

  test('reset should remove observer to trigger GC', async () => {
    const mutation = new MutationObserver(queryClient, {
      mutationFn: async (text: string) => {
        await sleep(5)
        return text
      },
      gcTime: 10,
    })

    const subscriptionHandler = vi.fn()

    const unsubscribe = mutation.subscribe(subscriptionHandler)

    await mutation.mutate('input')

    expect(queryClient.getMutationCache().findAll()).toHaveLength(1)

    mutation.reset()

    await waitFor(() =>
      expect(queryClient.getMutationCache().findAll()).toHaveLength(0),
    )

    unsubscribe()
  })

  test('changing mutation keys should reset the observer', async () => {
    const key = queryKey()
    const mutation = new MutationObserver(queryClient, {
      mutationKey: [...key, '1'],
      mutationFn: async (text: string) => {
        await sleep(5)
        return text
      },
    })

    const subscriptionHandler = vi.fn()

    const unsubscribe = mutation.subscribe(subscriptionHandler)

    await mutation.mutate('input')

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

  test('changing mutation keys should not affect already existing mutations', async () => {
    const key = queryKey()
    const mutationObserver = new MutationObserver(queryClient, {
      mutationKey: [...key, '1'],
      mutationFn: async (text: string) => {
        await sleep(5)
        return text
      },
    })

    const subscriptionHandler = vi.fn()

    const unsubscribe = mutationObserver.subscribe(subscriptionHandler)

    await mutationObserver.mutate('input')

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

  test('changing mutation meta should not affect successful mutations', async () => {
    const mutationObserver = new MutationObserver(queryClient, {
      meta: { a: 1 },
      mutationFn: async (text: string) => {
        await sleep(5)
        return text
      },
    })

    const subscriptionHandler = vi.fn()

    const unsubscribe = mutationObserver.subscribe(subscriptionHandler)

    await mutationObserver.mutate('input')

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

  test('mutation cache should have different meta when updated between mutations', async () => {
    const mutationFn = async (text: string) => {
      await sleep(5)
      return text
    }
    const mutationObserver = new MutationObserver(queryClient, {
      meta: { a: 1 },
      mutationFn,
    })

    const subscriptionHandler = vi.fn()

    const unsubscribe = mutationObserver.subscribe(subscriptionHandler)

    await mutationObserver.mutate('input')

    mutationObserver.setOptions({
      meta: { a: 2 },
      mutationFn,
    })

    await mutationObserver.mutate('input')

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
      mutationFn: async (_: string) => {
        await sleep(5)
        return Promise.reject(new Error('err'))
      },
    })

    const subscriptionHandler = vi.fn()

    const unsubscribe = mutationObserver.subscribe(subscriptionHandler)

    await mutationObserver.mutate('input').catch(() => undefined)

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

  test('changing mutation meta should affect pending mutations', async () => {
    const mutationObserver = new MutationObserver(queryClient, {
      meta: { a: 1 },
      mutationFn: async (text: string) => {
        await sleep(20)
        return text
      },
    })

    const subscriptionHandler = vi.fn()

    const unsubscribe = mutationObserver.subscribe(subscriptionHandler)

    mutationObserver.mutate('input')

    await sleep(0)

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
})
