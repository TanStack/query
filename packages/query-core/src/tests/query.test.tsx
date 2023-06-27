import {
  sleep,
  queryKey,
  mockVisibilityState,
  mockLogger,
  createQueryClient,
} from './utils'
import type {
  QueryCache,
  QueryClient,
  QueryFunctionContext,
  QueryObserverResult,
} from '..'
import { QueryObserver, isCancelledError, isError, onlineManager } from '..'
import { waitFor } from '@testing-library/react'

describe('query', () => {
  let queryClient: QueryClient
  let queryCache: QueryCache

  beforeEach(() => {
    queryClient = createQueryClient()
    queryCache = queryClient.getQueryCache()
    queryClient.mount()
  })

  afterEach(() => {
    queryClient.clear()
  })

  test('should use the longest cache time it has seen', async () => {
    const key = queryKey()
    await queryClient.prefetchQuery(key, () => 'data', {
      cacheTime: 100,
    })
    await queryClient.prefetchQuery(key, () => 'data', {
      cacheTime: 200,
    })
    await queryClient.prefetchQuery(key, () => 'data', {
      cacheTime: 10,
    })
    const query = queryCache.find(key)!
    expect(query.cacheTime).toBe(200)
  })

  it('should continue retry after focus regain and resolve all promises', async () => {
    const key = queryKey()

    // make page unfocused
    const visibilityMock = mockVisibilityState('hidden')

    let count = 0
    let result

    const promise = queryClient.fetchQuery(
      key,
      async () => {
        count++

        if (count === 3) {
          return `data${count}`
        }

        throw new Error(`error${count}`)
      },
      {
        retry: 3,
        retryDelay: 1,
      },
    )

    promise.then((data) => {
      result = data
    })

    // Check if we do not have a result
    expect(result).toBeUndefined()

    // Check if the query is really paused
    await sleep(50)
    expect(result).toBeUndefined()

    // Reset visibilityState to original value
    visibilityMock.mockRestore()
    window.dispatchEvent(new FocusEvent('focus'))

    // There should not be a result yet
    expect(result).toBeUndefined()

    // By now we should have a value
    await sleep(50)
    expect(result).toBe('data3')
  })

  it('should continue retry after reconnect and resolve all promises', async () => {
    const key = queryKey()

    onlineManager.setOnline(false)

    let count = 0
    let result

    const promise = queryClient.fetchQuery(
      key,
      async () => {
        count++

        if (count === 3) {
          return `data${count}`
        }

        throw new Error(`error${count}`)
      },
      {
        retry: 3,
        retryDelay: 1,
      },
    )

    promise.then((data) => {
      result = data
    })

    // Check if we do not have a result
    expect(result).toBeUndefined()

    // Check if the query is really paused
    await sleep(50)
    expect(result).toBeUndefined()

    // Reset navigator to original value
    onlineManager.setOnline(true)

    // There should not be a result yet
    expect(result).toBeUndefined()

    // Promise should eventually be resolved
    await promise
    expect(result).toBe('data3')
  })

  it('should throw a CancelledError when a paused query is cancelled', async () => {
    const key = queryKey()

    // make page unfocused
    const visibilityMock = mockVisibilityState('hidden')

    let count = 0
    let result

    const promise = queryClient.fetchQuery(
      key,
      async (): Promise<unknown> => {
        count++
        throw new Error(`error${count}`)
      },
      {
        retry: 3,
        retryDelay: 1,
      },
    )

    promise.catch((data) => {
      result = data
    })

    const query = queryCache.find(key)!

    // Check if the query is really paused
    await sleep(50)
    expect(result).toBeUndefined()

    // Cancel query
    query.cancel()

    // Check if the error is set to the cancelled error
    try {
      await promise
    } catch {
      expect(isCancelledError(result)).toBe(true)
    } finally {
      // Reset visibilityState to original value
      visibilityMock.mockRestore()
      window.dispatchEvent(new FocusEvent('focus'))
    }
  })

  test('should provide context to queryFn', async () => {
    const key = queryKey()

    const queryFn = jest
      .fn<
        Promise<'data'>,
        [QueryFunctionContext<ReturnType<typeof queryKey>>]
      >()
      .mockResolvedValue('data')

    queryClient.prefetchQuery(key, queryFn)

    await sleep(10)

    expect(queryFn).toHaveBeenCalledTimes(1)
    const args = queryFn.mock.calls[0]![0]
    expect(args).toBeDefined()
    expect(args.pageParam).toBeUndefined()
    expect(args.queryKey).toEqual(key)
    expect(args.signal).toBeInstanceOf(AbortSignal)
  })

  test('should continue if cancellation is not supported and signal is not consumed', async () => {
    const key = queryKey()

    queryClient.prefetchQuery(key, async () => {
      await sleep(100)
      return 'data'
    })

    await sleep(10)

    // Subscribe and unsubscribe to simulate cancellation because the last observer unsubscribed
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      enabled: false,
    })
    const unsubscribe = observer.subscribe(() => undefined)
    unsubscribe()

    await sleep(100)

    const query = queryCache.find(key)!

    expect(query.state).toMatchObject({
      data: 'data',
      status: 'success',
      dataUpdateCount: 1,
    })
  })

  test('should not continue when last observer unsubscribed if the signal was consumed', async () => {
    const key = queryKey()

    queryClient.prefetchQuery(key, async ({ signal }) => {
      await sleep(100)
      return signal?.aborted ? 'aborted' : 'data'
    })

    await sleep(10)

    // Subscribe and unsubscribe to simulate cancellation because the last observer unsubscribed
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      enabled: false,
    })
    const unsubscribe = observer.subscribe(() => undefined)
    unsubscribe()

    await sleep(100)

    const query = queryCache.find(key)!

    expect(query.state).toMatchObject({
      data: undefined,
      status: 'loading',
      fetchStatus: 'idle',
    })
  })

  test('should provide an AbortSignal to the queryFn that provides info about the cancellation state', async () => {
    const key = queryKey()

    const queryFn = jest.fn<
      Promise<unknown>,
      [QueryFunctionContext<ReturnType<typeof queryKey>>]
    >()
    const onAbort = jest.fn()
    const abortListener = jest.fn()
    let error

    queryFn.mockImplementation(async ({ signal }) => {
      if (signal) {
        signal.onabort = onAbort
        signal.addEventListener('abort', abortListener)
      }
      await sleep(10)
      if (signal) {
        signal.onabort = null
        signal.removeEventListener('abort', abortListener)
      }
      throw new Error()
    })

    const promise = queryClient.fetchQuery(key, queryFn, {
      retry: 3,
      retryDelay: 10,
    })

    promise.catch((e) => {
      error = e
    })

    const query = queryCache.find(key)!

    expect(queryFn).toHaveBeenCalledTimes(1)

    const signal = queryFn.mock.calls[0]![0].signal
    expect(signal?.aborted).toBe(false)
    expect(onAbort).not.toHaveBeenCalled()
    expect(abortListener).not.toHaveBeenCalled()

    query.cancel()

    await sleep(100)

    expect(signal?.aborted).toBe(true)
    expect(onAbort).toHaveBeenCalledTimes(1)
    expect(abortListener).toHaveBeenCalledTimes(1)
    expect(isCancelledError(error)).toBe(true)
  })

  test('should not continue if explicitly cancelled', async () => {
    const key = queryKey()

    const queryFn = jest.fn<unknown, unknown[]>()

    queryFn.mockImplementation(async () => {
      await sleep(10)
      throw new Error()
    })

    let error

    const promise = queryClient.fetchQuery(key, queryFn, {
      retry: 3,
      retryDelay: 10,
    })

    promise.catch((e) => {
      error = e
    })

    const query = queryCache.find(key)!
    query.cancel()

    await sleep(100)

    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(isCancelledError(error)).toBe(true)
  })

  test('should not error if reset while loading', async () => {
    const key = queryKey()

    const queryFn = jest.fn<unknown, unknown[]>()

    queryFn.mockImplementation(async () => {
      await sleep(10)
      throw new Error()
    })

    queryClient.fetchQuery(key, queryFn, {
      retry: 3,
      retryDelay: 10,
    })

    // Ensure the query is loading
    const query = queryCache.find(key)!
    expect(query.state.status).toBe('loading')

    // Reset the query while it is loading
    query.reset()

    await sleep(100)

    // The query should
    expect(queryFn).toHaveBeenCalledTimes(1) // have been called,
    expect(query.state.error).toBe(null) // not have an error, and
    expect(query.state.fetchStatus).toBe('idle') // not be loading any longer
  })

  test('should be able to refetch a cancelled query', async () => {
    const key = queryKey()

    const queryFn = jest.fn<unknown, unknown[]>()

    queryFn.mockImplementation(async () => {
      await sleep(50)
      return 'data'
    })

    queryClient.prefetchQuery(key, queryFn)
    const query = queryCache.find(key)!
    await sleep(10)
    query.cancel()
    await sleep(100)

    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(isCancelledError(query.state.error)).toBe(true)
    const result = await query.fetch()
    expect(result).toBe('data')
    expect(query.state.error).toBe(null)
    expect(queryFn).toHaveBeenCalledTimes(2)
  })

  test('cancelling a resolved query should not have any effect', async () => {
    const key = queryKey()
    await queryClient.prefetchQuery(key, async () => 'data')
    const query = queryCache.find(key)!
    query.cancel()
    await sleep(10)
    expect(query.state.data).toBe('data')
  })

  test('cancelling a rejected query should not have any effect', async () => {
    const key = queryKey()

    await queryClient.prefetchQuery(key, async (): Promise<unknown> => {
      throw new Error('error')
    })
    const query = queryCache.find(key)!
    query.cancel()
    await sleep(10)

    expect(isError(query.state.error)).toBe(true)
    expect(isCancelledError(query.state.error)).toBe(false)
  })

  test('the previous query status should be kept when refetching', async () => {
    const key = queryKey()

    await queryClient.prefetchQuery(key, () => 'data')
    const query = queryCache.find(key)!
    expect(query.state.status).toBe('success')

    await queryClient.prefetchQuery(
      key,
      () => Promise.reject<string>('reject'),
      {
        retry: false,
      },
    )
    expect(query.state.status).toBe('error')

    queryClient.prefetchQuery(
      key,
      async () => {
        await sleep(10)
        return Promise.reject<unknown>('reject')
      },
      { retry: false },
    )
    expect(query.state.status).toBe('error')

    await sleep(100)
    expect(query.state.status).toBe('error')
  })

  test('queries with cacheTime 0 should be removed immediately after unsubscribing', async () => {
    const key = queryKey()
    let count = 0
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: () => {
        count++
        return 'data'
      },
      cacheTime: 0,
      staleTime: Infinity,
    })
    const unsubscribe1 = observer.subscribe(() => undefined)
    unsubscribe1()
    await waitFor(() => expect(queryCache.find(key)).toBeUndefined())
    const unsubscribe2 = observer.subscribe(() => undefined)
    unsubscribe2()

    await waitFor(() => expect(queryCache.find(key)).toBeUndefined())
    expect(count).toBe(1)
  })

  test('should be garbage collected when unsubscribed to', async () => {
    const key = queryKey()
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: async () => 'data',
      cacheTime: 0,
    })
    expect(queryCache.find(key)).toBeDefined()
    const unsubscribe = observer.subscribe(() => undefined)
    expect(queryCache.find(key)).toBeDefined()
    unsubscribe()
    await waitFor(() => expect(queryCache.find(key)).toBeUndefined())
  })

  test('should be garbage collected later when unsubscribed and query is fetching', async () => {
    const key = queryKey()
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: async () => {
        await sleep(20)
        return 'data'
      },
      cacheTime: 10,
    })
    const unsubscribe = observer.subscribe(() => undefined)
    await sleep(20)
    expect(queryCache.find(key)).toBeDefined()
    observer.refetch()
    unsubscribe()
    await sleep(10)
    // unsubscribe should not remove even though cacheTime has elapsed b/c query is still fetching
    expect(queryCache.find(key)).toBeDefined()
    await sleep(10)
    // should be removed after an additional staleTime wait
    await waitFor(() => expect(queryCache.find(key)).toBeUndefined())
  })

  test('should not be garbage collected unless there are no subscribers', async () => {
    const key = queryKey()
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: async () => 'data',
      cacheTime: 0,
    })
    expect(queryCache.find(key)).toBeDefined()
    const unsubscribe = observer.subscribe(() => undefined)
    await sleep(100)
    expect(queryCache.find(key)).toBeDefined()
    unsubscribe()
    await sleep(100)
    expect(queryCache.find(key)).toBeUndefined()
    queryClient.setQueryData(key, 'data')
    await sleep(100)
    expect(queryCache.find(key)).toBeDefined()
  })

  test('should return proper count of observers', async () => {
    const key = queryKey()
    const options = { queryKey: key, queryFn: async () => 'data' }
    const observer = new QueryObserver(queryClient, options)
    const observer2 = new QueryObserver(queryClient, options)
    const observer3 = new QueryObserver(queryClient, options)
    const query = queryCache.find(key)

    expect(query?.getObserversCount()).toEqual(0)

    const unsubscribe1 = observer.subscribe(() => undefined)
    const unsubscribe2 = observer2.subscribe(() => undefined)
    const unsubscribe3 = observer3.subscribe(() => undefined)
    expect(query?.getObserversCount()).toEqual(3)

    unsubscribe3()
    expect(query?.getObserversCount()).toEqual(2)

    unsubscribe2()
    expect(query?.getObserversCount()).toEqual(1)

    unsubscribe1()
    expect(query?.getObserversCount()).toEqual(0)
  })

  test('stores meta object in query', async () => {
    const meta = {
      it: 'works',
    }

    const key = queryKey()

    await queryClient.prefetchQuery(key, () => 'data', {
      meta,
    })

    const query = queryCache.find(key)!

    expect(query.meta).toBe(meta)
    expect(query.options.meta).toBe(meta)
  })

  test('updates meta object on change', async () => {
    const meta = {
      it: 'works',
    }

    const key = queryKey()
    const queryFn = () => 'data'

    await queryClient.prefetchQuery(key, queryFn, {
      meta,
    })

    await queryClient.prefetchQuery(key, queryFn, {
      meta: undefined,
    })

    const query = queryCache.find(key)!

    expect(query.meta).toBeUndefined()
    expect(query.options.meta).toBeUndefined()
  })

  test('can use default meta', async () => {
    const meta = {
      it: 'works',
    }

    const key = queryKey()
    const queryFn = () => 'data'

    queryClient.setQueryDefaults(key, { meta })

    await queryClient.prefetchQuery(key, queryFn)

    const query = queryCache.find(key)!

    expect(query.meta).toBe(meta)
  })

  test('provides meta object inside query function', async () => {
    const meta = {
      it: 'works',
    }

    const queryFn = jest.fn(() => 'data')

    const key = queryKey()

    await queryClient.prefetchQuery(key, queryFn, {
      meta,
    })

    expect(queryFn).toBeCalledWith(
      expect.objectContaining({
        meta,
      }),
    )
  })

  test('should refetch the observer when online method is called', async () => {
    const key = queryKey()

    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: () => 'data',
    })

    const refetchSpy = jest.spyOn(observer, 'refetch')
    const unsubscribe = observer.subscribe(() => undefined)
    queryCache.onOnline()

    // Should refetch the observer
    expect(refetchSpy).toHaveBeenCalledTimes(1)

    unsubscribe()
    refetchSpy.mockRestore()
  })

  test('should not add an existing observer', async () => {
    const key = queryKey()

    await queryClient.prefetchQuery(key, () => 'data')
    const query = queryCache.find(key)!
    expect(query.getObserversCount()).toEqual(0)

    const observer = new QueryObserver(queryClient, {
      queryKey: key,
    })
    expect(query.getObserversCount()).toEqual(0)

    query.addObserver(observer)
    expect(query.getObserversCount()).toEqual(1)

    query.addObserver(observer)
    expect(query.getObserversCount()).toEqual(1)
  })

  test('should not try to remove an observer that does not exist', async () => {
    const key = queryKey()

    await queryClient.prefetchQuery(key, () => 'data')
    const query = queryCache.find(key)!
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
    })
    expect(query.getObserversCount()).toEqual(0)

    const notifySpy = jest.spyOn(queryCache, 'notify')
    expect(() => query.removeObserver(observer)).not.toThrow()
    expect(notifySpy).not.toHaveBeenCalled()

    notifySpy.mockRestore()
  })

  test('should not dispatch "invalidate" on invalidate() if already invalidated', async () => {
    const key = queryKey()

    await queryClient.prefetchQuery(key, () => 'data')
    const query = queryCache.find(key)!

    query.invalidate()
    expect(query.state.isInvalidated).toBeTruthy()

    const dispatchOriginal = query['dispatch']
    const dispatchSpy = jest.fn()
    query['dispatch'] = dispatchSpy

    query.invalidate()

    expect(query.state.isInvalidated).toBeTruthy()
    expect(dispatchSpy).not.toHaveBeenCalled()

    query['dispatch'] = dispatchOriginal
  })

  test('fetch should not dispatch "fetch" if state meta and fetchOptions meta are the same object', async () => {
    const key = queryKey()

    const queryFn = async () => {
      await sleep(10)
      return 'data'
    }

    await queryClient.prefetchQuery(key, queryFn)
    const query = queryCache.find(key)!

    const meta = { meta1: '1' }

    // This first fetch will set the state.meta value
    query.fetch(
      {
        queryKey: key,
        queryFn,
      },
      {
        meta,
      },
    )

    // Spy on private dispatch method
    const dispatchOriginal = query['dispatch']
    const dispatchSpy = jest.fn()
    query['dispatch'] = dispatchSpy

    // Second fetch in parallel with the same meta
    query.fetch(
      {
        queryKey: key,
        queryFn,
      },
      {
        meta,
        // cancelRefetch must be set to true to enter in the case to test
        // where isFetching is true
        cancelRefetch: true,
      },
    )

    // Should not call dispatch with type set to fetch
    expect(dispatchSpy).not.toHaveBeenCalledWith({
      meta,
      type: 'fetch',
    })

    // Clean-up
    await sleep(20)
    query['dispatch'] = dispatchOriginal
  })

  test('fetch should not set the signal in the queryFnContext if AbortController is undefined', async () => {
    const key = queryKey()

    // Mock the AbortController to be undefined
    const AbortControllerOriginal = globalThis['AbortController']
    //@ts-expect-error
    globalThis['AbortController'] = undefined

    let signalTest: any
    await queryClient.prefetchQuery(key, ({ signal }) => {
      signalTest = signal
      return 'data'
    })

    expect(signalTest).toBeUndefined()

    // Clean-up
    //@ts-ignore
    globalThis['AbortController'] = AbortControllerOriginal
  })

  test('fetch should throw an error if the queryFn is not defined', async () => {
    const key = queryKey()

    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: undefined,
      retry: false,
    })

    const unsubscribe = observer.subscribe(() => undefined)

    await sleep(10)
    const query = queryCache.find(key)!
    expect(mockLogger.error).toHaveBeenCalledWith(
      `Missing queryFn for queryKey '${query.queryHash}'`,
    )

    unsubscribe()
  })

  test('fetch should dispatch an error if the queryFn returns undefined', async () => {
    const key = queryKey()

    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: () => undefined,
      retry: false,
    })

    let observerResult: QueryObserverResult<unknown, unknown> | undefined

    const unsubscribe = observer.subscribe((result) => {
      observerResult = result
    })

    await sleep(10)

    const error = new Error(`${JSON.stringify(key)} data is undefined`)

    expect(observerResult).toMatchObject({
      isError: true,
      error,
    })

    expect(mockLogger.error).toHaveBeenCalledWith(error)
    unsubscribe()
  })

  test('fetch should dispatch fetch if is fetching and current promise is undefined', async () => {
    const key = queryKey()

    const queryFn = async () => {
      await sleep(10)
      return 'data'
    }

    await queryClient.prefetchQuery(key, queryFn)
    const query = queryCache.find(key)!

    query.fetch({
      queryKey: key,
      queryFn,
    })

    // Force promise to undefined
    // because no use case have been identified
    query['promise'] = undefined

    // Spy on private dispatch method
    const dispatchOriginal = query['dispatch']
    const dispatchSpy = jest.fn()
    query['dispatch'] = dispatchSpy

    query.fetch({
      queryKey: key,
      queryFn,
    })

    // Should call dispatch with type set to fetch
    expect(dispatchSpy).toHaveBeenCalledWith({
      meta: undefined,
      type: 'fetch',
    })

    // Clean-up
    await sleep(20)
    query['dispatch'] = dispatchOriginal
  })

  test('constructor should call initialDataUpdatedAt if defined as a function', async () => {
    const key = queryKey()

    const initialDataUpdatedAtSpy = jest.fn()

    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => 'data',
      initialData: 'initial',
      initialDataUpdatedAt: initialDataUpdatedAtSpy,
    })

    expect(initialDataUpdatedAtSpy).toHaveBeenCalled()
  })

  test('queries should be garbage collected even if they never fetched', async () => {
    const key = queryKey()

    queryClient.setQueryDefaults(key, { cacheTime: 10 })

    const fn = jest.fn()

    const unsubscribe = queryClient.getQueryCache().subscribe(fn)

    queryClient.setQueryData(key, 'data')

    await waitFor(() =>
      expect(fn).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'removed',
        }),
      ),
    )

    expect(queryClient.getQueryCache().findAll()).toHaveLength(0)

    unsubscribe()
  })
})
