import { queryKey, sleep } from '@tanstack/query-test-utils'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { QueryClient } from '..'
import { MutationObserver } from '../mutationObserver'
import { executeMutation } from './utils'
import type { MutationState } from '../mutation'

describe('mutations', () => {
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

  test('mutate should accept null values', async () => {
    let variables

    const mutation = new MutationObserver(queryClient, {
      mutationFn: (vars: unknown) => {
        variables = vars
        return Promise.resolve(vars)
      },
    })

    await mutation.mutate(null)

    expect(variables).toBe(null)
  })

  test('setMutationDefaults should be able to set defaults', async () => {
    const key = queryKey()
    const fn = vi.fn()

    queryClient.setMutationDefaults(key, {
      mutationFn: fn,
    })

    await executeMutation(
      queryClient,
      {
        mutationKey: key,
      },
      'vars',
    )

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('vars')
  })

  test('mutation should set correct success states', async () => {
    const mutation = new MutationObserver(queryClient, {
      mutationFn: (text: string) => sleep(10).then(() => text),
      onMutate: (text) => text,
    })

    expect(mutation.getCurrentResult()).toEqual({
      context: undefined,
      data: undefined,
      error: null,
      failureCount: 0,
      failureReason: null,
      isError: false,
      isIdle: true,
      isPending: false,
      isPaused: false,
      isSuccess: false,
      mutate: expect.any(Function),
      reset: expect.any(Function),
      status: 'idle',
      variables: undefined,
      submittedAt: 0,
    })

    const states: Array<MutationState<string, unknown, string, string>> = []

    mutation.subscribe((state) => {
      states.push(state)
    })

    mutation.mutate('todo')

    await vi.advanceTimersByTimeAsync(0)

    expect(states[0]).toEqual({
      context: undefined,
      data: undefined,
      error: null,
      failureCount: 0,
      failureReason: null,
      isError: false,
      isIdle: false,
      isPending: true,
      isPaused: false,
      isSuccess: false,
      mutate: expect.any(Function),
      reset: expect.any(Function),
      status: 'pending',
      variables: 'todo',
      submittedAt: expect.any(Number),
    })

    await vi.advanceTimersByTimeAsync(5)

    expect(states[1]).toEqual({
      context: 'todo',
      data: undefined,
      error: null,
      failureCount: 0,
      failureReason: null,
      isError: false,
      isIdle: false,
      isPending: true,
      isPaused: false,
      isSuccess: false,
      mutate: expect.any(Function),
      reset: expect.any(Function),
      status: 'pending',
      variables: 'todo',
      submittedAt: expect.any(Number),
    })

    await vi.advanceTimersByTimeAsync(20)

    expect(states[2]).toEqual({
      context: 'todo',
      data: 'todo',
      error: null,
      failureCount: 0,
      failureReason: null,
      isError: false,
      isIdle: false,
      isPending: false,
      isPaused: false,
      isSuccess: true,
      mutate: expect.any(Function),
      reset: expect.any(Function),
      status: 'success',
      variables: 'todo',
      submittedAt: expect.any(Number),
    })
  })

  test('mutation should set correct error states', async () => {
    const mutation = new MutationObserver(queryClient, {
      mutationFn: (_: string) =>
        sleep(20).then(() => Promise.reject(new Error('err'))),
      onMutate: (text) => text,
      retry: 1,
      retryDelay: 1,
    })

    const states: Array<MutationState<string, unknown, string, string>> = []

    mutation.subscribe((state) => {
      states.push(state)
    })

    mutation.mutate('todo').catch(() => undefined)

    await vi.advanceTimersByTimeAsync(0)

    expect(states[0]).toEqual({
      context: undefined,
      data: undefined,
      error: null,
      failureCount: 0,
      failureReason: null,
      isError: false,
      isIdle: false,
      isPending: true,
      isPaused: false,
      isSuccess: false,
      mutate: expect.any(Function),
      reset: expect.any(Function),
      status: 'pending',
      variables: 'todo',
      submittedAt: expect.any(Number),
    })

    await vi.advanceTimersByTimeAsync(10)

    expect(states[1]).toEqual({
      context: 'todo',
      data: undefined,
      error: null,
      failureCount: 0,
      failureReason: null,
      isError: false,
      isIdle: false,
      isPending: true,
      isPaused: false,
      isSuccess: false,
      mutate: expect.any(Function),
      reset: expect.any(Function),
      status: 'pending',
      variables: 'todo',
      submittedAt: expect.any(Number),
    })

    await vi.advanceTimersByTimeAsync(20)

    expect(states[2]).toEqual({
      context: 'todo',
      data: undefined,
      error: null,
      failureCount: 1,
      failureReason: new Error('err'),
      isError: false,
      isIdle: false,
      isPending: true,
      isPaused: false,
      isSuccess: false,
      mutate: expect.any(Function),
      reset: expect.any(Function),
      status: 'pending',
      variables: 'todo',
      submittedAt: expect.any(Number),
    })

    await vi.advanceTimersByTimeAsync(30)

    expect(states[3]).toEqual({
      context: 'todo',
      data: undefined,
      error: new Error('err'),
      failureCount: 2,
      failureReason: new Error('err'),
      isError: true,
      isIdle: false,
      isPending: false,
      isPaused: false,
      isSuccess: false,
      mutate: expect.any(Function),
      reset: expect.any(Function),
      status: 'error',
      variables: 'todo',
      submittedAt: expect.any(Number),
    })
  })

  test('should be able to restore a mutation', async () => {
    const key = queryKey()

    const onMutate = vi.fn()
    const onSuccess = vi.fn()
    const onSettled = vi.fn()

    queryClient.setMutationDefaults(key, {
      mutationFn: (text: string) => sleep(10).then(() => text),
      onMutate,
      onSuccess,
      onSettled,
    })

    const mutation = queryClient
      .getMutationCache()
      .build<string, unknown, string, string>(
        queryClient,
        {
          mutationKey: key,
        },
        {
          context: 'todo',
          data: undefined,
          error: null,
          failureCount: 1,
          failureReason: 'err',
          isPaused: true,
          status: 'pending',
          variables: 'todo',
          submittedAt: 1,
        },
      )

    expect(mutation.state).toEqual({
      context: 'todo',
      data: undefined,
      error: null,
      failureCount: 1,
      failureReason: 'err',
      isPaused: true,
      status: 'pending',
      variables: 'todo',
      submittedAt: 1,
    })

    void queryClient.resumePausedMutations()
    await vi.advanceTimersByTimeAsync(0)

    // check that the mutation is correctly resumed
    expect(mutation.state).toEqual({
      context: 'todo',
      data: undefined,
      error: null,
      failureCount: 1,
      failureReason: 'err',
      isPaused: false,
      status: 'pending',
      variables: 'todo',
      submittedAt: 1,
    })

    await vi.advanceTimersByTimeAsync(20)

    expect(mutation.state).toEqual({
      context: 'todo',
      data: 'todo',
      error: null,
      failureCount: 0,
      failureReason: null,
      isPaused: false,
      status: 'success',
      variables: 'todo',
      submittedAt: 1,
    })

    expect(onMutate).not.toHaveBeenCalled()
    expect(onSuccess).toHaveBeenCalled()
    expect(onSettled).toHaveBeenCalled()
  })

  test('addObserver should not add an existing observer', () => {
    const mutationCache = queryClient.getMutationCache()
    const observer = new MutationObserver(queryClient, {})
    const currentMutation = mutationCache.build(queryClient, {})

    const fn = vi.fn()

    const unsubscribe = mutationCache.subscribe((event) => {
      fn(event.type)
    })

    currentMutation.addObserver(observer)
    currentMutation.addObserver(observer)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('observerAdded')

    unsubscribe()
  })

  test('mutate should throw an error if no mutationFn found', async () => {
    const mutation = new MutationObserver(queryClient, {
      mutationFn: undefined,
      retry: false,
    })

    let error: any
    try {
      await mutation.mutate()
    } catch (err) {
      error = err
    }
    expect(error).toEqual(new Error('No mutationFn found'))
  })

  test('mutate update the mutation state even without an active subscription 1', async () => {
    const onSuccess = vi.fn()
    const onSettled = vi.fn()

    const mutation = new MutationObserver(queryClient, {
      mutationFn: () => {
        return Promise.resolve('update')
      },
    })

    await mutation.mutate(undefined, { onSuccess, onSettled })
    expect(mutation.getCurrentResult().data).toEqual('update')
    expect(onSuccess).not.toHaveBeenCalled()
    expect(onSettled).not.toHaveBeenCalled()
  })

  test('mutate update the mutation state even without an active subscription 2', async () => {
    const onSuccess = vi.fn()
    const onSettled = vi.fn()

    const mutation = new MutationObserver(queryClient, {
      mutationFn: () => {
        return Promise.resolve('update')
      },
    })

    await mutation.mutate(undefined, { onSuccess, onSettled })
    expect(mutation.getCurrentResult().data).toEqual('update')
    expect(onSuccess).not.toHaveBeenCalled()
    expect(onSettled).not.toHaveBeenCalled()
  })

  test('mutation callbacks should see updated options', async () => {
    const onSuccess = vi.fn()

    const mutation = new MutationObserver(queryClient, {
      mutationFn: () => {
        sleep(100)
        return Promise.resolve('update')
      },
      onSuccess: () => {
        onSuccess(1)
      },
    })

    void mutation.mutate()

    mutation.setOptions({
      mutationFn: () => {
        sleep(100)
        return Promise.resolve('update')
      },
      onSuccess: () => {
        onSuccess(2)
      },
    })

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))

    expect(onSuccess).toHaveBeenCalledWith(2)
  })

  describe('scoped mutations', () => {
    test('mutations in the same scope should run in serial', async () => {
      const key1 = queryKey()
      const key2 = queryKey()

      const results: Array<string> = []

      executeMutation(
        queryClient,
        {
          mutationKey: key1,
          scope: {
            id: 'scope',
          },
          mutationFn: async () => {
            results.push('start-A')
            await sleep(10)
            results.push('finish-A')
            return 'a'
          },
        },
        'vars1',
      )

      expect(
        queryClient.getMutationCache().find({ mutationKey: key1 })?.state,
      ).toMatchObject({
        status: 'pending',
        isPaused: false,
      })

      executeMutation(
        queryClient,
        {
          mutationKey: key2,
          scope: {
            id: 'scope',
          },
          mutationFn: async () => {
            results.push('start-B')
            await sleep(10)
            results.push('finish-B')
            return 'b'
          },
        },
        'vars2',
      )

      expect(
        queryClient.getMutationCache().find({ mutationKey: key2 })?.state,
      ).toMatchObject({
        status: 'pending',
        isPaused: true,
      })

      await vi.runAllTimersAsync()

      expect(results).toStrictEqual([
        'start-A',
        'finish-A',
        'start-B',
        'finish-B',
      ])
    })
  })

  test('mutations without scope should run in parallel', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    const results: Array<string> = []

    executeMutation(
      queryClient,
      {
        mutationKey: key1,
        mutationFn: async () => {
          results.push('start-A')
          await sleep(10)
          results.push('finish-A')
          return 'a'
        },
      },
      'vars1',
    )

    executeMutation(
      queryClient,
      {
        mutationKey: key2,
        mutationFn: async () => {
          results.push('start-B')
          await sleep(10)
          results.push('finish-B')
          return 'b'
        },
      },
      'vars2',
    )

    await vi.runAllTimersAsync()

    expect(results).toStrictEqual([
      'start-A',
      'start-B',
      'finish-A',
      'finish-B',
    ])
  })

  test('each scope should run in parallel, serial within scope', async () => {
    const results: Array<string> = []

    executeMutation(
      queryClient,
      {
        scope: {
          id: '1',
        },
        mutationFn: async () => {
          results.push('start-A1')
          await sleep(10)
          results.push('finish-A1')
          return 'a'
        },
      },
      'vars1',
    )

    executeMutation(
      queryClient,
      {
        scope: {
          id: '1',
        },
        mutationFn: async () => {
          results.push('start-B1')
          await sleep(10)
          results.push('finish-B1')
          return 'b'
        },
      },
      'vars2',
    )

    executeMutation(
      queryClient,
      {
        scope: {
          id: '2',
        },
        mutationFn: async () => {
          results.push('start-A2')
          await sleep(10)
          results.push('finish-A2')
          return 'a'
        },
      },
      'vars1',
    )

    executeMutation(
      queryClient,
      {
        scope: {
          id: '2',
        },
        mutationFn: async () => {
          results.push('start-B2')
          await sleep(10)
          results.push('finish-B2')
          return 'b'
        },
      },
      'vars2',
    )

    await vi.runAllTimersAsync()

    expect(results).toStrictEqual([
      'start-A1',
      'start-A2',
      'finish-A1',
      'start-B1',
      'finish-A2',
      'start-B2',
      'finish-B1',
      'finish-B2',
    ])
  })

  describe('callback return types', () => {
    test('should handle all sync callback patterns', async () => {
      const key = queryKey()
      const results: Array<string> = []

      await executeMutation(
        queryClient,
        {
          mutationKey: key,
          mutationFn: () => Promise.resolve('success'),
          onMutate: () => {
            results.push('onMutate-sync')
            return { backup: 'data' } // onMutate can return context
          },
          onSuccess: () => {
            results.push('onSuccess-implicit-void')
            // Implicit void return
          },
          onError: () => {
            results.push('onError-explicit-void')
            return // Explicit void return
          },
          onSettled: () => {
            results.push('onSettled-return-value')
            return 'ignored-value' // Non-void return (should be ignored)
          },
        },
        'vars',
      )

      expect(results).toEqual([
        'onMutate-sync',
        'onSuccess-implicit-void',
        'onSettled-return-value',
      ])
    })

    test('should handle all async callback patterns', async () => {
      const key = queryKey()
      const results: Array<string> = []

      executeMutation(
        queryClient,
        {
          mutationKey: key,
          mutationFn: () => Promise.resolve('success'),
          onMutate: async () => {
            results.push('onMutate-async')
            await sleep(1)
            return { backup: 'async-data' }
          },
          onSuccess: async () => {
            results.push('onSuccess-async-start')
            await sleep(2)
            results.push('onSuccess-async-end')
            // Implicit void return from async
          },
          onSettled: () => {
            results.push('onSettled-promise')
            return Promise.resolve('also-ignored') // Promise<string> (should be ignored)
          },
        },
        'vars',
      )

      await vi.runAllTimersAsync()

      expect(results).toEqual([
        'onMutate-async',
        'onSuccess-async-start',
        'onSuccess-async-end',
        'onSettled-promise',
      ])
    })

    test('should handle Promise.all() and Promise.allSettled() patterns', async () => {
      const key = queryKey()
      const results: Array<string> = []

      executeMutation(
        queryClient,
        {
          mutationKey: key,
          mutationFn: () => Promise.resolve('success'),
          onSuccess: () => {
            results.push('onSuccess-start')
            return Promise.all([
              sleep(2).then(() => results.push('invalidate-queries')),
              sleep(1).then(() => results.push('track-analytics')),
            ])
          },
          onSettled: () => {
            results.push('onSettled-start')
            return Promise.allSettled([
              sleep(1).then(() => results.push('cleanup-1')),
              Promise.reject('error').catch(() =>
                results.push('cleanup-2-failed'),
              ),
            ])
          },
        },
        'vars',
      )

      await vi.runAllTimersAsync()

      expect(results).toEqual([
        'onSuccess-start',
        'track-analytics',
        'invalidate-queries',
        'onSettled-start',
        'cleanup-2-failed',
        'cleanup-1',
      ])
    })

    test('should handle mixed sync/async patterns and return value isolation', async () => {
      const key = queryKey()
      const results: Array<string> = []

      const mutationPromise = executeMutation(
        queryClient,
        {
          mutationKey: key,
          mutationFn: () => Promise.resolve('actual-result'),
          onMutate: () => {
            results.push('sync-onMutate')
            return { rollback: 'data' }
          },
          onSuccess: async () => {
            results.push('async-onSuccess')
            await sleep(1)
            return 'success-return-ignored'
          },
          onError: () => {
            results.push('sync-onError')
            return Promise.resolve('error-return-ignored')
          },
          onSettled: (_data, _error, _variables, context) => {
            results.push(`settled-context-${context?.rollback}`)
            return Promise.all([
              Promise.resolve('cleanup-1'),
              Promise.resolve('cleanup-2'),
            ])
          },
        },
        'vars',
      )

      await vi.runAllTimersAsync()

      const mutationResult = await mutationPromise

      // Verify mutation returns its own result, not callback returns
      expect(mutationResult).toBe('actual-result')
      console.log(results)
      expect(results).toEqual([
        'sync-onMutate',
        'async-onSuccess',
        'settled-context-data',
      ])
    })

    test('should handle error cases with all callback patterns', async () => {
      const key = queryKey()
      const results: Array<string> = []

      const newMutationError = new Error('mutation-error')
      let mutationError: Error | undefined
      executeMutation(
        queryClient,
        {
          mutationKey: key,
          mutationFn: () => Promise.reject(newMutationError),
          onMutate: () => {
            results.push('onMutate')
            return { backup: 'error-data' }
          },
          onSuccess: () => {
            results.push('onSuccess-should-not-run')
          },
          onError: async () => {
            results.push('onError-async')
            await sleep(1)
            // Test Promise.all() in error callback
            return Promise.all([
              sleep(1).then(() => results.push('error-cleanup-1')),
              sleep(2).then(() => results.push('error-cleanup-2')),
            ])
          },
          onSettled: (_data, _error, _variables, context) => {
            results.push(`settled-error-${context?.backup}`)
            return Promise.allSettled([
              Promise.resolve('settled-cleanup'),
              Promise.reject('settled-error'),
            ])
          },
        },
        'vars',
      ).catch((error) => {
        mutationError = error
      })

      await vi.runAllTimersAsync()

      expect(results).toEqual([
        'onMutate',
        'onError-async',
        'error-cleanup-1',
        'error-cleanup-2',
        'settled-error-error-data',
      ])

      expect(mutationError).toEqual(newMutationError)
    })
  })
})
