import { render } from '@testing-library/svelte'
import { flushSync } from 'svelte'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from 'vitest'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { QueryClient, createQuery, keepPreviousData } from '../../src/index.js'
import { promiseWithResolvers, withEffectRoot } from '../utils.svelte.js'
import IsRestoring from './IsRestoring.svelte'
import type { CreateQueryResult, QueryCache } from '../../src/index.js'

describe('createQuery', () => {
  let queryClient: QueryClient
  let queryCache: QueryCache

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
    queryCache = queryClient.getQueryCache()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  it(
    'should return the correct states for a successful query',
    withEffectRoot(async () => {
      const key = queryKey()
      const { promise, resolve } = promiseWithResolvers<string>()

      const query = createQuery<string, Error>(
        () => ({
          queryKey: key,
          queryFn: () => promise,
        }),
        () => queryClient,
      )

      if (query.isPending) {
        expectTypeOf(query.data).toEqualTypeOf<undefined>()
        expectTypeOf(query.error).toEqualTypeOf<null>()
      } else if (query.isLoadingError) {
        expectTypeOf(query.data).toEqualTypeOf<undefined>()
        expectTypeOf(query.error).toEqualTypeOf<Error>()
      } else {
        expectTypeOf(query.data).toEqualTypeOf<string>()
        expectTypeOf(query.error).toEqualTypeOf<Error | null>()
      }

      const promise1 = query.promise

      expect(query).toEqual({
        data: undefined,
        dataUpdatedAt: 0,
        error: null,
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        errorUpdateCount: 0,
        isEnabled: true,
        isError: false,
        isFetched: false,
        isFetchedAfterMount: false,
        isFetching: true,
        isPaused: false,
        isPending: true,
        isInitialLoading: true,
        isLoading: true,
        isLoadingError: false,
        isPlaceholderData: false,
        isRefetchError: false,
        isRefetching: false,
        isStale: true,
        isSuccess: false,
        refetch: expect.any(Function),
        status: 'pending',
        fetchStatus: 'fetching',
        promise: expect.any(Promise),
      })
      resolve('resolved')
      await vi.advanceTimersByTimeAsync(0)
      expect(query).toEqual({
        data: 'resolved',
        dataUpdatedAt: expect.any(Number),
        error: null,
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        errorUpdateCount: 0,
        isEnabled: true,
        isError: false,
        isFetched: true,
        isFetchedAfterMount: true,
        isFetching: false,
        isPaused: false,
        isPending: false,
        isInitialLoading: false,
        isLoading: false,
        isLoadingError: false,
        isPlaceholderData: false,
        isRefetchError: false,
        isRefetching: false,
        isStale: true,
        isSuccess: true,
        refetch: expect.any(Function),
        status: 'success',
        fetchStatus: 'idle',
        promise: expect.any(Promise),
      })

      expect(promise1).toBe(query.promise)
    }),
  )

  it(
    'should return the correct states for an unsuccessful query',
    withEffectRoot(async () => {
      const key = queryKey()
      let count = 0
      const states: Array<CreateQueryResult> = []
      const query = createQuery<string, Error>(
        () => ({
          queryKey: key,
          queryFn: () => {
            return Promise.reject(new Error('rejected #' + ++count))
          },
          retry: 1,
          retryDelay: 1,
        }),
        () => queryClient,
      )
      $effect(() => {
        states.push({ ...query })
      })

      await vi.advanceTimersByTimeAsync(1)
      await vi.advanceTimersByTimeAsync(0)
      expect(query.isError).toBe(true)

      expect(states[0]).toEqual({
        data: undefined,
        dataUpdatedAt: 0,
        error: null,
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        errorUpdateCount: 0,
        isEnabled: true,
        isError: false,
        isFetched: false,
        isFetchedAfterMount: false,
        isFetching: true,
        isPaused: false,
        isPending: true,
        isInitialLoading: true,
        isLoading: true,
        isLoadingError: false,
        isPlaceholderData: false,
        isRefetchError: false,
        isRefetching: false,
        isStale: true,
        isSuccess: false,
        refetch: expect.any(Function),
        status: 'pending',
        fetchStatus: 'fetching',
        promise: expect.any(Promise),
      })

      expect(states[1]).toEqual({
        data: undefined,
        dataUpdatedAt: 0,
        error: null,
        errorUpdatedAt: 0,
        failureCount: 1,
        failureReason: new Error('rejected #1'),
        errorUpdateCount: 0,
        isEnabled: true,
        isError: false,
        isFetched: false,
        isFetchedAfterMount: false,
        isFetching: true,
        isPaused: false,
        isPending: true,
        isInitialLoading: true,
        isLoading: true,
        isLoadingError: false,
        isPlaceholderData: false,
        isRefetchError: false,
        isRefetching: false,
        isStale: true,
        isSuccess: false,
        refetch: expect.any(Function),
        status: 'pending',
        fetchStatus: 'fetching',
        promise: expect.any(Promise),
      })

      expect(states[2]).toEqual({
        data: undefined,
        dataUpdatedAt: 0,
        error: new Error('rejected #2'),
        errorUpdatedAt: expect.any(Number),
        failureCount: 2,
        failureReason: new Error('rejected #2'),
        errorUpdateCount: 1,
        isEnabled: true,
        isError: true,
        isFetched: true,
        isFetchedAfterMount: true,
        isFetching: false,
        isPaused: false,
        isPending: false,
        isInitialLoading: false,
        isLoading: false,
        isLoadingError: true,
        isPlaceholderData: false,
        isRefetchError: false,
        isRefetching: false,
        isStale: true,
        isSuccess: false,
        refetch: expect.any(Function),
        status: 'error',
        fetchStatus: 'idle',
        promise: expect.any(Promise),
      })
    }),
  )

  it('should set isFetchedAfterMount to true after a query has been fetched', async () => {
    const key = queryKey()

    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => Promise.resolve('prefetched'),
    })

    await withEffectRoot(async () => {
      const { promise, resolve } = promiseWithResolvers<string>()

      const query = createQuery<string, Error>(
        () => ({
          queryKey: key,
          queryFn: () => promise,
        }),
        () => queryClient,
      )

      expect(query).toEqual(
        expect.objectContaining({
          data: 'prefetched',
          isFetched: true,
          isFetchedAfterMount: false,
        }),
      )
      resolve('resolved')
      await vi.advanceTimersByTimeAsync(0)
      expect(query).toEqual(
        expect.objectContaining({
          data: 'resolved',
          isFetched: true,
          isFetchedAfterMount: true,
        }),
      )
    })()
  })

  it(
    'should not cancel an ongoing fetch when refetch is called with cancelRefetch=false if we have data already',
    withEffectRoot(async () => {
      const key = queryKey()
      let fetchCount = 0

      const { promise, resolve } = promiseWithResolvers<string>()

      const { refetch } = createQuery<string, Error>(
        () => ({
          queryKey: key,
          queryFn: () => {
            fetchCount++
            return promise
          },
          enabled: false,
          initialData: 'initial',
        }),
        () => queryClient,
      )

      refetch()
      refetch({ cancelRefetch: false })

      resolve('resolved')
      await promise

      expect(fetchCount).toBe(1)
    }),
  )

  it(
    'should cancel an ongoing fetch when refetch is called (cancelRefetch=true) if we have data already',
    withEffectRoot(async () => {
      const key = queryKey()
      let fetchCount = 0

      const { promise, resolve } = promiseWithResolvers<string>()

      const query = createQuery<string, Error>(
        () => ({
          queryKey: key,
          queryFn: async () => {
            fetchCount++
            return promise
          },
          enabled: false,
          initialData: 'initialData',
        }),
        () => queryClient,
      )

      // Trigger two refetch close together
      query.refetch()
      query.refetch()

      resolve('resolved')
      await promise

      expect(fetchCount).toBe(2)
    }),
  )

  it(
    'should not cancel an ongoing fetch when refetch is called (cancelRefetch=true) if we do not have data yet',
    withEffectRoot(async () => {
      const key = queryKey()
      let fetchCount = 0

      const { promise, resolve } = promiseWithResolvers<string>()

      const query = createQuery<string, Error>(
        () => ({
          queryKey: key,
          queryFn: async () => {
            fetchCount++
            return promise
          },
          enabled: false,
        }),
        () => queryClient,
      )

      // Trigger two refetch close together
      query.refetch()
      query.refetch()

      resolve('resolved')
      await promise

      expect(fetchCount).toBe(1)
    }),
  )

  it(
    'should be able to watch a query without providing a query function',
    withEffectRoot(async () => {
      const key = queryKey()
      const states: Array<CreateQueryResult<string>> = []

      queryClient.setQueryDefaults(key, {
        queryFn: () => 'data',
      })

      const query = createQuery<string>(
        () => ({ queryKey: key }),
        () => queryClient,
      )

      $effect(() => {
        states.push({ ...query })
      })

      await vi.advanceTimersByTimeAsync(0)
      expect(query.data).toBe('data')

      expect(states.length).toBe(2)
      expect(states[0]).toMatchObject({ data: undefined })
      expect(states[1]).toMatchObject({ data: 'data' })
    }),
  )

  it('should pick up a query when re-mounting with gcTime 0', async () => {
    const key = queryKey()
    // this needs to be split into two different effect roots because
    // effects won't pick up dependencies created after the first `await`
    // -- the two roots effectively emulate two consecutive components being rendered
    await withEffectRoot(async () => {
      const { promise, resolve } = promiseWithResolvers<string>()

      const query = createQuery<string>(
        () => ({
          queryKey: key,
          queryFn: () => promise,
          gcTime: 0,
          notifyOnChangeProps: 'all',
        }),
        () => queryClient,
      )

      expect(query).toMatchObject({
        isPending: true,
        isSuccess: false,
        isFetching: true,
      })

      resolve('resolved: 1')
      await vi.advanceTimersByTimeAsync(0)
      expect(query.data).toBe('resolved: 1')

      expect(query).toMatchObject({
        isPending: false,
        isSuccess: true,
        isFetching: false,
      })
    })()

    await withEffectRoot(async () => {
      const { promise, resolve } = promiseWithResolvers<string>()

      const query = createQuery<string>(
        () => ({
          queryKey: key,
          queryFn: () => promise,
          gcTime: 0,
          notifyOnChangeProps: 'all',
        }),
        () => queryClient,
      )

      expect(query).toMatchObject({
        data: 'resolved: 1',
        isPending: false,
        isSuccess: true,
        isFetching: true,
      })

      resolve('resolved: 2')
      await vi.advanceTimersByTimeAsync(0)
      expect(query.data).toBe('resolved: 2')

      expect(query).toMatchObject({
        data: 'resolved: 2',
        isPending: false,
        isSuccess: true,
        isFetching: false,
      })
    })()
  })

  it('should not get into an infinite loop when removing a query with gcTime 0 and rerendering', async () => {
    const key = queryKey()
    const states: Array<CreateQueryResult<string>> = []

    // First mount: render the query and let it fetch
    await withEffectRoot(async () => {
      const query = createQuery<string>(
        () => ({
          queryKey: key,
          queryFn: () => Promise.resolve('data'),
          gcTime: 0,
          notifyOnChangeProps: ['isPending', 'isSuccess', 'data'],
        }),
        () => queryClient,
      )

      $effect(() => {
        states.push({ ...query })
      })

      await vi.advanceTimersByTimeAsync(0)
      expect(query.data).toBe('data')
    })()

    // Simulate rerender by removing the query and mounting again
    await withEffectRoot(async () => {
      queryClient.removeQueries({ queryKey: key })

      const query = createQuery<string>(
        () => ({
          queryKey: key,
          queryFn: () => Promise.resolve('data'),
          gcTime: 0,
          notifyOnChangeProps: ['isPending', 'isSuccess', 'data'],
        }),
        () => queryClient,
      )

      $effect(() => {
        states.push({ ...query })
      })

      await vi.advanceTimersByTimeAsync(0)
      expect(query.data).toBe('data')

      // Give it time to catch any accidental infinite updates
      await vi.advanceTimersByTimeAsync(100)
    })()

    expect(states.length).toBe(4)
    expect(states[0]).toMatchObject({
      isPending: true,
      isSuccess: false,
      data: undefined,
    })
    expect(states[1]).toMatchObject({
      isPending: false,
      isSuccess: true,
      data: 'data',
    })
    expect(states[2]).toMatchObject({
      isPending: true,
      isSuccess: false,
      data: undefined,
    })
    expect(states[3]).toMatchObject({
      isPending: false,
      isSuccess: true,
      data: 'data',
    })
  })

  it(
    'should fetch when refetchOnMount is false and nothing has been fetched yet',
    withEffectRoot(async () => {
      const key = queryKey()
      const states: Array<CreateQueryResult<string>> = []

      const query = createQuery<string>(
        () => ({
          queryKey: key,
          queryFn: () => 'test',
          refetchOnMount: false,
        }),
        () => queryClient,
      )

      $effect(() => {
        states.push({ ...query })
      })

      await vi.advanceTimersByTimeAsync(0)
      expect(query.data).toBe('test')

      expect(states.length).toBe(2)
      expect(states[0]).toMatchObject({ data: undefined })
      expect(states[1]).toMatchObject({ data: 'test' })
    }),
  )

  it(
    'should not fetch when refetchOnMount is false and data has been fetched already',
    withEffectRoot(async () => {
      const key = queryKey()
      const states: Array<CreateQueryResult<string>> = []

      queryClient.setQueryData(key, 'prefetched')

      const query = createQuery<string>(
        () => ({
          queryKey: key,
          queryFn: () => 'test',
          refetchOnMount: false,
        }),
        () => queryClient,
      )

      $effect(() => {
        states.push({ ...query })
      })

      await vi.advanceTimersByTimeAsync(0)
      expect(query.data).toBe('prefetched')

      expect(states.length).toBe(1)
      expect(states[0]).toMatchObject({ data: 'prefetched' })
    }),
  )

  it(
    'should be able to select a part of the data with select',
    withEffectRoot(async () => {
      const key = queryKey()
      const states: Array<CreateQueryResult<string>> = []

      const query = createQuery<{ name: string }, Error, string>(
        () => ({
          queryKey: key,
          queryFn: () => ({ name: 'test' }),
          select: (data) => data.name,
        }),
        () => queryClient,
      )

      $effect(() => {
        states.push({ ...query })
      })

      await vi.advanceTimersByTimeAsync(0)
      expect(query.data).toBe('test')

      expect(states.length).toBe(2)
      expect(states[0]).toMatchObject({ data: undefined })
      expect(states[1]).toMatchObject({ data: 'test' })
    }),
  )

  it(
    'should throw an error when a selector throws',
    withEffectRoot(async () => {
      const key = queryKey()
      const error = new Error('Select Error')
      const states: Array<CreateQueryResult<string>> = []

      const query = createQuery<{ name: string }, Error, string>(
        () => ({
          queryKey: key,
          queryFn: () => ({ name: 'test' }),
          select: () => {
            throw error
          },
        }),
        () => queryClient,
      )

      $effect(() => {
        states.push({ ...query })
      })

      await vi.advanceTimersByTimeAsync(0)
      expect(query.status).toBe('error')

      expect(states.length).toBe(2)
      expect(states[0]).toMatchObject({ status: 'pending', data: undefined })
      expect(states[1]).toMatchObject({ status: 'error', error })
    }),
  )

  it(
    'should be able to remove a query',
    withEffectRoot(async () => {
      const key = queryKey()
      const states: Array<CreateQueryResult<number>> = []
      let count = 0
      const query = createQuery<number>(
        () => ({
          queryKey: key,
          queryFn: () => ++count,
          notifyOnChangeProps: 'all',
        }),
        () => queryClient,
      )

      $effect(() => {
        states.push({ ...query })
      })

      await vi.advanceTimersByTimeAsync(0)
      expect(query.data).toBe(1)

      queryClient.removeQueries({ queryKey: key })
      query.refetch()

      await vi.advanceTimersByTimeAsync(0)
      expect(query.data).toBe(2)

      expect(states.length).toBe(4)
      expect(states[0]).toMatchObject({
        status: 'pending',
        data: undefined,
        dataUpdatedAt: 0,
      })
      expect(states[1]).toMatchObject({ status: 'success', data: 1 })
      expect(states[2]).toMatchObject({
        status: 'pending',
        data: undefined,
        dataUpdatedAt: 0,
      })
      expect(states[3]).toMatchObject({ status: 'success', data: 2 })
    }),
  )

  it(
    'keeps up-to-date with query key changes',
    withEffectRoot(async () => {
      const key = queryKey()
      let search = $state('')
      const states: Array<CreateQueryResult<string>> = []

      const query = createQuery(
        () => ({
          queryKey: [...key, search],
          queryFn: async () => Promise.resolve(search),
          placeholderData: keepPreviousData,
        }),
        () => queryClient,
      )

      $effect(() => {
        states.push({ ...query })
      })

      await vi.advanceTimersByTimeAsync(0)
      expect(query.data).toBe('')
      search = 'phone'
      await vi.advanceTimersByTimeAsync(0)
      expect(query.data).toBe('phone')

      expect(states.length).toBe(4)
      expect(states[0]).toMatchObject({
        status: 'pending',
        fetchStatus: 'fetching',
        data: undefined,
      })
      expect(states[1]).toMatchObject({
        status: 'success',
        fetchStatus: 'idle',
        data: '',
      })
      expect(states[2]).toMatchObject({
        status: 'success',
        fetchStatus: 'fetching',
        data: '',
      })
      expect(states[3]).toMatchObject({
        status: 'success',
        fetchStatus: 'idle',
        data: 'phone',
      })
    }),
  )

  it(
    'should create a new query when refetching a removed query',
    withEffectRoot(async () => {
      const key = queryKey()
      const states: Array<CreateQueryResult<number>> = []
      let count = 0

      const query = createQuery(
        () => ({
          queryKey: key,
          queryFn: () => Promise.resolve(++count),
        }),
        () => queryClient,
      )

      $effect(() => {
        states.push({ ...query })
      })

      await vi.advanceTimersByTimeAsync(0)
      expect(query.data).toBe(1)

      queryClient.removeQueries({ queryKey: key })
      query.refetch()
      await vi.advanceTimersByTimeAsync(0)
      expect(query.data).toBe(2)

      expect(states.length).toBe(4)
      // Initial
      expect(states[0]).toMatchObject({ data: undefined, dataUpdatedAt: 0 })
      // Fetched
      expect(states[1]).toMatchObject({ data: 1 })
      // Switch
      expect(states[2]).toMatchObject({ data: undefined, dataUpdatedAt: 0 })
      // Fetched
      expect(states[3]).toMatchObject({ data: 2 })
    }),
  )

  it(
    'should share equal data structures between query results',
    withEffectRoot(async () => {
      const key = queryKey()

      const result1 = [
        { id: '1', done: false },
        { id: '2', done: false },
      ]

      const result2 = [
        { id: '1', done: false },
        { id: '2', done: true },
      ]

      const states: Array<CreateQueryResult<typeof result1>> = []

      let count = 0

      const query = createQuery<typeof result1>(
        () => ({
          queryKey: key,
          queryFn: () => {
            count++
            return Promise.resolve(count === 1 ? result1 : result2)
          },
        }),
        () => queryClient,
      )

      $effect(() => {
        states.push({ ...query })
      })

      await vi.advanceTimersByTimeAsync(0)
      expect(query.data?.[1]?.done).toBe(false)
      query.refetch()
      await vi.advanceTimersByTimeAsync(0)
      expect(query.data?.[1]?.done).toBe(true)

      expect(states.length).toBe(4)

      const todos = states[1]?.data
      const todo1 = todos?.[0]
      const todo2 = todos?.[1]

      const newTodos = states[3]?.data
      const newTodo1 = newTodos?.[0]
      const newTodo2 = newTodos?.[1]

      expect(todos).toEqual(result1)
      expect(newTodos).toEqual(result2)
      expect(newTodos).not.toBe(todos)
      expect(newTodo1).toBe(todo1)
      expect(newTodo2).not.toBe(todo2)
    }),
  )

  it(
    'should use query function from hook when the existing query does not have a query function',
    withEffectRoot(async () => {
      const key = queryKey()

      queryClient.setQueryData(key, 'set')

      const query = createQuery(
        () => ({
          queryKey: key,
          queryFn: () => Promise.resolve('fetched'),
          initialData: 'initial',
          staleTime: Infinity,
        }),
        () => queryClient,
      )

      await vi.advanceTimersByTimeAsync(0)
      expect(query.data).toBe('set')
      queryClient.refetchQueries({ queryKey: key })
      await vi.advanceTimersByTimeAsync(0)
      expect(query.data).toBe('fetched')
    }),
  )

  it(
    'should update query stale state and refetch when invalidated with invalidateQueries',
    withEffectRoot(async () => {
      const key = queryKey()
      let count = 0

      const query = createQuery<number>(
        () => ({
          queryKey: key,
          queryFn: () => Promise.resolve(++count),
          staleTime: Infinity,
        }),
        () => queryClient,
      )

      await vi.advanceTimersByTimeAsync(0)
      expect(query).toEqual(
        expect.objectContaining({
          data: 1,
          isStale: false,
          isFetching: false,
        }),
      )
      queryClient.invalidateQueries({ queryKey: key })
      await vi.advanceTimersByTimeAsync(0)
      expect(query).toEqual(
        expect.objectContaining({
          data: 2,
          isStale: false,
          isFetching: false,
        }),
      )
    }),
  )

  it(
    'should not update disabled query when refetching with refetchQueries',
    withEffectRoot(async () => {
      const key = queryKey()
      const states: Array<CreateQueryResult<number>> = []
      let count = 0

      const query = createQuery<number>(
        () => ({
          queryKey: key,
          queryFn: () => Promise.resolve(++count),
          enabled: false,
        }),
        () => queryClient,
      )

      $effect(() => {
        states.push({ ...query })
      })

      await vi.advanceTimersByTimeAsync(0)

      expect(states.length).toBe(1)
      expect(states[0]).toMatchObject({
        data: undefined,
        isSuccess: false,
        isFetching: false,
        isStale: false,
      })
    }),
  )

  it(
    'should not refetch disabled query when invalidated with invalidateQueries',
    withEffectRoot(async () => {
      const key = queryKey()
      const states: Array<CreateQueryResult<number>> = []
      let count = 0

      const query = createQuery<number>(
        () => ({
          queryKey: key,
          queryFn: () => Promise.resolve(++count),
          enabled: false,
        }),
        () => queryClient,
      )

      $effect(() => {
        states.push({ ...query })
      })

      queryClient.invalidateQueries({ queryKey: key })

      // Wait long enough for the invalidation and potential refetch
      await vi.advanceTimersByTimeAsync(100)

      expect(states.length).toBe(1)
      expect(states[0]).toMatchObject({
        data: undefined,
        isFetching: false,
        isSuccess: false,
        isStale: false,
      })
    }),
  )

  it(
    'should not fetch when switching to a disabled query',
    withEffectRoot(async () => {
      const key = queryKey()
      const states: Array<CreateQueryResult<number>> = []
      let count = $state<number>(0)

      const query = createQuery<number>(
        () => ({
          queryKey: [...key, count],
          queryFn: () => Promise.resolve(count),
          enabled: count === 0,
        }),
        () => queryClient,
      )

      $effect(() => {
        states.push({ ...query })
      })

      await vi.advanceTimersByTimeAsync(0)
      expect(query.data).toBe(0)
      count = 1
      await vi.advanceTimersByTimeAsync(0)
      expect(states.length).toBe(3)

      // Fetch query
      expect(states[0]).toMatchObject({
        isFetching: true,
        isSuccess: false,
      })
      // Fetched query
      expect(states[1]).toMatchObject({
        data: 0,
        isFetching: false,
        isSuccess: true,
      })
      // Switch to disabled query
      expect(states[2]).toMatchObject({
        isFetching: false,
        isSuccess: false,
      })
    }),
  )

  it(
    'should keep the previous data when placeholderData is set',
    withEffectRoot(async () => {
      const key = queryKey()
      const states: Array<CreateQueryResult<number>> = []
      let count = $state(0)

      const query = createQuery<number>(
        () => ({
          queryKey: [...key, count],
          queryFn: () => Promise.resolve(count),
          placeholderData: keepPreviousData,
        }),
        () => queryClient,
      )

      $effect(() => {
        states.push({ ...query })
      })

      // Wait for the initial fetch to complete
      await vi.advanceTimersByTimeAsync(0)
      expect(query.data).toBe(0)

      // Update count to trigger a new fetch
      count = 1

      // Wait for all state updates to complete
      await vi.advanceTimersByTimeAsync(0)
      expect(states.length).toBe(4)

      // Initial
      expect(states[0]).toMatchObject({
        data: undefined,
        isFetching: true,
        isSuccess: false,
        isPlaceholderData: false,
      })
      // Fetched
      expect(states[1]).toMatchObject({
        data: 0,
        isFetching: false,
        isSuccess: true,
        isPlaceholderData: false,
      })
      // Set state
      expect(states[2]).toMatchObject({
        data: 0,
        isFetching: true,
        isSuccess: true,
        isPlaceholderData: true,
      })
      // New data
      expect(states[3]).toMatchObject({
        data: 1,
        isFetching: false,
        isSuccess: true,
        isPlaceholderData: false,
      })
    }),
  )

  it(
    'should not show initial data from next query if placeholderData is set',
    withEffectRoot(async () => {
      const key = queryKey()
      const states: Array<CreateQueryResult<number>> = []
      let count = $state<number>(0)

      const query = createQuery<number>(
        () => ({
          queryKey: [...key, count],
          queryFn: () => Promise.resolve(count),
          initialData: 99,
          placeholderData: keepPreviousData,
        }),
        () => queryClient,
      )

      $effect(() => {
        states.push({ ...query })
      })

      // Wait for the initial fetch to complete
      await vi.advanceTimersByTimeAsync(0)
      expect(query.data).toBe(0)

      // Update count to trigger a new fetch
      count = 1

      // Wait for the new fetch to complete
      await vi.advanceTimersByTimeAsync(0)
      expect(query.data).toBe(1)

      // Wait for all state updates to complete
      expect(states.length).toBe(4)

      // Initial
      expect(states[0]).toMatchObject({
        data: 99,
        isFetching: true,
        isSuccess: true,
        isPlaceholderData: false,
      })
      // Fetched
      expect(states[1]).toMatchObject({
        data: 0,
        isFetching: false,
        isSuccess: true,
        isPlaceholderData: false,
      })
      // Set state
      expect(states[2]).toMatchObject({
        data: 99,
        isFetching: true,
        isSuccess: true,
        isPlaceholderData: false,
      })
      // New data
      expect(states[3]).toMatchObject({
        data: 1,
        isFetching: false,
        isSuccess: true,
        isPlaceholderData: false,
      })
    }),
  )

  it(
    'should keep the previous data on disabled query when placeholderData is set and switching query key multiple times',
    withEffectRoot(async () => {
      const key = queryKey()
      const states: Array<CreateQueryResult<number>> = []

      // Set initial query data
      queryClient.setQueryData([...key, 10], 10)

      let count = $state(10)

      const query = createQuery<number>(
        () => ({
          queryKey: [...key, count],
          queryFn: () => Promise.resolve(count),
          enabled: false,
          placeholderData: keepPreviousData,
          notifyOnChangeProps: 'all',
        }),
        () => queryClient,
      )

      $effect(() => {
        states.push({ ...query })
      })

      // let that effect ^ run to push the initial state
      flushSync()
      flushSync(() => (count = 11))
      flushSync(() => (count = 12))
      query.refetch()
      // Wait for all operations to complete
      await vi.advanceTimersByTimeAsync(0)
      expect(query.data).toBe(12)

      // Disabled query
      expect(states[0]).toMatchObject({
        data: 10,
        isFetching: false,
        isSuccess: true,
        isPlaceholderData: false,
      })
      // Set state (11)
      expect(states[1]).toMatchObject({
        data: 10,
        isFetching: false,
        isSuccess: true,
        isPlaceholderData: true,
      })
      // Set state (12)
      expect(states[2]).toMatchObject({
        data: 10,
        isFetching: false,
        isSuccess: true,
        isPlaceholderData: true,
      })
      // Refetch
      expect(states[3]).toMatchObject({
        data: 10,
        isFetching: true,
        isSuccess: true,
        isPlaceholderData: true,
      })
      // Refetch done
      expect(states[4]).toMatchObject({
        data: 12,
        isFetching: false,
        isSuccess: true,
        isPlaceholderData: false,
      })
    }),
  )

  it(
    'should use the correct query function when components use different configurations',
    withEffectRoot(async () => {
      const key = queryKey()
      const states: Array<CreateQueryResult<number>> = []
      const { promise, resolve } = promiseWithResolvers<number>()

      // Simulate FirstComponent
      const firstQuery = createQuery<number>(
        () => ({
          queryKey: key,
          queryFn: () => promise,
        }),
        () => queryClient,
      )

      $effect(() => {
        states.push({ ...firstQuery })
      })

      // Simulate SecondComponent
      createQuery<number>(
        () => ({
          queryKey: key,
          queryFn: () => 2,
        }),
        () => queryClient,
      )

      // Resolve the first query
      resolve(1)

      // Wait for the first query to complete
      await vi.advanceTimersByTimeAsync(0)
      expect(firstQuery.data).toBe(1)

      // Refetch the first query
      firstQuery.refetch()

      // Wait for all state updates to complete
      await vi.advanceTimersByTimeAsync(0)
      expect(states.length).toBe(4)

      expect(states[0]).toMatchObject({
        data: undefined,
      })
      expect(states[1]).toMatchObject({
        data: 1,
      })
      expect(states[2]).toMatchObject({
        data: 1,
      })
      // This state should be 1 instead of 2
      expect(states[3]).toMatchObject({
        data: 1,
      })
    }),
  )

  it('should be able to set different stale times for a query', async () => {
    const key = queryKey()
    const states1: Array<CreateQueryResult<string>> = []
    const states2: Array<CreateQueryResult<string>> = []

    // Prefetch the query
    const prefetchPromise = queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'prefetch'),
    })
    await vi.advanceTimersByTimeAsync(10)
    await prefetchPromise

    expect(queryClient.getQueryState(key)?.data).toBe('prefetch')
    // Advance time so secondQuery (staleTime: 10) sees prefetched data as stale
    await vi.advanceTimersByTimeAsync(10)

    await withEffectRoot(async () => {
      const firstQuery = createQuery<string>(
        () => ({
          queryKey: key,
          queryFn: () => Promise.resolve('one'),
          staleTime: 100,
        }),
        () => queryClient,
      )

      $effect(() => {
        states1.push({ ...firstQuery })
      })

      const secondQuery = createQuery<string>(
        () => ({
          queryKey: key,
          queryFn: () => Promise.resolve('two'),
          staleTime: 10,
        }),
        () => queryClient,
      )

      $effect(() => {
        states2.push({ ...secondQuery })
      })

      // Wait for both staleTime to expire (100ms for firstQuery)
      await vi.advanceTimersByTimeAsync(101)
      expect(firstQuery).toMatchObject({ data: 'two', isStale: true })
      expect(secondQuery).toMatchObject({ data: 'two', isStale: true })

      expect(states1).toMatchObject([
        // First render
        {
          data: 'prefetch',
          isStale: false,
        },
        // Second createQuery started fetching
        {
          data: 'prefetch',
          isStale: false,
        },
        // Second createQuery data came in
        {
          data: 'two',
          isStale: false,
        },
        // Data became stale after 100ms
        {
          data: 'two',
          isStale: true,
        },
      ])

      expect(states2).toMatchObject([
        // First render, data is stale and starts fetching
        {
          data: 'prefetch',
          isStale: true,
        },
        // Second createQuery data came in
        {
          data: 'two',
          isStale: false,
        },
        // Data became stale after 10ms
        {
          data: 'two',
          isStale: true,
        },
      ])
    })()
  })

  it(
    'should re-render when a query becomes stale',
    withEffectRoot(async () => {
      const key = queryKey()
      const states: Array<CreateQueryResult<string>> = []

      const query = createQuery<string>(
        () => ({
          queryKey: key,
          queryFn: () => 'test',
          staleTime: 50,
        }),
        () => queryClient,
      )

      $effect(() => {
        states.push({ ...query })
      })

      // Wait for the query to become stale
      await vi.advanceTimersByTimeAsync(51)

      expect(states.length).toBe(3)
      expect(states[0]).toMatchObject({ isStale: true })
      expect(states[1]).toMatchObject({ isStale: false })
      expect(states[2]).toMatchObject({ isStale: true })
    }),
  )

  it(
    'should not re-render when it should only re-render on data changes and the data did not change',
    withEffectRoot(async () => {
      const key = queryKey()
      const states: Array<CreateQueryResult<string>> = []
      const { promise, resolve } = promiseWithResolvers<string>()

      const query = createQuery<string>(
        () => ({
          queryKey: key,
          queryFn: () => promise,
          notifyOnChangeProps: ['data'],
        }),
        () => queryClient,
      )

      $effect(() => {
        states.push({ ...query })
      })

      resolve('test')

      // Refetch the query
      setTimeout(() => {
        query.refetch()
      }, 10)

      await vi.advanceTimersByTimeAsync(10)
      expect(states.length).toBe(2)

      expect(states[0]).toMatchObject({
        data: undefined,
        status: 'pending',
        isFetching: true,
      })
      expect(states[1]).toMatchObject({
        data: 'test',
        status: 'success',
        isFetching: false,
      })
    }),
  )

  it(
    'should track properties and only re-render when a tracked property changes',
    withEffectRoot(async () => {
      const key = queryKey()
      const states: Array<string | undefined> = []
      const { promise, resolve } = promiseWithResolvers<string>()

      const query = createQuery<string>(
        () => ({
          queryKey: key,
          queryFn: () => promise,
        }),
        () => queryClient,
      )

      $effect(() => {
        states.push(query.data)
      })

      // Resolve the promise after a delay
      setTimeout(() => {
        resolve('test')
      }, 10)

      await vi.advanceTimersByTimeAsync(10)
      expect(query.data).toBe('test')

      // Refetch after data is available
      setTimeout(() => {
        if (query.data) {
          query.refetch()
        }
      }, 20)

      // Wait for refetch to complete
      await vi.advanceTimersByTimeAsync(20)

      expect(states.length).toBe(2)
      expect(states[0]).toBe(undefined)
      expect(states[1]).toBe('test')
    }),
  )

  it(
    'should always re-render if we are tracking props but not using any',
    withEffectRoot(async () => {
      const key = queryKey()
      let renderCount = 0
      const states: Array<CreateQueryResult<string>> = []

      const query = createQuery<string>(
        () => ({
          queryKey: key,
          queryFn: () => Promise.resolve('test'),
        }),
        () => queryClient,
      )

      $effect(() => {
        states.push({ ...query })
      })

      // Track changes to the query state
      $effect(() => {
        // @ts-expect-error
        const _ = { ...query }
        renderCount++
      })

      await vi.advanceTimersByTimeAsync(0)
      expect(query.data).toBe('test')

      expect(renderCount).toBe(2)
      expect(states.length).toBe(2)
      expect(states[0]).toMatchObject({ data: undefined })
      expect(states[1]).toMatchObject({ data: 'test' })
    }),
  )

  it(
    'should update query options',
    withEffectRoot(() => {
      const key = queryKey()

      const queryFn = () => sleep(10).then(() => 'data1')

      // Create two queries with the same key but different options
      createQuery(
        () => ({ queryKey: key, queryFn, retryDelay: 10 }),
        () => queryClient,
      )

      createQuery(
        () => ({ queryKey: key, queryFn, retryDelay: 20 }),
        () => queryClient,
      )

      // The last options should win
      expect(queryCache.find({ queryKey: key })!.options.retryDelay).toBe(20)
    }),
  )

  it(
    'should start with status pending, fetchStatus idle if enabled is false',
    withEffectRoot(async () => {
      const key1 = queryKey()
      const key2 = queryKey()
      const states1: Array<CreateQueryResult<string>> = []
      const states2: Array<CreateQueryResult<string>> = []

      const query1 = createQuery<string>(
        () => ({
          queryKey: key1,
          queryFn: () => 'data',
          enabled: false,
        }),
        () => queryClient,
      )

      const query2 = createQuery<string>(
        () => ({
          queryKey: key2,
          queryFn: () => 'data',
        }),
        () => queryClient,
      )

      $effect(() => {
        states1.push({ ...query1 })
      })

      $effect(() => {
        states2.push({ ...query2 })
      })

      // Check initial states
      expect(query1.status).toBe('pending')
      expect(query1.fetchStatus).toBe('idle')

      // Wait for second query to complete
      await vi.advanceTimersByTimeAsync(0)
      expect(query2.status).toBe('success')
      expect(query2.fetchStatus).toBe('idle')

      // Verify the state transitions for the second query
      expect(states2[0]?.status).toBe('pending')
      expect(states2[0]?.fetchStatus).toBe('fetching')
    }),
  )

  it(
    'should be in "pending" state by default',
    withEffectRoot(() => {
      const key = queryKey()

      const query = createQuery<string>(
        () => ({
          queryKey: key,
          queryFn: () => new Promise(() => {}),
        }),
        () => queryClient,
      )

      expect(query.status).toBe('pending')
    }),
  )

  it(
    'should not refetch query on focus when `enabled` is set to `false`',
    withEffectRoot(async () => {
      const key = queryKey()
      const queryFn = vi.fn().mockReturnValue('data')

      const query = createQuery<string>(
        () => ({
          queryKey: key,
          queryFn,
          enabled: false,
        }),
        () => queryClient,
      )

      // Wait a bit to ensure the query has time to settle
      await vi.advanceTimersByTimeAsync(10)

      // Simulate window focus
      window.dispatchEvent(new Event('visibilitychange'))

      // Wait a bit more to ensure no refetch happens
      await vi.advanceTimersByTimeAsync(10)

      // The query function should not have been called
      expect(queryFn).not.toHaveBeenCalled()

      // Data should be undefined since the query is disabled
      expect(query.data).toBeUndefined()
    }),
  )

  it(
    'should not refetch stale query on focus when `refetchOnWindowFocus` is set to `false`',
    withEffectRoot(async () => {
      const key = queryKey()
      const states: Array<CreateQueryResult<number>> = []
      let count = 0

      const query = createQuery<number>(
        () => ({
          queryKey: key,
          queryFn: () => count++,
          staleTime: 0,
          refetchOnWindowFocus: false,
        }),
        () => queryClient,
      )

      $effect(() => {
        states.push({ ...query })
      })

      // Wait for the initial fetch to complete
      await vi.advanceTimersByTimeAsync(0)
      expect(query.data).toBe(0)

      // Simulate window focus
      window.dispatchEvent(new Event('visibilitychange'))

      // Wait a bit to ensure no refetch happens
      await vi.advanceTimersByTimeAsync(10)

      // Should only have 2 states: initial and after fetch
      expect(states.length).toBe(2)
      expect(states[0]).toMatchObject({ data: undefined, isFetching: true })
      expect(states[1]).toMatchObject({ data: 0, isFetching: false })

      // Count should still be 0 since no refetch occurred
      expect(count).toBe(1)
    }),
  )

  it(
    'should not refetch stale query on focus when `refetchOnWindowFocus` is set to a function that returns `false`',
    withEffectRoot(async () => {
      const key = queryKey()
      const states: Array<CreateQueryResult<number>> = []
      let count = 0

      const query = createQuery<number>(
        () => ({
          queryKey: key,
          queryFn: () => count++,
          staleTime: 0,
          refetchOnWindowFocus: () => false,
        }),
        () => queryClient,
      )

      $effect(() => {
        states.push({ ...query })
      })

      // Wait for the initial fetch to complete
      await vi.advanceTimersByTimeAsync(0)
      expect(query.data).toBe(0)

      // Simulate window focus
      window.dispatchEvent(new Event('visibilitychange'))

      // Wait a bit to ensure no refetch happens
      await vi.advanceTimersByTimeAsync(10)

      // Should only have 2 states: initial and after fetch
      expect(states.length).toBe(2)
      expect(states[0]).toMatchObject({ data: undefined, isFetching: true })
      expect(states[1]).toMatchObject({ data: 0, isFetching: false })

      // Count should still be 0 since no refetch occurred
      expect(count).toBe(1)
    }),
  )

  it(
    'should not refetch fresh query on focus when `refetchOnWindowFocus` is set to `true`',
    withEffectRoot(async () => {
      const key = queryKey()
      const states: Array<CreateQueryResult<number>> = []
      let count = 0

      const query = createQuery<number>(
        () => ({
          queryKey: key,
          queryFn: () => count++,
          staleTime: Infinity,
          refetchOnWindowFocus: true,
        }),
        () => queryClient,
      )

      $effect(() => {
        states.push({ ...query })
      })

      // Wait for the initial fetch to complete
      await vi.advanceTimersByTimeAsync(0)
      expect(query.data).toBe(0)

      // Simulate window focus
      window.dispatchEvent(new Event('visibilitychange'))

      // Wait a bit to ensure no refetch happens
      await vi.advanceTimersByTimeAsync(10)

      // Should only have 2 states: initial and after fetch
      expect(states.length).toBe(2)
      expect(states[0]).toMatchObject({ data: undefined, isFetching: true })
      expect(states[1]).toMatchObject({ data: 0, isFetching: false })

      // Count should still be 0 since no refetch occurred
      expect(count).toBe(1)
    }),
  )

  it('should refetch fresh query when refetchOnMount is set to always', async () => {
    const key = queryKey()
    const states: Array<CreateQueryResult<string>> = []

    // Prefetch the query
    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => 'prefetched',
    })

    await withEffectRoot(async () => {
      const query = createQuery<string>(
        () => ({
          queryKey: key,
          queryFn: () => 'data',
          refetchOnMount: 'always',
          staleTime: Infinity,
        }),
        () => queryClient,
      )

      $effect(() => {
        states.push({ ...query })
      })

      // Wait for the refetch to complete
      await vi.advanceTimersByTimeAsync(0)
      expect(query.data).toBe('data')

      // Should have 2 states: initial (with prefetched data) and after refetch
      expect(states.length).toBe(2)
      expect(states[0]).toMatchObject({
        data: 'prefetched',
        isStale: false,
        isFetching: true,
      })
      expect(states[1]).toMatchObject({
        data: 'data',
        isStale: false,
        isFetching: false,
      })
    })()
  })

  it('should refetch stale query when refetchOnMount is set to true', async () => {
    const key = queryKey()
    const states: Array<CreateQueryResult<string>> = []

    // Prefetch the query
    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => 'prefetched',
    })

    await withEffectRoot(async () => {
      const query = createQuery<string>(
        () => ({
          queryKey: key,
          queryFn: () => 'data',
          refetchOnMount: true,
          staleTime: 0,
        }),
        () => queryClient,
      )

      $effect(() => {
        states.push({ ...query })
      })

      // Wait for the refetch to complete
      await vi.advanceTimersByTimeAsync(0)
      expect(query.data).toBe('data')

      // Should have 2 states: initial (with prefetched data) and after refetch
      expect(states.length).toBe(2)
      expect(states[0]).toMatchObject({
        data: 'prefetched',
        isStale: true,
        isFetching: true,
      })
      expect(states[1]).toMatchObject({
        data: 'data',
        isStale: true,
        isFetching: false,
      })
    })()
  })

  it(
    'should set status to error if queryFn throws',
    withEffectRoot(async () => {
      const key = queryKey()
      const consoleMock = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined)

      const query = createQuery<string, Error>(
        () => ({
          queryKey: key,
          queryFn: () => Promise.reject(new Error('Error test')),
          retry: false,
        }),
        () => queryClient,
      )

      await vi.advanceTimersByTimeAsync(0)
      expect(query.status).toBe('error')
      expect(query.error?.message).toBe('Error test')

      consoleMock.mockRestore()
    }),
  )

  it(
    'should set status to error instead of throwing when error should not be thrown',
    withEffectRoot(async () => {
      const key = queryKey()

      const query = createQuery<string, Error>(
        () => ({
          queryKey: key,
          queryFn: () => Promise.reject(new Error('Local Error')),
          retry: false,
          throwOnError: (err) => err.message !== 'Local Error',
        }),
        () => queryClient,
      )

      await vi.advanceTimersByTimeAsync(0)
      expect(query.status).toBe('error')
      expect(query.error?.message).toBe('Local Error')
    }),
  )

  it(
    'should support changing provided query client',
    withEffectRoot(() => {
      const queryClient1 = new QueryClient()
      const queryClient2 = new QueryClient()

      let currentClient = $state(queryClient1)

      const key = queryKey()

      createQuery(
        () => ({
          queryKey: key,
          queryFn: () => Promise.resolve('prefetched'),
        }),
        () => currentClient,
      )

      expect(queryClient1.getQueryCache().find({ queryKey: key })).toBeDefined()

      currentClient = queryClient2
      flushSync()

      expect(queryClient2.getQueryCache().find({ queryKey: key })).toBeDefined()
    }),
  )

  it('should not fetch for the duration of the restoring period when isRestoring is true', async () => {
    const queryFn = vi.fn(() => sleep(10).then(() => 'data'))

    const rendered = render(IsRestoring, {
      props: { queryClient, queryFn },
    })

    await vi.advanceTimersByTimeAsync(0)

    expect(rendered.getByTestId('status')).toHaveTextContent('pending')
    expect(rendered.getByTestId('fetchStatus')).toHaveTextContent('idle')
    expect(rendered.getByTestId('data')).toHaveTextContent('undefined')
    expect(queryFn).toHaveBeenCalledTimes(0)

    await vi.advanceTimersByTimeAsync(11)

    expect(rendered.getByTestId('status')).toHaveTextContent('pending')
    expect(rendered.getByTestId('fetchStatus')).toHaveTextContent('idle')
    expect(rendered.getByTestId('data')).toHaveTextContent('undefined')
    expect(queryFn).toHaveBeenCalledTimes(0)
  })
})
