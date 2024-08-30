import { afterEach, beforeEach, describe, expect, it, test, vi } from 'vitest'
import { waitFor } from '@testing-library/react'
import { QueryObserver, dehydrate, hydrate, isCancelledError } from '..'
import {
  createQueryClient,
  mockOnlineManagerIsOnline,
  mockVisibilityState,
  queryKey,
  setIsServer,
  sleep,
} from './utils'
import type {
  QueryCache,
  QueryClient,
  QueryFunctionContext,
  QueryObserverResult,
} from '..'

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
      queryFn: async () => {
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
    await sleep(50)
    expect(result).toBeUndefined()

    // Reset visibilityState to original value
    visibilityMock.mockRestore()
    window.dispatchEvent(new Event('visibilitychange'))

    // There should not be a result yet
    expect(result).toBeUndefined()

    // By now we should have a value
    await sleep(50)
    expect(result).toBe('data3')
  })

  it('should continue retry after reconnect and resolve all promises', async () => {
    const key = queryKey()

    const onlineMock = mockOnlineManagerIsOnline(false)

    let count = 0
    let result

    const promise = queryClient.fetchQuery({
      queryKey: key,
      queryFn: async () => {
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
    await sleep(50)
    expect(result).toBeUndefined()

    // Reset navigator to original value
    onlineMock.mockReturnValue(true)
    // trigger online event
    queryClient.getQueryCache().onOnline()

    // There should not be a result yet
    expect(result).toBeUndefined()

    // Promise should eventually be resolved
    await promise

    console.log('has finished')
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
      queryFn: async (): Promise<unknown> => {
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
    await sleep(50)
    expect(result).toBeUndefined()

    // Cancel query
    query.cancel()

    // Check if the error is set to the cancelled error
    try {
      await promise
      expect.unreachable()
    } catch {
      expect(isCancelledError(result)).toBe(true)
      expect(result instanceof Error).toBe(true)
    } finally {
      // Reset visibilityState to original value
      visibilityMock.mockRestore()
    }
  })

  test('should provide context to queryFn', async () => {
    const key = queryKey()

    const queryFn = vi
      .fn<
        (
          context: QueryFunctionContext<ReturnType<typeof queryKey>>,
        ) => Promise<'data'>
      >()
      .mockResolvedValue('data')

    queryClient.prefetchQuery({ queryKey: key, queryFn })

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

    queryClient.prefetchQuery({
      queryKey: key,
      queryFn: async () => {
        await sleep(100)
        return 'data'
      },
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

    await sleep(10)

    // Subscribe and unsubscribe to simulate cancellation because the last observer unsubscribed
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      enabled: false,
    })
    const unsubscribe = observer.subscribe(() => undefined)
    unsubscribe()

    await sleep(100)

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

    await sleep(100)

    expect(signal.aborted).toBe(true)
    expect(onAbort).toHaveBeenCalledTimes(1)
    expect(abortListener).toHaveBeenCalledTimes(1)
    expect(isCancelledError(error)).toBe(true)
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

    await sleep(100)

    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(isCancelledError(error)).toBe(true)
  })

  test('should not error if reset while pending', async () => {
    const key = queryKey()

    const queryFn = vi.fn<(...args: Array<unknown>) => unknown>()

    queryFn.mockImplementation(async () => {
      await sleep(10)
      throw new Error()
    })

    queryClient.fetchQuery({ queryKey: key, queryFn, retry: 3, retryDelay: 10 })

    // Ensure the query is pending
    const query = queryCache.find({ queryKey: key })!
    expect(query.state.status).toBe('pending')

    // Reset the query while it is pending
    query.reset()

    await sleep(100)

    // The query should
    expect(queryFn).toHaveBeenCalledTimes(1) // have been called,
    expect(query.state.error).toBe(null) // not have an error, and
    expect(query.state.fetchStatus).toBe('idle') // not be loading any longer
  })

  test('should reset to default state when created from hydration', async () => {
    const client = createQueryClient()
    await client.prefetchQuery({
      queryKey: ['string'],
      queryFn: () => Promise.resolve('string'),
    })

    const dehydrated = dehydrate(client)

    const hydrationClient = createQueryClient()
    hydrate(hydrationClient, dehydrated)

    expect(hydrationClient.getQueryData(['string'])).toBe('string')

    const query = hydrationClient.getQueryCache().find({ queryKey: ['string'] })
    query?.reset()

    expect(hydrationClient.getQueryData(['string'])).toBe(undefined)
  })

  test('should be able to refetch a cancelled query', async () => {
    const key = queryKey()

    const queryFn = vi.fn<(...args: Array<unknown>) => unknown>()

    queryFn.mockImplementation(async () => {
      await sleep(50)
      return 'data'
    })

    queryClient.prefetchQuery({ queryKey: key, queryFn })
    const query = queryCache.find({ queryKey: key })!
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
    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: async () => 'data',
    })
    const query = queryCache.find({ queryKey: key })!
    query.cancel()
    await sleep(10)
    expect(query.state.data).toBe('data')
  })

  test('cancelling a rejected query should not have any effect', async () => {
    const key = queryKey()
    const error = new Error('error')

    await queryClient.prefetchQuery({
      queryKey: key,
      queryFn: async (): Promise<unknown> => {
        throw error
      },
    })
    const query = queryCache.find({ queryKey: key })!
    query.cancel()
    await sleep(10)

    expect(query.state.error).toBe(error)
    expect(isCancelledError(query.state.error)).toBe(false)
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
      queryFn: async () => {
        await sleep(10)
        return Promise.reject<unknown>('reject')
      },
      retry: false,
    })
    expect(query.state.status).toBe('error')

    await sleep(100)
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
    await waitFor(() =>
      expect(queryCache.find({ queryKey: key })).toBeUndefined(),
    )
    const unsubscribe2 = observer.subscribe(() => undefined)
    unsubscribe2()

    await waitFor(() =>
      expect(queryCache.find({ queryKey: key })).toBeUndefined(),
    )
    expect(count).toBe(1)
  })

  test('should be garbage collected when unsubscribed to', async () => {
    const key = queryKey()
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: async () => 'data',
      gcTime: 0,
    })
    expect(queryCache.find({ queryKey: key })).toBeDefined()
    const unsubscribe = observer.subscribe(() => undefined)
    expect(queryCache.find({ queryKey: key })).toBeDefined()
    unsubscribe()
    await waitFor(() =>
      expect(queryCache.find({ queryKey: key })).toBeUndefined(),
    )
  })

  test('should be garbage collected later when unsubscribed and query is fetching', async () => {
    const key = queryKey()
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: async () => {
        await sleep(20)
        return 'data'
      },
      gcTime: 10,
    })
    const unsubscribe = observer.subscribe(() => undefined)
    await sleep(20)
    expect(queryCache.find({ queryKey: key })).toBeDefined()
    observer.refetch()
    unsubscribe()
    await sleep(10)
    // unsubscribe should not remove even though gcTime has elapsed b/c query is still fetching
    expect(queryCache.find({ queryKey: key })).toBeDefined()
    await sleep(10)
    // should be removed after an additional staleTime wait
    await waitFor(() =>
      expect(queryCache.find({ queryKey: key })).toBeUndefined(),
    )
  })

  test('should not be garbage collected unless there are no subscribers', async () => {
    const key = queryKey()
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: async () => 'data',
      gcTime: 0,
    })
    expect(queryCache.find({ queryKey: key })).toBeDefined()
    const unsubscribe = observer.subscribe(() => undefined)
    await sleep(100)
    expect(queryCache.find({ queryKey: key })).toBeDefined()
    unsubscribe()
    await sleep(100)
    expect(queryCache.find({ queryKey: key })).toBeUndefined()
    queryClient.setQueryData(key, 'data')
    await sleep(100)
    expect(queryCache.find({ queryKey: key })).toBeDefined()
  })

  test('should return proper count of observers', async () => {
    const key = queryKey()
    const options = { queryKey: key, queryFn: async () => 'data' }
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

  test('should refetch the observer when online method is called', async () => {
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

    const queryFn = async () => {
      await sleep(10)
      return 'data'
    }

    const updates: Array<string> = []

    await queryClient.prefetchQuery({ queryKey: key, queryFn })
    const query = queryCache.find({ queryKey: key })!

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      updates.push(event.type)
    })

    void query.fetch({
      queryKey: key,
      queryFn,
    })

    await query.fetch({
      queryKey: key,
      queryFn,
    })

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

    await sleep(10)
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

    await sleep(10)

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

  test('should always revert to idle state (#5958)', async () => {
    let mockedData = [1]

    const key = queryKey()

    const queryFn = vi
      .fn<
        (
          context: QueryFunctionContext<ReturnType<typeof queryKey>>,
        ) => Promise<unknown>
      >()
      .mockImplementation(({ signal }) => {
        return new Promise((resolve, reject) => {
          const abortListener = () => {
            clearTimeout(timerId)
            reject(signal.reason)
          }
          signal.addEventListener('abort', abortListener)

          const timerId = setTimeout(() => {
            signal.removeEventListener('abort', abortListener)
            resolve(mockedData.join(' - '))
          }, 50)
        })
      })

    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn,
    })
    const unsubscribe = observer.subscribe(() => undefined)
    await sleep(60) // let it resolve

    mockedData = [1, 2] // update "server" state in the background

    queryClient.invalidateQueries({ queryKey: key })
    await sleep(1)
    queryClient.invalidateQueries({ queryKey: key })
    await sleep(1)
    unsubscribe() // unsubscribe to simulate unmount

    // set up a new observer to simulate a mount of new component
    const newObserver = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn,
    })

    const spy = vi.fn()
    newObserver.subscribe(({ data }) => spy(data))
    await sleep(60) // let it resolve
    expect(spy).toHaveBeenCalledWith('1 - 2')
  })

  it('should have an error status when queryFn data is not serializable', async () => {
    const consoleMock = vi.spyOn(console, 'error')

    consoleMock.mockImplementation(() => undefined)

    const key = queryKey()

    const queryFn = vi.fn()

    queryFn.mockImplementation(async () => {
      await sleep(10)

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

      return data
    })

    await queryClient.prefetchQuery({ queryKey: key, queryFn })

    const query = queryCache.find({ queryKey: key })!

    expect(queryFn).toHaveBeenCalledTimes(1)

    expect(consoleMock).toHaveBeenCalledWith(
      expect.stringContaining(
        'StructuralSharing requires data to be JSON serializable',
      ),
    )

    expect(query.state.status).toBe('error')

    consoleMock.mockRestore()
  })
})
