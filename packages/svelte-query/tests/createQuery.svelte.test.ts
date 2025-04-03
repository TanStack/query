import {
  QueryCache,
  QueryClient,
  createQuery,
  keepPreviousData,
} from '@tanstack/svelte-query'
import { promiseWithResolvers, sleep, withEffectRoot } from './utils.svelte'
import type { CreateQueryResult } from '@tanstack/svelte-query'

describe('createQuery', () => {
  const queryCache = new QueryCache()
  const queryClient = new QueryClient({ queryCache })

  beforeEach(() => {
    queryCache.clear()
  })

  it(
    'should return the correct states for a successful query',
    withEffectRoot(async () => {
      const { promise, resolve } = promiseWithResolvers<string>()

      const query = createQuery<string, Error>(
        () => ({
          queryKey: ['test'],
          queryFn: () => promise,
        }),
        queryClient,
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

      let promise1 = query.promise

      expect(query).toEqual({
        data: undefined,
        dataUpdatedAt: 0,
        error: null,
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        errorUpdateCount: 0,
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
      await vi.waitFor(() =>
        expect(query).toEqual({
          data: 'resolved',
          dataUpdatedAt: expect.any(Number),
          error: null,
          errorUpdatedAt: 0,
          failureCount: 0,
          failureReason: null,
          errorUpdateCount: 0,
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
        }),
      )

      expect(promise1).toBe(query.promise)
    }),
  )

  it(
    'should return the correct states for an unsuccessful query',
    withEffectRoot(async () => {
      let count = 0
      const states: Array<CreateQueryResult> = []
      const query = createQuery<string, Error>(
        () => ({
          queryKey: ['test'],
          queryFn: () => {
            return Promise.reject(new Error('rejected #' + ++count))
          },
          retry: 1,
          retryDelay: 1,
        }),
        queryClient,
      )
      $effect(() => {
        states.push({ ...query })
      })

      await vi.waitFor(() => expect(query.isError).toBe(true))

      expect(states[0]).toEqual({
        data: undefined,
        dataUpdatedAt: 0,
        error: null,
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        errorUpdateCount: 0,
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
    const key = ['test']

    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => Promise.resolve('prefetched'),
    })

    await withEffectRoot(async () => {
      const { promise, resolve } = promiseWithResolvers<string>()

      const query = $derived(
        createQuery<string, Error>(
          () => ({
            queryKey: key,
            queryFn: () => promise,
          }),
          queryClient,
        ),
      )

      expect(query).toEqual(
        expect.objectContaining({
          data: 'prefetched',
          isFetched: true,
          isFetchedAfterMount: false,
        }),
      )
      resolve('resolved')
      await vi.waitFor(() =>
        expect(query).toEqual(
          expect.objectContaining({
            data: 'resolved',
            isFetched: true,
            isFetchedAfterMount: true,
          }),
        ),
      )
    })()
  })

  it(
    'should not cancel an ongoing fetch when refetch is called with cancelRefetch=false if we have data already',
    withEffectRoot(async () => {
      const key = ['test']
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
        queryClient,
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
      const key = ['test']
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
        queryClient,
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
      const key = ['test']
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
        queryClient,
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
      const key = ['test']
      const states: Array<CreateQueryResult<string>> = []

      queryClient.setQueryDefaults(key, {
        queryFn: () => 'data',
      })

      const query = createQuery<string>(() => ({ queryKey: key }), queryClient)

      $effect(() => {
        states.push({ ...query })
      })

      await vi.waitFor(() => {
        expect(query.data).toBe('data')
      })

      expect(states.length).toBe(2)
      expect(states[0]).toMatchObject({ data: undefined })
      expect(states[1]).toMatchObject({ data: 'data' })
    }),
  )

  it('should pick up a query when re-mounting with gcTime 0', async () => {
    // this needs to be split into two different effect roots because
    // effects won't pick up dependencies created after the first `await`
    // -- the two roots effectively emulate two consecutive components being rendered
    await withEffectRoot(async () => {
      const { promise, resolve } = promiseWithResolvers<string>()

      const query = createQuery<string>(
        () => ({
          queryKey: ['test'],
          queryFn: () => promise,
          gcTime: 0,
          notifyOnChangeProps: 'all',
        }),
        queryClient,
      )

      expect(query).toMatchObject({
        isPending: true,
        isSuccess: false,
        isFetching: true,
      })

      resolve('resolved: 1')
      await vi.waitFor(() => expect(query.data).toBe('resolved: 1'))

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
          queryKey: ['test'],
          queryFn: () => promise,
          gcTime: 0,
          notifyOnChangeProps: 'all',
        }),
        queryClient,
      )

      expect(query).toMatchObject({
        data: 'resolved: 1',
        isPending: false,
        isSuccess: true,
        isFetching: true,
      })

      resolve('resolved: 2')
      await vi.waitFor(() => expect(query.data).toBe('resolved: 2'))

      expect(query).toMatchObject({
        data: 'resolved: 2',
        isPending: false,
        isSuccess: true,
        isFetching: false,
      })
    })()
  })

  it('should not get into an infinite loop when removing a query with gcTime 0 and rerendering', async () => {
    const key = ['test']
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
        queryClient,
      )

      $effect(() => {
        states.push({ ...query })
      })

      await vi.waitFor(() => {
        expect(query.data).toBe('data')
      })
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
        queryClient,
      )

      $effect(() => {
        states.push({ ...query })
      })

      await vi.waitFor(() => {
        expect(query.data).toBe('data')
      })

      // Give it time to catch any accidental infinite updates
      await new Promise((r) => setTimeout(r, 100))
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
      const key = ['test']
      const states: Array<CreateQueryResult<string>> = []

      const query = createQuery<string>(
        () => ({
          queryKey: key,
          queryFn: () => 'test',
          refetchOnMount: false,
        }),
        queryClient,
      )

      $effect(() => {
        states.push({ ...query })
      })

      await vi.waitFor(() => {
        expect(query.data).toBe('test')
      })

      expect(states.length).toBe(2)
      expect(states[0]).toMatchObject({ data: undefined })
      expect(states[1]).toMatchObject({ data: 'test' })
    }),
  )

  it(
    'should not fetch when refetchOnMount is false and data has been fetched already',
    withEffectRoot(async () => {
      const key = ['test']
      const states: Array<CreateQueryResult<string>> = []

      queryClient.setQueryData(key, 'prefetched')

      const query = createQuery<string>(
        () => ({
          queryKey: key,
          queryFn: () => 'test',
          refetchOnMount: false,
        }),
        queryClient,
      )

      $effect(() => {
        states.push({ ...query })
      })

      await vi.waitFor(() => {
        expect(query.data).toBe('prefetched')
      })

      expect(states.length).toBe(1)
      expect(states[0]).toMatchObject({ data: 'prefetched' })
    }),
  )

  it(
    'should be able to select a part of the data with select',
    withEffectRoot(async () => {
      const key = ['test']
      const states: Array<CreateQueryResult<string>> = []

      const query = createQuery<{ name: string }, Error, string>(
        () => ({
          queryKey: key,
          queryFn: () => ({ name: 'test' }),
          select: (data) => data.name,
        }),
        queryClient,
      )

      $effect(() => {
        states.push({ ...query })
      })

      await vi.waitFor(() => {
        expect(query.data).toBe('test')
      })

      expect(states.length).toBe(2)
      expect(states[0]).toMatchObject({ data: undefined })
      expect(states[1]).toMatchObject({ data: 'test' })
    }),
  )

  it(
    'should throw an error when a selector throws',
    withEffectRoot(async () => {
      const key = ['test']
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
        queryClient,
      )

      $effect(() => {
        states.push({ ...query })
      })

      await vi.waitFor(() => {
        expect(query.status).toBe('error')
      })

      expect(states.length).toBe(2)
      expect(states[0]).toMatchObject({ status: 'pending', data: undefined })
      expect(states[1]).toMatchObject({ status: 'error', error })
    }),
  )

  it(
    'should be able to remove a query',
    withEffectRoot(async () => {
      const key = ['test']
      const states: Array<CreateQueryResult<number>> = []
      let count = 0
      const query = createQuery<number>(
        () => ({
          queryKey: key,
          queryFn: () => ++count,
          notifyOnChangeProps: 'all',
        }),
        queryClient,
      )

      $effect(() => {
        states.push({ ...query })
      })

      await vi.waitFor(() => expect(query.data).toBe(1))

      queryClient.removeQueries({ queryKey: key })
      await query.refetch()

      await vi.waitFor(() => expect(query.data).toBe(2))

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
      let search = $state('')
      const states: Array<CreateQueryResult<string>> = []

      const query = createQuery(
        () => ({
          queryKey: ['products', search],
          queryFn: async () => Promise.resolve(search),
          placeholderData: keepPreviousData,
        }),
        queryClient,
      )

      $effect(() => {
        states.push({ ...query })
      })

      await vi.waitFor(() => expect(query.data).toBe(''))
      search = 'phone'
      await vi.waitFor(() => expect(query.data).toBe('phone'))

      console.log(
        states.map((s) => ({
          data: s.data,
          status: s.status,
          fetchStatus: s.fetchStatus,
        })),
      )

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
      const key = ['test']
      const states: Array<CreateQueryResult<number>> = []
      let count = 0

      const query = createQuery(
        () => ({
          queryKey: key,
          queryFn: () => Promise.resolve(++count),
        }),
        queryClient,
      )

      $effect(() => {
        states.push({ ...query })
      })

      await vi.waitFor(() => {
        expect(query.data).toBe(1)
      })

      queryClient.removeQueries({ queryKey: key })
      await query.refetch()
      await vi.waitFor(() => {
        expect(query.data).toBe(2)
      })

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
      const key = ['test']

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
        queryClient,
      )

      $effect(() => {
        states.push({ ...query })
      })

      await vi.waitFor(() => expect(query.data?.[1]?.done).toBe(false))
      await query.refetch()
      await vi.waitFor(() => expect(query.data?.[1]?.done).toBe(true))

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
      const key = ['test']

      queryClient.setQueryData(key, 'set')

      const query = createQuery(
        () => ({
          queryKey: key,
          queryFn: () => Promise.resolve('fetched'),
          initialData: 'initial',
          staleTime: Infinity,
        }),
        queryClient,
      )

      await vi.waitFor(() => expect(query.data).toBe('set'))
      queryClient.refetchQueries({ queryKey: key })
      await vi.waitFor(() => expect(query.data).toBe('fetched'))
    }),
  )

  it(
    'should update query stale state and refetch when invalidated with invalidateQueries',
    withEffectRoot(async () => {
      const key = ['test']
      let count = 0

      const query = createQuery<number>(
        () => ({
          queryKey: key,
          queryFn: () => Promise.resolve(++count),
          staleTime: Infinity,
        }),
        queryClient,
      )

      await vi.waitFor(() =>
        expect(query).toEqual(
          expect.objectContaining({
            data: 1,
            isStale: false,
            isFetching: false,
          }),
        ),
      )
      queryClient.invalidateQueries({ queryKey: key })
      await vi.waitFor(() =>
        expect(query).toEqual(
          expect.objectContaining({
            data: 1,
            isStale: true,
            isFetching: true,
          }),
        ),
      )
      await vi.waitFor(() =>
        expect(query).toEqual(
          expect.objectContaining({
            data: 2,
            isStale: false,
            isFetching: false,
          }),
        ),
      )
    }),
  )

  it(
    'should not update disabled query when refetching with refetchQueries',
    withEffectRoot(async () => {
      const key = ['test']
      const states: Array<CreateQueryResult<number>> = []
      let count = 0

      const query = createQuery<number>(
        () => ({
          queryKey: key,
          queryFn: () => Promise.resolve(++count),
          enabled: false,
        }),
        queryClient,
      )

      $effect(() => {
        states.push({ ...query })
      })

      await sleep(50)

      expect(states.length).toBe(1)
      expect(states[0]).toMatchObject({
        data: undefined,
        isSuccess: false,
        isFetching: false,
        isStale: false,
      })
    }),
  )
})
