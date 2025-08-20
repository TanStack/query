import { afterEach, beforeEach, describe, expect, it, test, vi } from 'vitest'
import {
  mockVisibilityState,
  queryKey,
  sleep,
} from '@tanstack/query-test-utils'
import {
  CancelledError,
  Query,
  QueryClient,
  QueryObserver,
  dehydrate,
  hydrate,
} from '..'
import { hashQueryKeyByOptions } from '../utils'
import { mockOnlineManagerIsOnline, setIsServer } from './utils'
import type {
  QueryCache,
  QueryFunctionContext,
  QueryKey,
  QueryObserverResult,
} from '..'

describe('query', () => {
  let queryClient: QueryClient
  let queryCache: QueryCache

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
    queryCache = queryClient.getQueryCache()
    queryClient.mount()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  test('should use the longest garbage collection time it has seen', async () => {
    const key = queryKey()
    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => 'data',
      gcTime: 100,
    })
    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => 'data',
      gcTime: 200,
    })
    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => 'data',
      gcTime: 10,
    })
    const query = queryCache.find({ queryKey: key })!
    expect(query.gcTime).toBe(200)
  })

  it('should continue retry after focus regain and resolve all promises', async () => {
    const key = queryKey()

    // make page unfocused
    const visibilityMock = mockVisibilityState('hidden')

    let count = 0
    let result

    const promise = queryClient.fetchQuery({
      queryKey: key,
      queryFn: () => {
        count++

        if (count === 3) {
          return `data${count}`
        }

        throw new Error(`error${count}`)
      },
      retry: 3,
      retryDelay: 1,
    })

    promise.then((data) => {
      result = data
    })

    // Check if we do not have a result
    expect(result).toBeUndefined()

    // Check if the query is really paused
    await vi.advanceTimersByTimeAsync(50)
    expect(result).toBeUndefined()

    // Reset visibilityState to original value
    visibilityMock.mockRestore()
    window.dispatchEvent(new Event('visibilitychange'))

    // There should not be a result yet
    expect(result).toBeUndefined()

    // By now we should have a value
    await vi.advanceTimersByTimeAsync(50)
    expect(result).toBe('data3')
  })

  it('should continue retry after reconnect and resolve all promises', async () => {
    const key = queryKey()

    const onlineMock = mockOnlineManagerIsOnline(false)

    let count = 0
    let result

    const promise = queryClient.fetchQuery({
      queryKey: key,
      queryFn: () => {
        count++

        if (count === 3) {
          return `data${count}`
        }

        throw new Error(`error${count}`)
      },
      retry: 3,
      retryDelay: 1,
    })

    promise.then((data) => {
      result = data
    })

    // Check if we do not have a result
    expect(result).toBeUndefined()

    // Check if the query is really paused
    await vi.advanceTimersByTimeAsync(1)
    expect(result).toBeUndefined()

    // Reset navigator to original value
    onlineMock.mockReturnValue(true)
    // trigger online event
    queryClient.getQueryCache().onOnline()

    // There should not be a result yet
    expect(result).toBeUndefined()

    // Promise should eventually be resolved
    await vi.advanceTimersByTimeAsync(2)
    expect(result).toBe('data3')
    onlineMock.mockRestore()
  })

  it('should throw a CancelledError when a paused query is cancelled', async () => {
    const key = queryKey()

    // make page unfocused
    const visibilityMock = mockVisibilityState('hidden')

    let count = 0
    let result: unknown

    const promise = queryClient.fetchQuery({
      queryKey: key,
      queryFn: (): Promise<unknown> => {
        count++
        throw new Error(`error${count}`)
      },
      retry: 3,
      retryDelay: 1,
    })

    promise.catch((data) => {
      result = data
    })

    const query = queryCache.find({ queryKey: key })!

    // Check if the query is really paused
    await vi.advanceTimersByTimeAsync(50)
    expect(result).toBeUndefined()

    // Cancel query
    query.cancel()

    // Check if the error is set to the cancelled error
    try {
      await promise
      expect.unreachable()
    } catch {
      expect(result).toBeInstanceOf(CancelledError)
    } finally {
      // Reset visibilityState to original value
      visibilityMock.mockRestore()
    }
  })

  test('should not throw a CancelledError when fetchQuery is in progress and the last observer unsubscribes when AbortSignal is consumed', async () => {
    const key = queryKey()

    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: async () => {
        await sleep(100)
        return 'data'
      },
    })

    const unsubscribe = observer.subscribe(() => undefined)
    await vi.advanceTimersByTimeAsync(100)

    expect(queryCache.find({ queryKey: key })?.state.data).toBe('data')

    const promise = queryClient.fetchQuery({
      queryKey: key,
      queryFn: async ({ signal }) => {
        await sleep(100)
        return 'data2' + String(signal)
      },
    })

    // Ensure the fetch is in progress
    await vi.advanceTimersByTimeAsync(10)

    // Unsubscribe while fetch is in progress
    unsubscribe()
    // await queryClient.cancelQueries()

    await vi.advanceTimersByTimeAsync(90)

    // Fetch should complete successfully without throwing a CancelledError
    await expect(promise).resolves.toBe('data')

    expect(queryCache.find({ queryKey: key })?.state.data).toBe('data')
  })

  test('should provide context to queryFn', () => {
    const key = queryKey()

    const queryFn = vi
      .fn<
        (
          context: QueryFunctionContext<ReturnType<typeof queryKey>>,
        ) => Promise<'data'>
      >()
      .mockResolvedValue('data')

    queryClient.prefetchQuery({ queryKey: key, queryFn })

    expect(queryFn).toHaveBeenCalledTimes(1)
    const args = queryFn.mock.calls[0]![0]
    expect(args).toBeDefined()
    expect(args.pageParam).toBeUndefined()
    expect(args.queryKey).toEqual(key)
    expect(args.signal).toBeInstanceOf(AbortSignal)
    expect(args.client).toEqual(queryClient)
  })

  test('should continue if cancellation is not supported and signal is not consumed', async () => {
    const key = queryKey()

    queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(100).then(() => 'data'),
    })

    await vi.advanceTimersByTimeAsync(10)

    // Subscribe and unsubscribe to simulate cancellation because the last observer unsubscribed
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      enabled: false,
    })
    const unsubscribe = observer.subscribe(() => undefined)
    unsubscribe()

    await vi.advanceTimersByTimeAsync(90)

    const query = queryCache.find({ queryKey: key })!

    expect(query.state).toMatchObject({
      data: 'data',
      status: 'success',
      dataUpdateCount: 1,
    })
  })

  test('should not continue when last observer unsubscribed if the signal was consumed', async () => {
    const key = queryKey()

    queryClient.prefetchQuery({
      queryKey: key,
      queryFn: async ({ signal }) => {
        await sleep(100)
        return signal.aborted ? 'aborted' : 'data'
      },
    })

    await vi.advanceTimersByTimeAsync(10)

    // Subscribe and unsubscribe to simulate cancellation because the last observer unsubscribed
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      enabled: false,
    })
    const unsubscribe = observer.subscribe(() => undefined)
    unsubscribe()

    await vi.advanceTimersByTimeAsync(90)

    const query = queryCache.find({ queryKey: key })!

    expect(query.state).toMatchObject({
      data: undefined,
      status: 'pending',
      fetchStatus: 'idle',
    })
  })

  test('should provide an AbortSignal to the queryFn that provides info about the cancellation state', async () => {
    const key = queryKey()

    const queryFn =
      vi.fn<
        (
          context: QueryFunctionContext<ReturnType<typeof queryKey>>,
        ) => Promise<unknown>
      >()
    const onAbort = vi.fn()
    const abortListener = vi.fn()
    let error

    queryFn.mockImplementation(async ({ signal }) => {
      signal.onabort = onAbort
      signal.addEventListener('abort', abortListener)
      await sleep(10)
      signal.onabort = null
      signal.removeEventListener('abort', abortListener)
      throw new Error()
    })

    const promise = queryClient.fetchQuery({
      queryKey: key,
      queryFn,
      retry: 3,
      retryDelay: 10,
    })

    promise.catch((e) => {
      error = e
    })

    const query = queryCache.find({ queryKey: key })!

    expect(queryFn).toHaveBeenCalledTimes(1)

    const signal = queryFn.mock.calls[0]![0].signal
    expect(signal.aborted).toBe(false)
    expect(onAbort).not.toHaveBeenCalled()
    expect(abortListener).not.toHaveBeenCalled()

    query.cancel()

    await vi.advanceTimersByTimeAsync(100)

    expect(signal.aborted).toBe(true)
    expect(onAbort).toHaveBeenCalledTimes(1)
    expect(abortListener).toHaveBeenCalledTimes(1)
    expect(error).toBeInstanceOf(CancelledError)
  })

  test('should not continue if explicitly cancelled', async () => {
    const key = queryKey()

    const queryFn = vi.fn<(...args: Array<unknown>) => unknown>()

    queryFn.mockImplementation(async () => {
      await sleep(10)
      throw new Error()
    })

    let error

    const promise = queryClient.fetchQuery({
      queryKey: key,
      queryFn,
      retry: 3,
      retryDelay: 10,
    })

    promise.catch((e) => {
      error = e
    })

    const query = queryCache.find({ queryKey: key })!
    query.cancel()

    await vi.advanceTimersByTimeAsync(100)

    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(error).toBeInstanceOf(CancelledError)
  })

  test('should not error if reset while pending', async () => {
    const key = queryKey()

    const queryFn = vi.fn<(...args: Array<unknown>) => unknown>()

    queryFn.mockImplementation(async () => {
      await sleep(10)
      throw new Error()
    })

    let error

    queryClient
      .fetchQuery({
        queryKey: key,
        queryFn,
        retry: 3,
        retryDelay: 10,
      })
      .catch((e) => {
        error = e
      })

    // Ensure the query is pending
    const query = queryCache.find({ queryKey: key })!
    expect(query.state.status).toBe('pending')

    // Reset the query while it is pending
    query.reset()

    await vi.advanceTimersByTimeAsync(100)

    // The query should
    expect(queryFn).toHaveBeenCalledTimes(1) // have been called,
    expect(query.state.error).toBe(null) // not have an error, and
    expect(query.state.fetchStatus).toBe('idle') // not be loading any longer
    expect(query.state.data).toBe(undefined) // have no data

    // the call to fetchQuery must reject
    // because it was reset and not reverted
    // so it would resolve with undefined otherwise
    expect(error).toBeInstanceOf(CancelledError)
  })

  test('should reset to default state when created from hydration', async () => {
    const client = new QueryClient()
    await client.prefetchQuery({
      queryKey: ['string'],
      queryFn: () => Promise.resolve('string'),
    })

    const dehydrated = dehydrate(client)

    const hydrationClient = new QueryClient()
    hydrate(hydrationClient, dehydrated)

    expect(hydrationClient.getQueryData(['string'])).toBe('string')

    const query = hydrationClient.getQueryCache().find({ queryKey: ['string'] })
    query?.reset()

    expect(hydrationClient.getQueryData(['string'])).toBe(undefined)
  })

  test('should be able to refetch a cancelled query', async () => {
    const key = queryKey()

    const queryFn = vi.fn<(...args: Array<unknown>) => unknown>()

    queryFn.mockImplementation(() => sleep(50).then(() => 'data'))

    queryClient.prefetchQuery({ queryKey: key, queryFn })
    const query = queryCache.find({ queryKey: key })!
    await vi.advanceTimersByTimeAsync(10)
    query.cancel()
    await vi.advanceTimersByTimeAsync(100)

    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(query.state.error).toBeInstanceOf(CancelledError)
    const result = query.fetch()
    await vi.advanceTimersByTimeAsync(50)
    await expect(result).resolves.toBe('data')
    expect(query.state.error).toBe(null)
    expect(queryFn).toHaveBeenCalledTimes(2)
  })

  test('cancelling a resolved query should not have any effect', async () => {
    const key = queryKey()
    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => 'data',
    })
    const query = queryCache.find({ queryKey: key })!
    query.cancel()
    await vi.advanceTimersByTimeAsync(10)
    expect(query.state.data).toBe('data')
  })

  test('cancelling a rejected query should not have any effect', async () => {
    const key = queryKey()
    const error = new Error('error')

    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => Promise.reject(error),
    })
    const query = queryCache.find({ queryKey: key })!
    query.cancel()
    await vi.advanceTimersByTimeAsync(10)

    expect(query.state.error).toBe(error)
    expect(query.state.error).not.toBeInstanceOf(CancelledError)
  })

  test('the previous query status should be kept when refetching', async () => {
    const key = queryKey()

    await queryClient.prefetchQuery({ queryKey: key, queryFn: () => 'data' })
    const query = queryCache.find({ queryKey: key })!
    expect(query.state.status).toBe('success')

    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => Promise.reject<string>('reject'),
      retry: false,
    })
    expect(query.state.status).toBe('error')

    queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => sleep(10).then(() => Promise.reject<unknown>('reject')),
      retry: false,
    })
    expect(query.state.status).toBe('error')

    await vi.advanceTimersByTimeAsync(10)
    expect(query.state.status).toBe('error')
  })

  test('queries with gcTime 0 should be removed immediately after unsubscribing', async () => {
    const key = queryKey()
    let count = 0
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: () => {
        count++
        return 'data'
      },
      gcTime: 0,
      staleTime: Infinity,
    })
    const unsubscribe1 = observer.subscribe(() => undefined)
    unsubscribe1()

    await vi.advanceTimersByTimeAsync(0)
    expect(queryCache.find({ queryKey: key })).toBeUndefined()
    const unsubscribe2 = observer.subscribe(() => undefined)
    unsubscribe2()

    await vi.advanceTimersByTimeAsync(0)
    expect(queryCache.find({ queryKey: key })).toBeUndefined()
    expect(count).toBe(1)
  })

  test('should be garbage collected when unsubscribed to', async () => {
    const key = queryKey()
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: () => 'data',
      gcTime: 0,
    })
    expect(queryCache.find({ queryKey: key })).toBeDefined()
    const unsubscribe = observer.subscribe(() => undefined)
    expect(queryCache.find({ queryKey: key })).toBeDefined()
    unsubscribe()

    await vi.advanceTimersByTimeAsync(0)
    expect(queryCache.find({ queryKey: key })).toBeUndefined()
  })

  test('should be garbage collected later when unsubscribed and query is fetching', async () => {
    const key = queryKey()
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: () => sleep(20).then(() => 'data'),
      gcTime: 10,
    })
    const unsubscribe = observer.subscribe(() => undefined)
    await vi.advanceTimersByTimeAsync(20)
    expect(queryCache.find({ queryKey: key })).toBeDefined()
    observer.refetch()
    unsubscribe()
    // unsubscribe should not remove even though gcTime has elapsed b/c query is still fetching
    expect(queryCache.find({ queryKey: key })).toBeDefined()
    // should be removed after an additional staleTime wait
    await vi.advanceTimersByTimeAsync(30)
    expect(queryCache.find({ queryKey: key })).toBeUndefined()
  })

  test('should not be garbage collected unless there are no subscribers', async () => {
    const key = queryKey()
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: () => 'data',
      gcTime: 0,
    })
    expect(queryCache.find({ queryKey: key })).toBeDefined()
    const unsubscribe = observer.subscribe(() => undefined)
    await vi.advanceTimersByTimeAsync(100)
    expect(queryCache.find({ queryKey: key })).toBeDefined()
    unsubscribe()
    await vi.advanceTimersByTimeAsync(100)
    expect(queryCache.find({ queryKey: key })).toBeUndefined()
    queryClient.setQueryData(key, 'data')
    await vi.advanceTimersByTimeAsync(100)
    expect(queryCache.find({ queryKey: key })).toBeDefined()
  })

  test('should return proper count of observers', () => {
    const key = queryKey()
    const options = { queryKey: key, queryFn: () => 'data' }
    const observer = new QueryObserver(queryClient, options)
    const observer2 = new QueryObserver(queryClient, options)
    const observer3 = new QueryObserver(queryClient, options)
    const query = queryCache.find({ queryKey: key })

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

    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => 'data',
      meta,
    })

    const query = queryCache.find({ queryKey: key })!

    expect(query.meta).toBe(meta)
    expect(query.options.meta).toBe(meta)
  })

  test('updates meta object on change', async () => {
    const meta = {
      it: 'works',
    }

    const key = queryKey()
    const queryFn = () => 'data'

    await queryClient.prefetchQuery({ queryKey: key, queryFn, meta })

    await queryClient.prefetchQuery({ queryKey: key, queryFn, meta: undefined })

    const query = queryCache.find({ queryKey: key })!

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

    await queryClient.prefetchQuery({ queryKey: key, queryFn })

    const query = queryCache.find({ queryKey: key })!

    expect(query.meta).toBe(meta)
  })

  test('provides meta object inside query function', async () => {
    const meta = {
      it: 'works',
    }

    const queryFn = vi.fn(() => 'data')

    const key = queryKey()

    await queryClient.prefetchQuery({ queryKey: key, queryFn, meta })

    expect(queryFn).toBeCalledWith(
      expect.objectContaining({
        meta,
      }),
    )
  })

  test('should refetch the observer when online method is called', () => {
    const key = queryKey()

    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: () => 'data',
    })

    const refetchSpy = vi.spyOn(observer, 'refetch')
    const unsubscribe = observer.subscribe(() => undefined)
    queryCache.onOnline()

    // Should refetch the observer
    expect(refetchSpy).toHaveBeenCalledTimes(1)

    unsubscribe()
    refetchSpy.mockRestore()
  })

  test('should not add an existing observer', async () => {
    const key = queryKey()

    await queryClient.prefetchQuery({ queryKey: key, queryFn: () => 'data' })
    const query = queryCache.find({ queryKey: key })!
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

    await queryClient.prefetchQuery({ queryKey: key, queryFn: () => 'data' })
    const query = queryCache.find({ queryKey: key })!
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
    })
    expect(query.getObserversCount()).toEqual(0)

    const notifySpy = vi.spyOn(queryCache, 'notify')
    expect(() => query.removeObserver(observer)).not.toThrow()
    expect(notifySpy).not.toHaveBeenCalled()

    notifySpy.mockRestore()
  })

  test('should not change state on invalidate() if already invalidated', async () => {
    const key = queryKey()

    await queryClient.prefetchQuery({ queryKey: key, queryFn: () => 'data' })
    const query = queryCache.find({ queryKey: key })!

    query.invalidate()
    expect(query.state.isInvalidated).toBeTruthy()

    const previousState = query.state

    query.invalidate()

    expect(query.state).toBe(previousState)
  })

  test('fetch should not dispatch "fetch" query is already fetching', async () => {
    const key = queryKey()

    const queryFn = () => sleep(10).then(() => 'data')

    const updates: Array<string> = []

    queryClient.prefetchQuery({ queryKey: key, queryFn })
    await vi.advanceTimersByTimeAsync(10)
    const query = queryCache.find({ queryKey: key })!

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      updates.push(event.type)
    })

    void query.fetch({
      queryKey: key,
      queryFn,
    })

    query.fetch({
      queryKey: key,
      queryFn,
    })
    await vi.advanceTimersByTimeAsync(10)

    expect(updates).toEqual([
      'updated', // type: 'fetch'
      'updated', // type: 'success'
    ])
    unsubscribe()
  })

  test('fetch should throw an error if the queryFn is not defined', async () => {
    const key = queryKey()

    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: undefined,
      retry: false,
    })

    const unsubscribe = observer.subscribe(() => undefined)

    await vi.advanceTimersByTimeAsync(10)
    const query = queryCache.find({ queryKey: key })!
    expect(observer.getCurrentResult()).toMatchObject({
      status: 'error',
      error: new Error(`Missing queryFn: '${query.queryHash}'`),
    })
    unsubscribe()
  })

  test('fetch should dispatch an error if the queryFn returns undefined', async () => {
    const consoleMock = vi.spyOn(console, 'error')
    consoleMock.mockImplementation(() => undefined)
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

    await vi.advanceTimersByTimeAsync(10)

    const error = new Error(`${JSON.stringify(key)} data is undefined`)

    expect(observerResult).toMatchObject({
      isError: true,
      error,
    })

    expect(consoleMock).toHaveBeenCalledWith(
      `Query data cannot be undefined. Please make sure to return a value other than undefined from your query function. Affected query key: ["${key}"]`,
    )
    unsubscribe()
    consoleMock.mockRestore()
  })

  it('should not retry on the server', async () => {
    const resetIsServer = setIsServer(true)

    const key = queryKey()
    let count = 0

    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: () => {
        count++
        return Promise.reject(new Error('error'))
      },
    })

    await observer.refetch()

    expect(count).toBe(1)

    resetIsServer()
  })

  test('constructor should call initialDataUpdatedAt if defined as a function', async () => {
    const key = queryKey()

    const initialDataUpdatedAtSpy = vi.fn()

    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => 'data',
      initialData: 'initial',
      initialDataUpdatedAt: initialDataUpdatedAtSpy,
    })

    expect(initialDataUpdatedAtSpy).toHaveBeenCalled()
  })

  test('should work with initialDataUpdatedAt set to zero', async () => {
    const key = queryKey()

    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => 'data',
      staleTime: Infinity,
      initialData: 'initial',
      initialDataUpdatedAt: 0,
    })

    expect(queryCache.find({ queryKey: key })?.state).toMatchObject({
      data: 'initial',
      status: 'success',
      dataUpdatedAt: 0,
    })
  })

  test('queries should be garbage collected even if they never fetched', async () => {
    const key = queryKey()

    queryClient.setQueryDefaults(key, { gcTime: 10 })

    const fn = vi.fn()

    const unsubscribe = queryClient.getQueryCache().subscribe(fn)

    queryClient.setQueryData(key, 'data')

    await vi.advanceTimersByTimeAsync(10)
    expect(fn).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'removed',
      }),
    )

    expect(queryClient.getQueryCache().findAll()).toHaveLength(0)

    unsubscribe()
  })

  test('should always revert to idle state (#5968)', async () => {
    let mockedData = [1]

    const key = queryKey()

    const queryFn = vi
      .fn<
        (
          context: QueryFunctionContext<ReturnType<typeof queryKey>>,
        ) => Promise<unknown>
      >()
      .mockImplementation(
        ({ signal }) =>
          new Promise((resolve, reject) => {
            const abortListener = () => {
              clearTimeout(timerId)
              reject(signal.reason)
            }
            signal.addEventListener('abort', abortListener)

            const timerId = setTimeout(() => {
              signal.removeEventListener('abort', abortListener)
              resolve(mockedData.join(' - '))
            }, 50)
          }),
      )

    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn,
    })
    const unsubscribe = observer.subscribe(() => undefined)
    await vi.advanceTimersByTimeAsync(50) // let it resolve

    expect(observer.getCurrentResult().data).toBe('1')
    expect(observer.getCurrentResult().fetchStatus).toBe('idle')

    mockedData = [1, 2] // update "server" state in the background

    void queryClient.invalidateQueries({ queryKey: key })
    await vi.advanceTimersByTimeAsync(5)
    void queryClient.invalidateQueries({ queryKey: key })
    await vi.advanceTimersByTimeAsync(5)
    unsubscribe() // unsubscribe to simulate unmount
    await vi.advanceTimersByTimeAsync(5)

    // reverted to previous data and idle fetchStatus
    expect(queryCache.find({ queryKey: key })?.state).toMatchObject({
      status: 'success',
      data: '1',
      fetchStatus: 'idle',
    })

    // set up a new observer to simulate a mount of new component
    const newObserver = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn,
    })
    const spy = vi.fn()
    newObserver.subscribe(({ data }) => spy(data))
    await vi.advanceTimersByTimeAsync(60) // let it resolve
    expect(spy).toHaveBeenCalledWith('1 - 2')
  })

  test('should not reject a promise when silently cancelled in the background', async () => {
    const key = queryKey()

    let x = 0

    queryClient.setQueryData(key, 'initial')
    const queryFn = vi.fn().mockImplementation(async () => {
      await sleep(100)
      return 'data' + x
    })

    const promise = queryClient.fetchQuery({
      queryKey: key,
      queryFn,
    })

    await vi.advanceTimersByTimeAsync(10)

    expect(queryFn).toHaveBeenCalledTimes(1)

    x = 1

    // cancel ongoing re-fetches
    void queryClient.refetchQueries({ queryKey: key }, { cancelRefetch: true })

    await vi.advanceTimersByTimeAsync(10)

    // The promise should not reject
    await vi.waitFor(() => expect(promise).resolves.toBe('data1'))

    expect(queryFn).toHaveBeenCalledTimes(2)
  })

  it('should have an error log when queryFn data is not serializable', async () => {
    const consoleMock = vi.spyOn(console, 'error')

    consoleMock.mockImplementation(() => undefined)

    const key = queryKey()

    const queryFn = vi.fn()

    const data: Array<{
      id: number
      name: string
      link: null | { id: number; name: string; link: unknown }
    }> = Array.from({ length: 5 })
      .fill(null)
      .map((_, index) => ({
        id: index,
        name: `name-${index}`,
        link: null,
      }))

    if (data[0] && data[1]) {
      data[0].link = data[1]
      data[1].link = data[0]
    }

    queryFn.mockImplementation(() => sleep(10).then(() => data))

    queryClient.prefetchQuery({
      queryKey: key,
      queryFn,
      initialData: structuredClone(data),
    })
    await vi.advanceTimersByTimeAsync(10)

    const query = queryCache.find({ queryKey: key })!

    expect(queryFn).toHaveBeenCalledTimes(1)

    expect(query.state.status).toBe('error')
    expect(
      query.state.error?.message.includes('Maximum call stack size exceeded'),
    ).toBeTruthy()

    expect(consoleMock).toHaveBeenCalledWith(
      expect.stringContaining(
        'Structural sharing requires data to be JSON serializable',
      ),
    )

    consoleMock.mockRestore()
  })

  it('should have an error status when setData has any error inside', async () => {
    const key = queryKey()

    const queryFn = vi
      .fn<() => Promise<string>>()
      .mockImplementation(() => sleep(10).then(() => 'data'))

    queryClient.prefetchQuery({
      queryKey: key,
      queryFn,
      structuralSharing: () => {
        throw Error('Any error')
      },
    })

    const query = queryCache.find({ queryKey: key })!

    expect(queryFn).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(10)
    expect(query.state.status).toBe('error')
  })

  test('should use persister if provided', async () => {
    const key = queryKey()

    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: () => 'data',
      persister: () => Promise.resolve('persisted data'),
    })

    const query = queryCache.find({ queryKey: key })!
    expect(query.state.data).toBe('persisted data')
  })

  test('should use queryFn from observer if not provided in options', async () => {
    const key = queryKey()
    const queryFn = () => Promise.resolve('data')
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: queryFn,
    })

    const query = new Query({
      client: queryClient,
      queryKey: key,
      queryHash: hashQueryKeyByOptions(key),
    })

    query.addObserver(observer)

    await query.fetch()
    const result = await query.state.data
    expect(result).toBe('data')
    expect(query.options.queryFn).toBe(queryFn)
  })

  test('should log error when queryKey is not an array', async () => {
    const consoleMock = vi.spyOn(console, 'error')
    const key: unknown = 'string-key'

    await queryClient.prefetchQuery({
      queryKey: key as QueryKey,
      queryFn: () => 'data',
    })

    expect(consoleMock).toHaveBeenCalledWith(
      "As of v4, queryKey needs to be an Array. If you are using a string like 'repoData', please change it to an Array, e.g. ['repoData']",
    )

    consoleMock.mockRestore()
  })

  test('should call initialData function when it is a function', () => {
    const key = queryKey()
    const initialDataFn = vi.fn(() => 'initial data')

    const query = new Query({
      client: queryClient,
      queryKey: key,
      queryHash: hashQueryKeyByOptions(key),
      options: {
        queryFn: () => 'data',
        initialData: initialDataFn,
      },
    })

    expect(initialDataFn).toHaveBeenCalledTimes(1)
    expect(query.state.data).toBe('initial data')
  })

  test('should not override fetching state when revert happens after new observer subscribes', async () => {
    const key = queryKey()

    const queryFn = vi.fn(async ({ signal: _signal }) => {
      await sleep(50)
      return 'data'
    })

    const query = new Query({
      client: queryClient,
      queryKey: key,
      queryHash: hashQueryKeyByOptions(key),
      options: { queryFn },
    })

    const observer1 = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn,
    })

    query.addObserver(observer1)
    const promise1 = query.fetch()

    await vi.advanceTimersByTimeAsync(10)

    query.removeObserver(observer1)

    const observer2 = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn,
    })

    query.addObserver(observer2)

    query.fetch()

    await promise1.catch(() => {})

    await Promise.resolve()

    expect(query.state.fetchStatus).toBe('fetching')
  })

  test('should throw CancelledError when revert happens with no data after observer removal', async () => {
    const key = queryKey()

    const queryFn = vi.fn(async ({ signal: _signal }) => {
      await sleep(50)
      return 'data'
    })

    const query = new Query({
      client: queryClient,
      queryKey: key,
      queryHash: hashQueryKeyByOptions(key),
      options: { queryFn },
    })

    const observer1 = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn,
    })

    query.addObserver(observer1)
    const promise1 = query.fetch()

    await vi.advanceTimersByTimeAsync(5)

    query.removeObserver(observer1)

    const observer2 = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn,
    })

    query.addObserver(observer2)
    query.fetch()

    await expect(promise1).rejects.toThrow(CancelledError)

    expect(query.state.fetchStatus).toBe('fetching')

    await vi.advanceTimersByTimeAsync(50)
    expect(query.state.data).toBe('data')
  })
})
