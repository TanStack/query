import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
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

    expect(subscription1Handler).toBeCalledTimes(1)
    expect(subscription2Handler).toBeCalledTimes(1)

    await vi.advanceTimersByTimeAsync(20)
    expect(subscription1Handler).toBeCalledTimes(1)
    expect(subscription2Handler).toBeCalledTimes(2)

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

    await vi.advanceTimersByTimeAsync(5)
    expect(queryClient.getMutationCache().findAll()).toHaveLength(1)

    unsubscribe()

    await vi.advanceTimersByTimeAsync(10)
    expect(queryClient.getMutationCache().findAll()).toHaveLength(0)
  })

  test('reset should remove observer to trigger GC', async () => {
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

  test('changing mutation keys should reset the observer', async () => {
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

  test('changing mutation keys should not affect already existing mutations', async () => {
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

  test('changing mutation meta should not affect successful mutations', async () => {
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

  test('should allow overriding scope in mutate call', async () => {
    const results: Array<string> = []

    const mutationObserver = new MutationObserver(queryClient, {
      mutationFn: async (text: string) => {
        results.push(`start-${text}`)
        await sleep(10)
        results.push(`finish-${text}`)
        return text
      },
      scope: {
        id: 'default-scope',
      },
    })

    const subscriptionHandler = vi.fn()
    const unsubscribe = mutationObserver.subscribe(subscriptionHandler)

    // First mutation with default scope
    mutationObserver.mutate('A')

    // Second mutation with overridden scope - should run in parallel
    mutationObserver.mutate('B', {
      scope: {
        id: 'override-scope',
      },
    })

    await vi.advanceTimersByTimeAsync(10)

    // Both should start at the same time since they have different scopes
    expect(results).toEqual([
      'start-A',
      'start-B',
      'finish-A',
      'finish-B',
    ])

    unsubscribe()
  })

  test('should use default scope when no override is provided', async () => {
    const results: Array<string> = []

    const mutationObserver = new MutationObserver(queryClient, {
      mutationFn: async (text: string) => {
        results.push(`start-${text}`)
        await sleep(10)
        results.push(`finish-${text}`)
        return text
      },
      scope: {
        id: 'default-scope',
      },
    })

    const subscriptionHandler = vi.fn()
    const unsubscribe = mutationObserver.subscribe(subscriptionHandler)

    // Both mutations use the default scope
    mutationObserver.mutate('A')
    mutationObserver.mutate('B')

    await vi.advanceTimersByTimeAsync(20)

    // They should run serially since they share the same scope
    expect(results).toEqual([
      'start-A',
      'finish-A',
      'start-B',
      'finish-B',
    ])

    unsubscribe()
  })

  test('should override to the same scope to force serial execution', async () => {
    const results: Array<string> = []

    // Create two separate observers without scope
    const mutationObserver1 = new MutationObserver(queryClient, {
      mutationFn: async (text: string) => {
        results.push(`start-${text}`)
        await sleep(10)
        results.push(`finish-${text}`)
        return text
      },
    })

    const mutationObserver2 = new MutationObserver(queryClient, {
      mutationFn: async (text: string) => {
        results.push(`start-${text}`)
        await sleep(10)
        results.push(`finish-${text}`)
        return text
      },
    })

    const subscriptionHandler1 = vi.fn()
    const subscriptionHandler2 = vi.fn()
    const unsubscribe1 = mutationObserver1.subscribe(subscriptionHandler1)
    const unsubscribe2 = mutationObserver2.subscribe(subscriptionHandler2)

    // Both mutations override to use the same scope
    mutationObserver1.mutate('A', {
      scope: {
        id: 'shared-scope',
      },
    })

    mutationObserver2.mutate('B', {
      scope: {
        id: 'shared-scope',
      },
    })

    await vi.advanceTimersByTimeAsync(20)

    // They should run serially since they share the same scope
    expect(results).toEqual([
      'start-A',
      'finish-A',
      'start-B',
      'finish-B',
    ])

    unsubscribe1()
    unsubscribe2()
  })

  test('mutate returns a promise that can be awaited (mutateAsync behavior)', async () => {
    const results: Array<string> = []

    const mutationObserver = new MutationObserver(queryClient, {
      mutationFn: async (text: string) => {
        results.push(`start-${text}`)
        await sleep(10)
        results.push(`finish-${text}`)
        return text.toUpperCase()
      },
      scope: {
        id: 'default-scope',
      },
    })

    const subscriptionHandler = vi.fn()
    const unsubscribe = mutationObserver.subscribe(subscriptionHandler)

    // mutate returns a promise, so it can be used like mutateAsync
    const promise1 = mutationObserver.mutate('first')
    const promise2 = mutationObserver.mutate('second', {
      scope: {
        id: 'override-scope',
      },
    })

    // Advance timers to let mutations complete
    await vi.advanceTimersByTimeAsync(10)

    // Both promises should resolve
    const [result1, result2] = await Promise.all([promise1, promise2])

    expect(result1).toBe('FIRST')
    expect(result2).toBe('SECOND')

    // Both should have started at the same time due to different scopes
    expect(results).toEqual([
      'start-first',
      'start-second',
      'finish-first',
      'finish-second',
    ])

    unsubscribe()
  })
})
