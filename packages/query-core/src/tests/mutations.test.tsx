import { waitFor } from '@testing-library/react'
import { MutationObserver } from '../mutationObserver'
import { createQueryClient, executeMutation, queryKey, sleep } from './utils'
import type { QueryClient } from '..'
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

  test('mutate should trigger a mutation', async () => {
    const result = await executeMutation(queryClient, {
      mutationFn: async (text: string) => text,
      variables: 'todo',
    })

    expect(result).toBe(result)
  })

  test('mutate should accept null values', async () => {
    let variables

    const mutation = new MutationObserver(queryClient, {
      mutationFn: async (vars: unknown) => {
        variables = vars
        return vars
      },
    })

    mutation.mutate(null)

    await sleep(10)

    expect(variables).toBe(null)
  })

  test('setMutationDefaults should be able to set defaults', async () => {
    const key = queryKey()

    queryClient.setMutationDefaults(key, {
      mutationFn: async (text: string) => text,
    })

    const result = await executeMutation(queryClient, {
      mutationKey: key,
      variables: 'todo',
    })

    expect(result).toBe(result)
  })

  test('mutation should set correct success states', async () => {
    const mutation = new MutationObserver(queryClient, {
      mutationFn: async (text: string) => {
        await sleep(10)
        return text
      },
      onMutate: (text) => text,
      variables: 'todo',
    })

    expect(mutation.getCurrentResult()).toEqual({
      context: undefined,
      data: undefined,
      error: null,
      failureCount: 0,
      failureReason: null,
      isError: false,
      isIdle: true,
      isLoading: false,
      isPaused: false,
      isSuccess: false,
      mutate: expect.any(Function),
      reset: expect.any(Function),
      status: 'idle',
      variables: undefined,
    })

    const states: MutationState<string, unknown, string, string>[] = []

    mutation.subscribe((state) => {
      states.push(state)
    })

    mutation.mutate()

    await sleep(0)

    expect(states[0]).toEqual({
      context: undefined,
      data: undefined,
      error: null,
      failureCount: 0,
      failureReason: null,
      isError: false,
      isIdle: false,
      isLoading: true,
      isPaused: false,
      isSuccess: false,
      mutate: expect.any(Function),
      reset: expect.any(Function),
      status: 'loading',
      variables: 'todo',
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
      isLoading: true,
      isPaused: false,
      isSuccess: false,
      mutate: expect.any(Function),
      reset: expect.any(Function),
      status: 'loading',
      variables: 'todo',
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
      isLoading: false,
      isPaused: false,
      isSuccess: true,
      mutate: expect.any(Function),
      reset: expect.any(Function),
      status: 'success',
      variables: 'todo',
    })
  })

  test('mutation should set correct error states', async () => {
    const mutation = new MutationObserver(queryClient, {
      mutationFn: async () => {
        await sleep(20)
        return Promise.reject('err')
      },
      onMutate: (text) => text,
      variables: 'todo',
      retry: 1,
      retryDelay: 1,
    })

    const states: MutationState<string, unknown, string, string>[] = []

    mutation.subscribe((state) => {
      states.push(state)
    })

    mutation.mutate().catch(() => undefined)

    await sleep(0)

    expect(states[0]).toEqual({
      context: undefined,
      data: undefined,
      error: null,
      failureCount: 0,
      failureReason: null,
      isError: false,
      isIdle: false,
      isLoading: true,
      isPaused: false,
      isSuccess: false,
      mutate: expect.any(Function),
      reset: expect.any(Function),
      status: 'loading',
      variables: 'todo',
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
      isLoading: true,
      isPaused: false,
      isSuccess: false,
      mutate: expect.any(Function),
      reset: expect.any(Function),
      status: 'loading',
      variables: 'todo',
    })

    await sleep(20)

    expect(states[2]).toEqual({
      context: 'todo',
      data: undefined,
      error: null,
      failureCount: 1,
      failureReason: 'err',
      isError: false,
      isIdle: false,
      isLoading: true,
      isPaused: false,
      isSuccess: false,
      mutate: expect.any(Function),
      reset: expect.any(Function),
      status: 'loading',
      variables: 'todo',
    })

    await sleep(30)

    expect(states[3]).toEqual({
      context: 'todo',
      data: undefined,
      error: 'err',
      failureCount: 2,
      failureReason: 'err',
      isError: true,
      isIdle: false,
      isLoading: false,
      isPaused: false,
      isSuccess: false,
      mutate: expect.any(Function),
      reset: expect.any(Function),
      status: 'error',
      variables: 'todo',
    })
  })

  test('should be able to restore a mutation', async () => {
    const key = queryKey()

    const onMutate = jest.fn()
    const onSuccess = jest.fn()
    const onSettled = jest.fn()

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
          status: 'loading',
          variables: 'todo',
        },
      )

    expect(mutation.state).toEqual({
      context: 'todo',
      data: undefined,
      error: null,
      failureCount: 1,
      failureReason: 'err',
      isPaused: true,
      status: 'loading',
      variables: 'todo',
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
    })

    expect(onMutate).not.toHaveBeenCalled()
    expect(onSuccess).toHaveBeenCalled()
    expect(onSettled).toHaveBeenCalled()
  })

  test('addObserver should not add an existing observer', async () => {
    const mutationCache = queryClient.getMutationCache()
    const observer = new MutationObserver(queryClient, {})
    const currentMutation = mutationCache.build(queryClient, {})

    const fn = jest.fn()

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
    expect(error).toEqual('No mutationFn found')
  })

  test('mutate update the mutation state even without an active subscription', async () => {
    const onSuccess = jest.fn()
    const onSettled = jest.fn()

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
    const onSuccess = jest.fn()

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
})
