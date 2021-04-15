import {
  sleep,
  queryKey,
  mockVisibilityState,
  mockConsoleError,
} from '../../react/tests/utils'
import {
  QueryCache,
  QueryClient,
  QueryObserver,
  isCancelledError,
  isError,
  onlineManager,
} from '../..'

describe('query', () => {
  let queryClient: QueryClient
  let queryCache: QueryCache

  beforeEach(() => {
    queryClient = new QueryClient()
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

    const originalVisibilityState = document.visibilityState

    // make page unfocused
    mockVisibilityState('hidden')

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
      }
    )

    promise.then(data => {
      result = data
    })

    // Check if we do not have a result
    expect(result).toBeUndefined()

    // Check if the query is really paused
    await sleep(50)
    expect(result).toBeUndefined()

    // Reset visibilityState to original value
    mockVisibilityState(originalVisibilityState)
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
      }
    )

    promise.then(data => {
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

    // By now we should have a value
    await sleep(50)
    expect(result).toBe('data3')
  })

  it('should throw a CancelledError when a paused query is cancelled', async () => {
    const key = queryKey()

    const originalVisibilityState = document.visibilityState

    // make page unfocused
    mockVisibilityState('hidden')

    let count = 0
    let result

    const promise = queryClient.fetchQuery(
      key,
      async () => {
        count++
        throw new Error(`error${count}`)
      },
      {
        retry: 3,
        retryDelay: 1,
      }
    )

    promise.catch(data => {
      result = data
    })

    const query = queryCache.find(key)!

    // Check if the query is really paused
    await sleep(50)
    expect(result).toBeUndefined()

    // Cancel query
    query.cancel()

    // Check if the error is set to the cancelled error
    await sleep(0)
    expect(isCancelledError(result)).toBe(true)

    // Reset visibilityState to original value
    mockVisibilityState(originalVisibilityState)
    window.dispatchEvent(new FocusEvent('focus'))
  })

  test('should continue if cancellation is not supported', async () => {
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
    const unsubscribe = observer.subscribe()
    unsubscribe()

    await sleep(100)

    const query = queryCache.find(key)!

    expect(query.state).toMatchObject({
      data: 'data',
      status: 'success',
      dataUpdateCount: 1,
    })
  })

  test('should not continue if cancellation is supported', async () => {
    const key = queryKey()

    const cancel = jest.fn()

    queryClient.prefetchQuery(key, async () => {
      const promise = new Promise((resolve, reject) => {
        sleep(100).then(() => resolve('data'))
        cancel.mockImplementation(() => {
          reject(new Error('Cancelled'))
        })
      }) as any
      promise.cancel = cancel
      return promise
    })

    await sleep(10)

    // Subscribe and unsubscribe to simulate cancellation because the last observer unsubscribed
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      enabled: false,
    })
    const unsubscribe = observer.subscribe()
    unsubscribe()

    await sleep(100)

    const query = queryCache.find(key)!

    expect(cancel).toHaveBeenCalled()
    expect(query.state).toMatchObject({
      data: undefined,
      status: 'idle',
    })
  })

  test('should not continue if explicitly cancelled', async () => {
    const key = queryKey()

    const queryFn = jest.fn()

    queryFn.mockImplementation(async () => {
      await sleep(10)
      throw new Error()
    })

    let error

    const promise = queryClient.fetchQuery(key, queryFn, {
      retry: 3,
      retryDelay: 10,
    })

    promise.catch(e => {
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

    const queryFn = jest.fn()

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
    expect(query.state.status).toBe('idle') // not be loading any longer
  })

  test('should be able to refetch a cancelled query', async () => {
    const key = queryKey()

    const queryFn = jest.fn()

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
    const consoleMock = mockConsoleError()

    const key = queryKey()

    await queryClient.prefetchQuery(key, async () => {
      throw new Error('error')
    })
    const query = queryCache.find(key)!
    query.cancel()
    await sleep(10)

    expect(isError(query.state.error)).toBe(true)
    expect(isCancelledError(query.state.error)).toBe(false)

    consoleMock.mockRestore()
  })

  test('the previous query status should be kept when refetching', async () => {
    const consoleMock = mockConsoleError()
    const key = queryKey()

    await queryClient.prefetchQuery(key, () => 'data')
    const query = queryCache.find(key)!
    expect(query.state.status).toBe('success')

    await queryClient.prefetchQuery(key, () => Promise.reject('reject'), {
      retry: false,
    })
    expect(query.state.status).toBe('error')

    queryClient.prefetchQuery(
      key,
      async () => {
        await sleep(10)
        return Promise.reject('reject')
      },
      { retry: false }
    )
    expect(query.state.status).toBe('error')

    await sleep(100)
    expect(query.state.status).toBe('error')

    consoleMock.mockRestore()
  })

  test('queries with cacheTime 0 should be removed immediately after unsubscribing', async () => {
    const consoleMock = mockConsoleError()
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
    const unsubscribe1 = observer.subscribe()
    unsubscribe1()
    await sleep(10)
    const unsubscribe2 = observer.subscribe()
    unsubscribe2()
    await sleep(10)
    expect(count).toBe(2)
    expect(queryCache.find(key)).toBeUndefined()
    consoleMock.mockRestore()
  })

  test('should be garbage collected when unsubscribed to', async () => {
    const key = queryKey()
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: async () => 'data',
      cacheTime: 0,
    })
    expect(queryCache.find(key)).toBeDefined()
    const unsubscribe = observer.subscribe()
    expect(queryCache.find(key)).toBeDefined()
    unsubscribe()
    expect(queryCache.find(key)).toBeUndefined()
  })

  test('should not be garbage collected unless there are no subscribers', async () => {
    const key = queryKey()
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: async () => 'data',
      cacheTime: 0,
    })
    expect(queryCache.find(key)).toBeDefined()
    const unsubscribe = observer.subscribe()
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

    const unsubscribe1 = observer.subscribe()
    const unsubscribe2 = observer2.subscribe()
    const unsubscribe3 = observer3.subscribe()
    expect(query?.getObserversCount()).toEqual(3)

    unsubscribe3()
    expect(query?.getObserversCount()).toEqual(2)

    unsubscribe2()
    expect(query?.getObserversCount()).toEqual(1)

    unsubscribe1()
    expect(query?.getObserversCount()).toEqual(0)
  })
})
