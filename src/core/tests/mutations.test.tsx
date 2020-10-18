import { QueryCache, Environment } from '../..'
import { mockConsoleError, queryKey, sleep } from '../../react/tests/utils'
import { runMutation } from '../api'
import { MutationState } from '../mutation'
import { MutationCache } from '../mutationCache'
import { MutationObserver } from '../mutationObserver'

describe('mutations', () => {
  const queryCache = new QueryCache()
  const mutationCache = new MutationCache()
  const environment = new Environment({ queryCache, mutationCache })
  environment.mount()

  test('mutate should trigger a mutation', async () => {
    const result = await runMutation(environment, {
      mutationFn: async (text: string) => text,
      variables: 'todo',
    })

    expect(result).toBe(result)
  })

  test('setMutationDefaults should be able to set defaults', async () => {
    const key = queryKey()

    environment.setMutationDefaults(key, {
      mutationFn: async (text: string) => text,
    })

    const result = await runMutation(environment, {
      mutationKey: key,
      variables: 'todo',
    })

    expect(result).toBe(result)
  })

  test('mutation should set correct success states', async () => {
    const mutation = new MutationObserver(environment, {
      mutationFn: async (text: string) => {
        await sleep(10)
        return text
      },
      onMutate: text => text,
      variables: 'todo',
    })

    expect(mutation.getCurrentResult()).toEqual({
      context: undefined,
      data: undefined,
      error: null,
      failureCount: 0,
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

    mutation.subscribe(state => {
      states.push(state)
    })

    mutation.mutate()

    await sleep(0)

    expect(states[0]).toEqual({
      context: undefined,
      data: undefined,
      error: null,
      failureCount: 0,
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
    const consoleMock = mockConsoleError()

    const mutation = new MutationObserver(environment, {
      mutationFn: async () => {
        await sleep(20)
        return Promise.reject('err')
      },
      onMutate: text => text,
      variables: 'todo',
      retry: 1,
      retryDelay: 1,
    })

    const states: MutationState<string, unknown, string, string>[] = []

    mutation.subscribe(state => {
      states.push(state)
    })

    mutation.mutate().catch(() => undefined)

    await sleep(0)

    expect(states[0]).toEqual({
      context: undefined,
      data: undefined,
      error: null,
      failureCount: 0,
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

    consoleMock.mockRestore()
  })

  test('should be able to restore a mutation', async () => {
    const key = queryKey()

    const onMutate = jest.fn()
    const onSuccess = jest.fn()
    const onSettled = jest.fn()

    environment.setMutationDefaults(key, {
      mutationFn: async (text: string) => text,
      onMutate,
      onSuccess,
      onSettled,
    })

    const mutation = environment
      .getMutationCache()
      .build<string, unknown, string, string>(
        environment,
        {
          mutationKey: key,
        },
        {
          context: 'todo',
          data: undefined,
          error: null,
          failureCount: 1,
          isPaused: true,
          status: 'loading',
          variables: 'todo',
        }
      )

    expect(mutation.state).toEqual({
      context: 'todo',
      data: undefined,
      error: null,
      failureCount: 1,
      isPaused: true,
      status: 'loading',
      variables: 'todo',
    })

    await environment.getMutationCache().continueMutations()

    expect(mutation.state).toEqual({
      context: 'todo',
      data: 'todo',
      error: null,
      failureCount: 1,
      isPaused: false,
      status: 'success',
      variables: 'todo',
    })

    expect(onMutate).not.toHaveBeenCalled()
    expect(onSuccess).toHaveBeenCalled()
    expect(onSettled).toHaveBeenCalled()
  })
})
