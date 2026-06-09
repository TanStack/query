import { fireEvent, render } from '@testing-library/svelte'
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
import Base from './Base.svelte'
import Counter from './Counter.svelte'
import IsRestoring from './IsRestoring.svelte'
import Select from './Select.svelte'
import TwoQueries from './TwoQueries.svelte'
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

    const { promise, resolve } = promiseWithResolvers<string>()

    const rendered = render(Base, {
      props: {
        queryClient,
        options: () => ({
          queryKey: key,
          queryFn: () => promise,
        }),
      },
    })

    expect(rendered.getByTestId('data')).toHaveTextContent('prefetched')
    expect(rendered.getByTestId('isFetched')).toHaveTextContent('true')
    expect(rendered.getByTestId('isFetchedAfterMount')).toHaveTextContent(
      'false',
    )

    resolve('resolved')
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByTestId('data')).toHaveTextContent('resolved')
    expect(rendered.getByTestId('isFetched')).toHaveTextContent('true')
    expect(rendered.getByTestId('isFetchedAfterMount')).toHaveTextContent(
      'true',
    )
  })

  it('should not cancel an ongoing fetch when refetch is called with cancelRefetch=false if we have data already', async () => {
    const key = queryKey()
    let fetchCount = 0

    const { promise, resolve } = promiseWithResolvers<string>()

    const rendered = render(Base, {
      props: {
        queryClient,
        options: () => ({
          queryKey: key,
          queryFn: () => {
            fetchCount++
            return promise
          },
          enabled: false,
          initialData: 'initial',
        }),
      },
    })

    fireEvent.click(rendered.getByRole('button', { name: /^refetch$/i }))
    fireEvent.click(
      rendered.getByRole('button', { name: /refetch no cancel/i }),
    )

    resolve('resolved')
    await promise

    expect(fetchCount).toBe(1)
  })

  it('should cancel an ongoing fetch when refetch is called (cancelRefetch=true) if we have data already', async () => {
    const key = queryKey()
    let fetchCount = 0

    const { promise, resolve } = promiseWithResolvers<string>()

    const rendered = render(Base, {
      props: {
        queryClient,
        options: () => ({
          queryKey: key,
          queryFn: () => {
            fetchCount++
            return promise
          },
          enabled: false,
          initialData: 'initialData',
        }),
      },
    })

    // Trigger two refetch close together
    fireEvent.click(rendered.getByRole('button', { name: /^refetch$/i }))
    fireEvent.click(rendered.getByRole('button', { name: /^refetch$/i }))

    resolve('resolved')
    await promise

    expect(fetchCount).toBe(2)
  })

  it('should not cancel an ongoing fetch when refetch is called (cancelRefetch=true) if we do not have data yet', async () => {
    const key = queryKey()
    let fetchCount = 0

    const { promise, resolve } = promiseWithResolvers<string>()

    const rendered = render(Base, {
      props: {
        queryClient,
        options: () => ({
          queryKey: key,
          queryFn: () => {
            fetchCount++
            return promise
          },
          enabled: false,
        }),
      },
    })

    // Trigger two refetch close together
    fireEvent.click(rendered.getByRole('button', { name: /^refetch$/i }))
    fireEvent.click(rendered.getByRole('button', { name: /^refetch$/i }))

    resolve('resolved')
    await promise

    expect(fetchCount).toBe(1)
  })

  it('should be able to watch a query without providing a query function', async () => {
    const key = queryKey()

    queryClient.setQueryDefaults(key, {
      queryFn: () => 'data',
    })

    const rendered = render(Base, {
      props: {
        queryClient,
        options: () => ({ queryKey: key }),
      },
    })

    expect(rendered.getByTestId('data')).toHaveTextContent('undefined')

    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByTestId('data')).toHaveTextContent('data')
  })

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

  it('should fetch when refetchOnMount is false and nothing has been fetched yet', async () => {
    const key = queryKey()
    const queryFn = vi.fn(() => 'test')

    const rendered = render(Base, {
      props: {
        queryClient,
        options: () => ({
          queryKey: key,
          queryFn,
          refetchOnMount: false,
        }),
      },
    })

    expect(rendered.getByTestId('data')).toHaveTextContent('undefined')

    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByTestId('data')).toHaveTextContent('test')
    // queryFn should be called since nothing has been fetched yet
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should not fetch when refetchOnMount is false and data has been fetched already', async () => {
    const key = queryKey()
    const queryFn = vi.fn(() => 'test')

    queryClient.setQueryData(key, 'prefetched')

    const rendered = render(Base, {
      props: {
        queryClient,
        options: () => ({
          queryKey: key,
          queryFn,
          refetchOnMount: false,
        }),
      },
    })

    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByTestId('data')).toHaveTextContent('prefetched')
    // queryFn should not be called since data was already fetched
    expect(queryFn).not.toHaveBeenCalled()
  })

  it('should be able to select a part of the data with select', async () => {
    const key = queryKey()

    const rendered = render(Select, {
      props: {
        queryClient,
        options: () => ({
          queryKey: key,
          queryFn: () => ({ name: 'test' }),
          select: (data: { name: string }) => data.name,
        }),
      },
    })

    expect(rendered.getByTestId('data')).toHaveTextContent('undefined')

    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByTestId('data')).toHaveTextContent('test')
  })

  it('should throw an error when a selector throws', async () => {
    const key = queryKey()
    const error = new Error('Select Error')

    const rendered = render(Select, {
      props: {
        queryClient,
        options: () => ({
          queryKey: key,
          queryFn: () => ({ name: 'test' }),
          select: () => {
            throw error
          },
        }),
      },
    })

    expect(rendered.getByTestId('status')).toHaveTextContent('pending')

    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByTestId('status')).toHaveTextContent('error')
    expect(rendered.getByTestId('error')).toHaveTextContent('Select Error')
  })

  it('should be able to remove a query', async () => {
    const key = queryKey()
    let count = 0

    const rendered = render(Base, {
      props: {
        queryClient,
        options: () => ({
          queryKey: key,
          queryFn: () => ++count,
          notifyOnChangeProps: 'all',
        }),
      },
    })

    // Initial: pending
    expect(rendered.getByTestId('status')).toHaveTextContent('pending')
    expect(rendered.getByTestId('data')).toHaveTextContent('undefined')

    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByTestId('status')).toHaveTextContent('success')
    expect(rendered.getByTestId('data')).toHaveTextContent('1')

    // Remove the query, then refetch — it should reset to pending first
    queryClient.removeQueries({ queryKey: key })
    fireEvent.click(rendered.getByRole('button', { name: /^refetch$/i }))
    expect(rendered.getByTestId('status')).toHaveTextContent('pending')
    expect(rendered.getByTestId('data')).toHaveTextContent('undefined')
    expect(rendered.getByTestId('dataUpdatedAt')).toHaveTextContent('0')

    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByTestId('status')).toHaveTextContent('success')
    expect(rendered.getByTestId('data')).toHaveTextContent('2')
  })

  it('keeps up-to-date with query key changes', async () => {
    const key = queryKey()

    const rendered = render(Counter, {
      props: {
        queryClient,
        options: (count: number) => ({
          queryKey: [...key, count],
          queryFn: () => sleep(10).then(() => count),
          placeholderData: keepPreviousData,
        }),
      },
    })

    // Initial fetch
    expect(rendered.getByTestId('status')).toHaveTextContent('pending')
    expect(rendered.getByTestId('fetchStatus')).toHaveTextContent('fetching')
    expect(rendered.getByTestId('data')).toHaveTextContent('undefined')

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByTestId('status')).toHaveTextContent('success')
    expect(rendered.getByTestId('fetchStatus')).toHaveTextContent('idle')
    expect(rendered.getByTestId('data')).toHaveTextContent('0')

    // Change the key — previous data is kept while the new key fetches
    fireEvent.click(rendered.getByRole('button', { name: /increment/i }))
    expect(rendered.getByTestId('status')).toHaveTextContent('success')
    expect(rendered.getByTestId('fetchStatus')).toHaveTextContent('fetching')
    expect(rendered.getByTestId('data')).toHaveTextContent('0')

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByTestId('status')).toHaveTextContent('success')
    expect(rendered.getByTestId('fetchStatus')).toHaveTextContent('idle')
    expect(rendered.getByTestId('data')).toHaveTextContent('1')
  })

  it('should create a new query when refetching a removed query', async () => {
    const key = queryKey()
    let count = 0

    const rendered = render(Base, {
      props: {
        queryClient,
        options: () => ({
          queryKey: key,
          queryFn: () => sleep(10).then(() => ++count),
        }),
      },
    })

    // Initial
    expect(rendered.getByTestId('data')).toHaveTextContent('undefined')

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByTestId('data')).toHaveTextContent('1')

    // Remove the query, then refetch — a new query starts from scratch
    queryClient.removeQueries({ queryKey: key })
    fireEvent.click(rendered.getByRole('button', { name: /^refetch$/i }))
    expect(rendered.getByTestId('data')).toHaveTextContent('undefined')
    expect(rendered.getByTestId('dataUpdatedAt')).toHaveTextContent('0')

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByTestId('data')).toHaveTextContent('2')
  })

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

  it('should use query function from hook when the existing query does not have a query function', async () => {
    const key = queryKey()

    queryClient.setQueryData(key, 'set')

    const rendered = render(Base, {
      props: {
        queryClient,
        options: () => ({
          queryKey: key,
          queryFn: () => sleep(10).then(() => 'fetched'),
          initialData: 'initial',
          staleTime: Infinity,
        }),
      },
    })

    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByTestId('data')).toHaveTextContent('set')
    queryClient.refetchQueries({ queryKey: key })
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByTestId('data')).toHaveTextContent('fetched')
  })

  it('should update query stale state and refetch when invalidated with invalidateQueries', async () => {
    const key = queryKey()
    let count = 0

    const rendered = render(Base, {
      props: {
        queryClient,
        options: () => ({
          queryKey: key,
          queryFn: () => sleep(10).then(() => ++count),
          staleTime: Infinity,
        }),
      },
    })

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByTestId('data')).toHaveTextContent('1')
    expect(rendered.getByTestId('isStale')).toHaveTextContent('false')
    expect(rendered.getByTestId('isFetching')).toHaveTextContent('false')

    queryClient.invalidateQueries({ queryKey: key })
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByTestId('data')).toHaveTextContent('2')
    expect(rendered.getByTestId('isStale')).toHaveTextContent('false')
    expect(rendered.getByTestId('isFetching')).toHaveTextContent('false')
  })

  it('should not update disabled query when refetching with refetchQueries', async () => {
    const key = queryKey()
    const queryFn = vi.fn(() => sleep(10).then(() => 1))

    const rendered = render(Base, {
      props: {
        queryClient,
        options: () => ({
          queryKey: key,
          queryFn,
          enabled: false,
        }),
      },
    })

    await vi.advanceTimersByTimeAsync(0)

    // Disabled query never fetches
    expect(queryFn).not.toHaveBeenCalled()
    expect(rendered.getByTestId('data')).toHaveTextContent('undefined')
    expect(rendered.getByTestId('isSuccess')).toHaveTextContent('false')
    expect(rendered.getByTestId('isFetching')).toHaveTextContent('false')
    expect(rendered.getByTestId('isStale')).toHaveTextContent('false')
  })

  it('should not refetch disabled query when invalidated with invalidateQueries', async () => {
    const key = queryKey()
    const queryFn = vi.fn(() => sleep(10).then(() => 1))

    const rendered = render(Base, {
      props: {
        queryClient,
        options: () => ({
          queryKey: key,
          queryFn,
          enabled: false,
        }),
      },
    })

    queryClient.invalidateQueries({ queryKey: key })

    // Wait long enough for the invalidation and potential refetch
    await vi.advanceTimersByTimeAsync(100)

    // Disabled query does not fetch on invalidation
    expect(queryFn).not.toHaveBeenCalled()
    expect(rendered.getByTestId('data')).toHaveTextContent('undefined')
    expect(rendered.getByTestId('isFetching')).toHaveTextContent('false')
    expect(rendered.getByTestId('isSuccess')).toHaveTextContent('false')
    expect(rendered.getByTestId('isStale')).toHaveTextContent('false')
  })

  it('should not fetch when switching to a disabled query', async () => {
    const key = queryKey()

    const rendered = render(Counter, {
      props: {
        queryClient,
        options: (count: number) => ({
          queryKey: [...key, count],
          queryFn: () => sleep(10).then(() => count),
          enabled: count === 0,
        }),
      },
    })

    // Enabled query fetches
    expect(rendered.getByTestId('isFetching')).toHaveTextContent('true')
    expect(rendered.getByTestId('isSuccess')).toHaveTextContent('false')

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByTestId('data')).toHaveTextContent('0')
    expect(rendered.getByTestId('isFetching')).toHaveTextContent('false')
    expect(rendered.getByTestId('isSuccess')).toHaveTextContent('true')

    // Switch to a disabled query — it should not fetch
    fireEvent.click(rendered.getByRole('button', { name: /increment/i }))
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByTestId('isFetching')).toHaveTextContent('false')
    expect(rendered.getByTestId('isSuccess')).toHaveTextContent('false')
  })

  it('should keep the previous data when placeholderData is set', async () => {
    const key = queryKey()

    const rendered = render(Counter, {
      props: {
        queryClient,
        options: (count: number) => ({
          queryKey: [...key, count],
          queryFn: () => sleep(10).then(() => count),
          placeholderData: keepPreviousData,
        }),
      },
    })

    // Initial fetch
    expect(rendered.getByTestId('data')).toHaveTextContent('undefined')
    expect(rendered.getByTestId('isFetching')).toHaveTextContent('true')
    expect(rendered.getByTestId('isSuccess')).toHaveTextContent('false')
    expect(rendered.getByTestId('isPlaceholderData')).toHaveTextContent('false')

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByTestId('data')).toHaveTextContent('0')
    expect(rendered.getByTestId('isFetching')).toHaveTextContent('false')
    expect(rendered.getByTestId('isSuccess')).toHaveTextContent('true')
    expect(rendered.getByTestId('isPlaceholderData')).toHaveTextContent('false')

    // Update count to trigger a new fetch — previous data is kept as placeholder
    fireEvent.click(rendered.getByRole('button', { name: /increment/i }))
    expect(rendered.getByTestId('data')).toHaveTextContent('0')
    expect(rendered.getByTestId('isFetching')).toHaveTextContent('true')
    expect(rendered.getByTestId('isSuccess')).toHaveTextContent('true')
    expect(rendered.getByTestId('isPlaceholderData')).toHaveTextContent('true')

    // New data comes in
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByTestId('data')).toHaveTextContent('1')
    expect(rendered.getByTestId('isFetching')).toHaveTextContent('false')
    expect(rendered.getByTestId('isSuccess')).toHaveTextContent('true')
    expect(rendered.getByTestId('isPlaceholderData')).toHaveTextContent('false')
  })

  it('should not show initial data from next query if placeholderData is set', async () => {
    const key = queryKey()

    const rendered = render(Counter, {
      props: {
        queryClient,
        options: (count: number) => ({
          queryKey: [...key, count],
          queryFn: () => sleep(10).then(() => count),
          placeholderData: keepPreviousData,
          initialData: 99,
        }),
      },
    })

    // Initial: uses initialData
    expect(rendered.getByTestId('data')).toHaveTextContent('99')
    expect(rendered.getByTestId('isFetching')).toHaveTextContent('true')
    expect(rendered.getByTestId('isSuccess')).toHaveTextContent('true')
    expect(rendered.getByTestId('isPlaceholderData')).toHaveTextContent('false')

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByTestId('data')).toHaveTextContent('0')
    expect(rendered.getByTestId('isFetching')).toHaveTextContent('false')
    expect(rendered.getByTestId('isSuccess')).toHaveTextContent('true')
    expect(rendered.getByTestId('isPlaceholderData')).toHaveTextContent('false')

    // Update count — next query uses its own initialData (99), not placeholder
    fireEvent.click(rendered.getByRole('button', { name: /increment/i }))
    expect(rendered.getByTestId('data')).toHaveTextContent('99')
    expect(rendered.getByTestId('isFetching')).toHaveTextContent('true')
    expect(rendered.getByTestId('isSuccess')).toHaveTextContent('true')
    expect(rendered.getByTestId('isPlaceholderData')).toHaveTextContent('false')

    // New data comes in
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByTestId('data')).toHaveTextContent('1')
    expect(rendered.getByTestId('isFetching')).toHaveTextContent('false')
    expect(rendered.getByTestId('isSuccess')).toHaveTextContent('true')
    expect(rendered.getByTestId('isPlaceholderData')).toHaveTextContent('false')
  })

  it('should keep the previous data on disabled query when placeholderData is set and switching query key multiple times', async () => {
    const key = queryKey()

    // Set initial query data
    queryClient.setQueryData([...key, 10], 10)

    const rendered = render(Counter, {
      props: {
        queryClient,
        startCount: 10,
        options: (count: number) => ({
          queryKey: [...key, count],
          queryFn: () => sleep(10).then(() => count),
          enabled: false,
          placeholderData: keepPreviousData,
          notifyOnChangeProps: 'all',
        }),
      },
    })

    // Disabled query shows the cached data for key 10
    expect(rendered.getByTestId('data')).toHaveTextContent('10')
    expect(rendered.getByTestId('isFetching')).toHaveTextContent('false')
    expect(rendered.getByTestId('isSuccess')).toHaveTextContent('true')
    expect(rendered.getByTestId('isPlaceholderData')).toHaveTextContent('false')

    // Switch key (11) — keeps previous data as placeholder
    fireEvent.click(rendered.getByRole('button', { name: /increment/i }))
    expect(rendered.getByTestId('data')).toHaveTextContent('10')
    expect(rendered.getByTestId('isFetching')).toHaveTextContent('false')
    expect(rendered.getByTestId('isPlaceholderData')).toHaveTextContent('true')

    // Switch key again (12) — still keeps previous data as placeholder
    fireEvent.click(rendered.getByRole('button', { name: /increment/i }))
    expect(rendered.getByTestId('data')).toHaveTextContent('10')
    expect(rendered.getByTestId('isFetching')).toHaveTextContent('false')
    expect(rendered.getByTestId('isPlaceholderData')).toHaveTextContent('true')

    // Refetch — fetching while keeping placeholder
    fireEvent.click(rendered.getByRole('button', { name: /^refetch$/i }))
    expect(rendered.getByTestId('data')).toHaveTextContent('10')
    expect(rendered.getByTestId('isFetching')).toHaveTextContent('true')
    expect(rendered.getByTestId('isPlaceholderData')).toHaveTextContent('true')

    // Refetch done — new data for key 12
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByTestId('data')).toHaveTextContent('12')
    expect(rendered.getByTestId('isFetching')).toHaveTextContent('false')
    expect(rendered.getByTestId('isSuccess')).toHaveTextContent('true')
    expect(rendered.getByTestId('isPlaceholderData')).toHaveTextContent('false')
  })

  it('should use the correct query function when components use different configurations', async () => {
    const key = queryKey()
    const { promise, resolve } = promiseWithResolvers<number>()

    const rendered = render(TwoQueries, {
      props: {
        queryClient,
        // FirstComponent
        options1: () => ({
          queryKey: key,
          queryFn: () => promise,
        }),
        // SecondComponent
        options2: () => ({
          queryKey: key,
          queryFn: () => 2,
        }),
      },
    })

    expect(rendered.getByTestId('data1')).toHaveTextContent('undefined')

    // Resolve the first query
    resolve(1)
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByTestId('data1')).toHaveTextContent('1')

    // Refetch the first query — it should use the first query function (1), not the second (2)
    fireEvent.click(rendered.getByRole('button', { name: /refetch1/i }))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByTestId('data1')).toHaveTextContent('1')
  })

  it('should be able to set different stale times for a query', async () => {
    const key = queryKey()

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

    const rendered = render(TwoQueries, {
      props: {
        queryClient,
        options1: () => ({
          queryKey: key,
          queryFn: () => sleep(10).then(() => 'one'),
          staleTime: 100,
        }),
        options2: () => ({
          queryKey: key,
          queryFn: () => sleep(10).then(() => 'two'),
          staleTime: 10,
        }),
      },
    })

    // Initial: firstQuery (staleTime 100) sees prefetch as fresh,
    // secondQuery (staleTime 10) sees prefetch as stale
    expect(rendered.getByTestId('data1')).toHaveTextContent('prefetch')
    expect(rendered.getByTestId('isStale1')).toHaveTextContent('false')
    expect(rendered.getByTestId('data2')).toHaveTextContent('prefetch')
    expect(rendered.getByTestId('isStale2')).toHaveTextContent('true')

    // After the refetch triggered by the stale second query
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByTestId('data1')).toHaveTextContent('two')
    expect(rendered.getByTestId('isStale1')).toHaveTextContent('false')
    expect(rendered.getByTestId('data2')).toHaveTextContent('two')
    expect(rendered.getByTestId('isStale2')).toHaveTextContent('false')

    // After both staleTimes expire (100ms for firstQuery)
    await vi.advanceTimersByTimeAsync(101)
    expect(rendered.getByTestId('data1')).toHaveTextContent('two')
    expect(rendered.getByTestId('isStale1')).toHaveTextContent('true')
    expect(rendered.getByTestId('data2')).toHaveTextContent('two')
    expect(rendered.getByTestId('isStale2')).toHaveTextContent('true')
  })

  it('should re-render when a query becomes stale', async () => {
    const key = queryKey()

    const rendered = render(Base, {
      props: {
        queryClient,
        options: () => ({
          queryKey: key,
          queryFn: () => 'test',
          staleTime: 50,
        }),
      },
    })

    // Pending: stale
    expect(rendered.getByTestId('isStale')).toHaveTextContent('true')

    // Fetched: fresh within staleTime
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByTestId('data')).toHaveTextContent('test')
    expect(rendered.getByTestId('isStale')).toHaveTextContent('false')

    // After staleTime: stale again
    await vi.advanceTimersByTimeAsync(51)
    expect(rendered.getByTestId('isStale')).toHaveTextContent('true')
  })

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

  it('should start with status pending, fetchStatus idle if enabled is false', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    const rendered = render(TwoQueries, {
      props: {
        queryClient,
        options1: () => ({
          queryKey: key1,
          queryFn: () => 'data',
          enabled: false,
        }),
        options2: () => ({
          queryKey: key2,
          queryFn: () => 'data',
        }),
      },
    })

    // Disabled query stays pending/idle
    expect(rendered.getByTestId('status1')).toHaveTextContent('pending')
    expect(rendered.getByTestId('fetchStatus1')).toHaveTextContent('idle')

    // Enabled query starts pending/fetching
    expect(rendered.getByTestId('status2')).toHaveTextContent('pending')
    expect(rendered.getByTestId('fetchStatus2')).toHaveTextContent('fetching')

    // Enabled query completes
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByTestId('status2')).toHaveTextContent('success')
    expect(rendered.getByTestId('fetchStatus2')).toHaveTextContent('idle')

    // Disabled query is still pending/idle
    expect(rendered.getByTestId('status1')).toHaveTextContent('pending')
    expect(rendered.getByTestId('fetchStatus1')).toHaveTextContent('idle')
  })

  it('should be in "pending" state by default', () => {
    const key = queryKey()

    const rendered = render(Base, {
      props: {
        queryClient,
        options: () => ({
          queryKey: key,
          queryFn: () => new Promise(() => {}),
        }),
      },
    })

    expect(rendered.getByTestId('status')).toHaveTextContent('pending')
  })

  it('should not refetch query on focus when `enabled` is set to `false`', async () => {
    const key = queryKey()
    const queryFn = vi.fn().mockReturnValue('data')

    const rendered = render(Base, {
      props: {
        queryClient,
        options: () => ({
          queryKey: key,
          queryFn,
          enabled: false,
        }),
      },
    })

    // Wait a bit to ensure the query has time to settle
    await vi.advanceTimersByTimeAsync(10)

    // Simulate window focus
    window.dispatchEvent(new Event('visibilitychange'))

    // Wait a bit more to ensure no refetch happens
    await vi.advanceTimersByTimeAsync(10)

    // The query function should not have been called
    expect(queryFn).not.toHaveBeenCalled()

    // Data should be undefined since the query is disabled
    expect(rendered.getByTestId('data')).toHaveTextContent('undefined')
  })

  it('should not refetch stale query on focus when `refetchOnWindowFocus` is set to `false`', async () => {
    const key = queryKey()
    let count = 0

    const rendered = render(Base, {
      props: {
        queryClient,
        options: () => ({
          queryKey: key,
          queryFn: () => count++,
          staleTime: 0,
          refetchOnWindowFocus: false,
        }),
      },
    })

    // Wait for the initial fetch to complete
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByTestId('data')).toHaveTextContent('0')

    // Simulate window focus
    window.dispatchEvent(new Event('visibilitychange'))

    // Wait a bit to ensure no refetch happens
    await vi.advanceTimersByTimeAsync(10)

    // Count should still be 1 since no refetch occurred
    expect(count).toBe(1)
    expect(rendered.getByTestId('data')).toHaveTextContent('0')
  })

  it('should not refetch stale query on focus when `refetchOnWindowFocus` is set to a function that returns `false`', async () => {
    const key = queryKey()
    let count = 0

    const rendered = render(Base, {
      props: {
        queryClient,
        options: () => ({
          queryKey: key,
          queryFn: () => count++,
          staleTime: 0,
          refetchOnWindowFocus: () => false,
        }),
      },
    })

    // Wait for the initial fetch to complete
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByTestId('data')).toHaveTextContent('0')

    // Simulate window focus
    window.dispatchEvent(new Event('visibilitychange'))

    // Wait a bit to ensure no refetch happens
    await vi.advanceTimersByTimeAsync(10)

    // Count should still be 1 since no refetch occurred
    expect(count).toBe(1)
    expect(rendered.getByTestId('data')).toHaveTextContent('0')
  })

  it('should not refetch fresh query on focus when `refetchOnWindowFocus` is set to `true`', async () => {
    const key = queryKey()
    let count = 0

    const rendered = render(Base, {
      props: {
        queryClient,
        options: () => ({
          queryKey: key,
          queryFn: () => count++,
          staleTime: Infinity,
          refetchOnWindowFocus: true,
        }),
      },
    })

    // Wait for the initial fetch to complete
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByTestId('data')).toHaveTextContent('0')

    // Simulate window focus
    window.dispatchEvent(new Event('visibilitychange'))

    // Wait a bit to ensure no refetch happens
    await vi.advanceTimersByTimeAsync(10)

    // Count should still be 1 since the fresh query does not refetch
    expect(count).toBe(1)
    expect(rendered.getByTestId('data')).toHaveTextContent('0')
  })

  it('should refetch fresh query when refetchOnMount is set to always', async () => {
    const key = queryKey()

    // Prefetch the query
    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => 'prefetched',
    })

    const rendered = render(Base, {
      props: {
        queryClient,
        options: () => ({
          queryKey: key,
          queryFn: () => 'data',
          refetchOnMount: 'always',
          staleTime: Infinity,
        }),
      },
    })

    // Initial: prefetched data, fresh, but refetching because refetchOnMount: 'always'
    expect(rendered.getByTestId('data')).toHaveTextContent('prefetched')
    expect(rendered.getByTestId('isStale')).toHaveTextContent('false')
    expect(rendered.getByTestId('isFetching')).toHaveTextContent('true')

    // After refetch
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByTestId('data')).toHaveTextContent('data')
    expect(rendered.getByTestId('isStale')).toHaveTextContent('false')
    expect(rendered.getByTestId('isFetching')).toHaveTextContent('false')
  })

  it('should refetch stale query when refetchOnMount is set to true', async () => {
    const key = queryKey()

    // Prefetch the query
    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => 'prefetched',
    })

    const rendered = render(Base, {
      props: {
        queryClient,
        options: () => ({
          queryKey: key,
          queryFn: () => 'data',
          refetchOnMount: true,
          staleTime: 0,
        }),
      },
    })

    // Initial: prefetched data, stale, refetching
    expect(rendered.getByTestId('data')).toHaveTextContent('prefetched')
    expect(rendered.getByTestId('isStale')).toHaveTextContent('true')
    expect(rendered.getByTestId('isFetching')).toHaveTextContent('true')

    // After refetch
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByTestId('data')).toHaveTextContent('data')
    expect(rendered.getByTestId('isStale')).toHaveTextContent('true')
    expect(rendered.getByTestId('isFetching')).toHaveTextContent('false')
  })

  it('should set status to error if queryFn throws', async () => {
    const key = queryKey()
    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    const rendered = render(Base, {
      props: {
        queryClient,
        options: () => ({
          queryKey: key,
          queryFn: () => Promise.reject(new Error('Error test')),
          retry: false,
        }),
      },
    })

    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByTestId('status')).toHaveTextContent('error')
    expect(rendered.getByTestId('error')).toHaveTextContent('Error test')

    consoleMock.mockRestore()
  })

  it('should set status to error instead of throwing when error should not be thrown', async () => {
    const key = queryKey()

    const rendered = render(Base, {
      props: {
        queryClient,
        options: () => ({
          queryKey: key,
          queryFn: () => Promise.reject(new Error('Local Error')),
          retry: false,
          throwOnError: (err: Error) => err.message !== 'Local Error',
        }),
      },
    })

    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByTestId('status')).toHaveTextContent('error')
    expect(rendered.getByTestId('error')).toHaveTextContent('Local Error')
  })

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

    await vi.advanceTimersByTimeAsync(10)

    expect(rendered.getByTestId('status')).toHaveTextContent('pending')
    expect(rendered.getByTestId('fetchStatus')).toHaveTextContent('idle')
    expect(rendered.getByTestId('data')).toHaveTextContent('undefined')
    expect(queryFn).toHaveBeenCalledTimes(0)
  })
})
