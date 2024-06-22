import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { waitFor } from '@testing-library/react'
import { MutationObserver } from '../mutationObserver'
import { createQueryClient, executeMutation, queryKey, sleep } from './utils'
import type { MutationFunctionContext, QueryClient } from '..'
import type { MutationState } from '../mutation'

describe('mutations', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createQueryClient()
    queryClient.mount()
  })

  afterEach(() => {
    queryClient.clear()
  })

  test('mutate should accept null values', async () => {
    let variables

    const mutation = new MutationObserver(queryClient, {
      mutationFn: async (vars: unknown) => {
        variables = vars
        return vars
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
    expect(fn).toHaveBeenCalledWith('vars', expect.anything())
  })

  test('should provide context to mutationFn', async () => {
    const mutationKey = queryKey()
    const vars = 'vars' as const
    const meta = { a: 1 }
    const mutationFn = vi
      .fn<[typeof vars, MutationFunctionContext], Promise<'data'>>()
      .mockResolvedValue('data')

    const mutation = new MutationObserver(queryClient, {
      mutationKey,
      mutationFn,
      meta,
    })

    await mutation.mutate(vars)

    expect(mutationFn).toHaveBeenCalledTimes(1)
    const context = mutationFn.mock.calls[0]![1]
    expect(context).toBeDefined()
    expect(context.mutationKey).toEqual(mutationKey)
    expect(context.meta).toEqual(meta)
  })

  test('mutation should set correct success states', async () => {
    const mutation = new MutationObserver(queryClient, {
      mutationFn: async (text: string) => {
        await sleep(10)
        return text
      },
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

    await sleep(0)

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

    await sleep(5)

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

    await sleep(20)

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
      mutationFn: async (_: string) => {
        await sleep(20)
        return Promise.reject(new Error('err'))
      },
      onMutate: (text) => text,
      retry: 1,
      retryDelay: 1,
    })

    const states: Array<MutationState<string, unknown, string, string>> = []

    mutation.subscribe((state) => {
      states.push(state)
    })

    mutation.mutate('todo').catch(() => undefined)

    await sleep(0)

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

    await sleep(10)

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

    await sleep(20)

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

    await sleep(30)

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
      mutationFn: async (text: string) => text,
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

    await queryClient.resumePausedMutations()

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

  test('addObserver should not add an existing observer', async () => {
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

  test('mutate update the mutation state even without an active subscription', async () => {
    const onSuccess = vi.fn()
    const onSettled = vi.fn()

    const mutation = new MutationObserver(queryClient, {
      mutationFn: async () => {
        return 'update'
      },
    })

    await mutation.mutate(undefined, { onSuccess, onSettled })
    expect(mutation.getCurrentResult().data).toEqual('update')
    expect(onSuccess).not.toHaveBeenCalled()
    expect(onSettled).not.toHaveBeenCalled()
  })

  test('mutate update the mutation state even without an active subscription', async () => {
    const onSuccess = vi.fn()
    const onSettled = vi.fn()

    const mutation = new MutationObserver(queryClient, {
      mutationFn: async () => {
        return 'update'
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
      mutationFn: async () => {
        sleep(100)
        return 'update'
      },
      onSuccess: () => {
        onSuccess(1)
      },
    })

    void mutation.mutate()

    mutation.setOptions({
      mutationFn: async () => {
        sleep(100)
        return 'update'
      },
      onSuccess: () => {
        onSuccess(2)
      },
    })

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))

    expect(onSuccess).toHaveBeenCalledWith(2)
  })

  describe('scoped mutations', () => {
    test('mutations in the same scope should run in serial', async () => {
      const key1 = queryKey()
      const key2 = queryKey()

      const results: Array<string> = []

      const execute1 = executeMutation(
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

      const execute2 = executeMutation(
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

      await Promise.all([execute1, execute2])

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

    const execute1 = executeMutation(
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

    const execute2 = executeMutation(
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

    await Promise.all([execute1, execute2])

    expect(results).toStrictEqual([
      'start-A',
      'start-B',
      'finish-A',
      'finish-B',
    ])
  })

  test('each scope should run should run in parallel, serial within scope', async () => {
    const results: Array<string> = []

    const execute1 = executeMutation(
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

    const execute2 = executeMutation(
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

    const execute3 = executeMutation(
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

    const execute4 = executeMutation(
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

    await Promise.all([execute1, execute2, execute3, execute4])

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
})
