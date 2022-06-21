import { QueryClient } from '..'
import {
  createQueryClient,
  executeMutation,
  queryKey,
  sleep,
} from '../../../../tests/utils'
import { MutationState } from '../mutation'
import { MutationObserver } from '../mutationObserver'

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
      isPaused: true,
      status: 'loading',
      variables: 'todo',
    })

    await queryClient.resumePausedMutations()

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

  test('setState should update the mutation state', async () => {
    const mutation = new MutationObserver(queryClient, {
      mutationFn: async () => {
        return 'update'
      },
      onMutate: (text) => text,
    })
    await mutation.mutate()
    expect(mutation.getCurrentResult().data).toEqual('update')

    // Force setState usage
    // because no use case has been found using mutation.setState
    const currentMutation = mutation['currentMutation']
    currentMutation?.setState({
      context: undefined,
      variables: undefined,
      data: 'new',
      error: undefined,
      failureCount: 0,
      isPaused: false,
      status: 'success',
    })

    expect(mutation.getCurrentResult().data).toEqual('new')
  })

  test('addObserver should not add an existing observer', async () => {
    const mutation = new MutationObserver(queryClient, {
      mutationFn: async () => {
        return 'update'
      },
      onMutate: (text) => text,
    })
    await mutation.mutate()

    // Force addObserver usage to add an existing observer
    // because no use case has been found
    const currentMutation = mutation['currentMutation']!
    expect(currentMutation['observers'].length).toEqual(1)
    currentMutation.addObserver(mutation)

    expect(currentMutation['observers'].length).toEqual(1)
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
})
