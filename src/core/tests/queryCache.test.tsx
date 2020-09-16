import {
  sleep,
  queryKey,
  mockVisibilityState,
  mockConsoleError,
  mockNavigatorOnLine,
} from '../../react/tests/utils'
import { queryCache as defaultQueryCache, QueryCache } from '..'
import { isCancelledError, isError } from '../utils'

describe('queryCache', () => {
  test('setQueryData does not crash if query could not be found', () => {
    const key = queryKey()

    const user = { userId: 1 }
    expect(() =>
      defaultQueryCache.setQueryData([key, user], (prevUser?: typeof user) => ({
        ...prevUser!,
        name: 'Edvin',
      }))
    ).not.toThrow()
  })

  test('setQueryData does not crash when variable is null', () => {
    const key = queryKey()

    defaultQueryCache.setQueryData([key, { userId: null }], 'Old Data')

    expect(() =>
      defaultQueryCache.setQueryData([key, { userId: null }], 'New Data')
    ).not.toThrow()
  })

  // https://github.com/tannerlinsley/react-query/issues/652
  test('prefetchQuery should not retry by default', async () => {
    const consoleMock = mockConsoleError()

    const key = queryKey()

    await expect(
      defaultQueryCache.prefetchQuery(
        key,
        async () => {
          throw new Error('error')
        },
        {},
        { throwOnError: true }
      )
    ).rejects.toEqual(new Error('error'))

    consoleMock.mockRestore()
  })

  test('prefetchQuery returns the cached data on cache hits', async () => {
    const key = queryKey()

    const fetchFn = () => Promise.resolve('data')
    const first = await defaultQueryCache.prefetchQuery(key, fetchFn)
    const second = await defaultQueryCache.prefetchQuery(key, fetchFn)

    expect(second).toBe(first)
  })

  test('prefetchQuery should not force fetch', async () => {
    const key = queryKey()

    defaultQueryCache.setQueryData(key, 'og', { staleTime: 100 })
    const fetchFn = () => Promise.resolve('new')
    const first = await defaultQueryCache.prefetchQuery(
      key,
      fetchFn,
      {
        initialData: 'initial',
        staleTime: 100,
      },
      {
        throwOnError: true,
      }
    )
    expect(first).toBe('og')
  })

  test('prefetchQuery should only fetch if the data is older then the given stale time', async () => {
    const key = queryKey()

    let count = 0
    const fetchFn = () => ++count

    defaultQueryCache.setQueryData(key, count)
    const first = await defaultQueryCache.prefetchQuery(key, fetchFn, {
      staleTime: 100,
    })
    await sleep(11)
    const second = await defaultQueryCache.prefetchQuery(key, fetchFn, {
      staleTime: 10,
    })
    const third = await defaultQueryCache.prefetchQuery(key, fetchFn, {
      staleTime: 10,
    })
    await sleep(11)
    const fourth = await defaultQueryCache.prefetchQuery(key, fetchFn, {
      staleTime: 10,
    })
    expect(first).toBe(0)
    expect(second).toBe(1)
    expect(third).toBe(1)
    expect(fourth).toBe(2)
  })

  test('prefetchQuery should throw error when throwOnError is true', async () => {
    const consoleMock = mockConsoleError()

    const key = queryKey()

    await expect(
      defaultQueryCache.prefetchQuery(
        key,
        async () => {
          throw new Error('error')
        },
        {
          retry: false,
        },
        { throwOnError: true }
      )
    ).rejects.toEqual(new Error('error'))

    consoleMock.mockRestore()
  })

  test('prefetchQuery should return undefined when an error is thrown', async () => {
    const consoleMock = mockConsoleError()

    const key = queryKey()

    const result = await defaultQueryCache.prefetchQuery(
      key,
      async () => {
        throw new Error('error')
      },
      {
        retry: false,
      }
    )

    expect(result).toBeUndefined()
    expect(consoleMock).toHaveBeenCalled()

    consoleMock.mockRestore()
  })

  test('should notify listeners when new query is added', async () => {
    const key = queryKey()

    const callback = jest.fn()

    defaultQueryCache.subscribe(callback)

    defaultQueryCache.prefetchQuery(key, () => 'data')

    await sleep(100)

    expect(callback).toHaveBeenCalled()
  })

  test('should include the queryCache and query when notifying listeners', async () => {
    const key = queryKey()

    const callback = jest.fn()

    defaultQueryCache.subscribe(callback)

    defaultQueryCache.prefetchQuery(key, () => 'data')
    const query = defaultQueryCache.getQuery(key)

    await sleep(100)

    expect(callback).toHaveBeenCalledWith(defaultQueryCache, query)
  })

  test('should notify subscribers when new query with initialData is added', async () => {
    const key = queryKey()

    const callback = jest.fn()

    defaultQueryCache.subscribe(callback)

    defaultQueryCache.prefetchQuery(key, () => 'data', {
      initialData: 'initial',
    })

    await sleep(100)

    expect(callback).toHaveBeenCalled()
  })

  test('setQueryData creates a new query if query was not found', () => {
    const key = queryKey()

    defaultQueryCache.setQueryData(key, 'bar')

    expect(defaultQueryCache.getQueryData(key)).toBe('bar')
  })

  test('setQueryData creates a new query if query was not found', () => {
    const key = queryKey()

    defaultQueryCache.setQueryData(key, 'qux')

    expect(defaultQueryCache.getQueryData(key)).toBe('qux')
  })

  test('removeQueries does not crash when exact is provided', async () => {
    const key = queryKey()

    const fetchFn = () => Promise.resolve('data')

    // check the query was added to the cache
    await defaultQueryCache.prefetchQuery(key, fetchFn)
    expect(defaultQueryCache.getQuery(key)).toBeTruthy()

    // check the error doesn't occur
    expect(() =>
      defaultQueryCache.removeQueries(key, { exact: true })
    ).not.toThrow()

    // check query was successful removed
    expect(defaultQueryCache.getQuery(key)).toBeFalsy()
  })

  test('setQueryData updater function works as expected', () => {
    const key = queryKey()

    const updater = jest.fn(oldData => `new data + ${oldData}`)

    defaultQueryCache.setQueryData(key, 'test data')
    defaultQueryCache.setQueryData(key, updater)

    expect(updater).toHaveBeenCalled()
    expect(defaultQueryCache.getQuery(key)!.state.data).toEqual(
      'new data + test data'
    )
  })

  test('getQueries should return queries that partially match queryKey', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    const fetchData1 = () => Promise.resolve('data1')
    const fetchData2 = () => Promise.resolve('data2')
    const fetchDifferentData = () => Promise.resolve('data3')
    await defaultQueryCache.prefetchQuery([key1, { page: 1 }], fetchData1)
    await defaultQueryCache.prefetchQuery([key1, { page: 2 }], fetchData2)
    await defaultQueryCache.prefetchQuery([key2], fetchDifferentData)
    const queries = defaultQueryCache.getQueries(key1)
    const data = queries.map(query => query.state.data)
    expect(data).toEqual(['data1', 'data2'])
  })

  test('getQueries should filter correctly', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const cache = defaultQueryCache

    await cache.prefetchQuery(key1, () => 'data1')
    await cache.prefetchQuery(key2, () => 'data2')
    await cache.invalidateQueries(key2)
    const query1 = cache.getQuery(key1)!
    const query2 = cache.getQuery(key2)!

    expect(cache.getQueries(key1)).toEqual([query1])
    expect(cache.getQueries(key1, {})).toEqual([query1])
    expect(cache.getQueries(key1, { active: false })).toEqual([query1])
    expect(cache.getQueries(key1, { active: true })).toEqual([])
    expect(cache.getQueries(key1, { stale: true })).toEqual([])
    expect(cache.getQueries(key1, { stale: false })).toEqual([query1])
    expect(cache.getQueries(key1, { stale: false, active: true })).toEqual([])
    expect(cache.getQueries(key1, { stale: false, active: false })).toEqual([
      query1,
    ])
    expect(
      cache.getQueries(key1, { stale: false, active: false, exact: true })
    ).toEqual([query1])

    expect(cache.getQueries(key2)).toEqual([query2])
    expect(cache.getQueries(key2, { stale: undefined })).toEqual([query2])
    expect(cache.getQueries(key2, { stale: true })).toEqual([query2])
    expect(cache.getQueries(key2, { stale: false })).toEqual([])
  })

  test('query interval is cleared when unsubscribed to a refetchInterval query', async () => {
    const key = queryKey()

    const fetchData = () => Promise.resolve('data')
    await defaultQueryCache.prefetchQuery(key, fetchData, {
      cacheTime: 0,
      refetchInterval: 1,
    })
    const query = defaultQueryCache.getQuery(key)!
    const instance = query.subscribe()
    // @ts-expect-error
    expect(instance.refetchIntervalId).not.toBeUndefined()
    instance.unsubscribe()
    // @ts-expect-error
    expect(instance.refetchIntervalId).toBeUndefined()
    await sleep(10)
    expect(defaultQueryCache.getQuery(key)).toBeUndefined()
  })

  test('query is garbage collected when unsubscribed to', async () => {
    const key = queryKey()

    const fetchData = () => Promise.resolve('data')
    await defaultQueryCache.prefetchQuery(key, fetchData, { cacheTime: 0 })
    expect(defaultQueryCache.getQuery(key)).toBeDefined()
    const query = defaultQueryCache.getQuery(key)!
    const instance = query.subscribe()
    instance.unsubscribe()
    expect(defaultQueryCache.getQuery(key)).toBeDefined()
    await sleep(100)
    expect(defaultQueryCache.getQuery(key)).toBeUndefined()
  })

  test('query is not garbage collected unless markedForGarbageCollection is true', async () => {
    const key = queryKey()

    const fetchData = () => Promise.resolve(undefined)
    await defaultQueryCache.prefetchQuery(key, fetchData, { cacheTime: 0 })
    expect(defaultQueryCache.getQuery(key)).toBeDefined()
    const query = defaultQueryCache.getQuery(key)!
    const instance = query.subscribe()
    await sleep(100)
    expect(defaultQueryCache.getQuery(key)).toBeDefined()
    instance.unsubscribe()
    await sleep(100)
    expect(defaultQueryCache.getQuery(key)).toBeUndefined()
    defaultQueryCache.setQueryData(key, 'data')
    await sleep(100)
    expect(defaultQueryCache.getQuery(key)).toBeDefined()
  })

  describe('QueryCache', () => {
    test('merges defaultConfig so providing a queryFn does not overwrite the default queryKeySerializerFn', async () => {
      const key = queryKey()

      const queryFn = () => 'data'
      const queryCache = new QueryCache({
        defaultConfig: { queries: { queryFn } },
      })

      expect(() => queryCache.buildQuery(key)).not.toThrow(
        'config.queryKeySerializerFn is not a function'
      )
    })

    test('merges defaultConfig when query is added to cache', async () => {
      const key = queryKey()

      const queryCache = new QueryCache({
        defaultConfig: {
          queries: { refetchOnMount: false, staleTime: Infinity },
        },
      })

      const fetchData = () => Promise.resolve(undefined)
      await queryCache.prefetchQuery(key, fetchData)
      const newQuery = queryCache.getQuery(key)
      expect(newQuery?.config.staleTime).toBe(Infinity)
      expect(newQuery?.config.refetchOnMount).toBe(false)
    })

    test('built queries are referencing the correct queryCache', () => {
      const key = queryKey()

      const queryCache = new QueryCache()
      const query = queryCache.buildQuery(key)

      // @ts-expect-error
      expect(query.queryCache).toBe(queryCache)
    })

    test('notifyGlobalListeners passes the same instance', () => {
      const key = queryKey()

      const queryCache = new QueryCache()
      const subscriber = jest.fn()
      const unsubscribe = queryCache.subscribe(subscriber)
      const query = queryCache.buildQuery(key)
      query.setData('foo')
      expect(subscriber).toHaveBeenCalledWith(queryCache, query)

      unsubscribe()
    })

    test('query should use the longest cache time it has seen', async () => {
      const key = queryKey()
      await defaultQueryCache.prefetchQuery(key, () => 'data', {
        cacheTime: 100,
      })
      await defaultQueryCache.prefetchQuery(key, () => 'data', {
        cacheTime: 200,
      })
      await defaultQueryCache.prefetchQuery(key, () => 'data', {
        cacheTime: 10,
      })
      const query = defaultQueryCache.getQuery(key)!
      expect(query.cacheTime).toBe(200)
    })

    it('should continue retry after focus regain and resolve all promises', async () => {
      const key = queryKey()

      const originalVisibilityState = document.visibilityState

      // make page unfocused
      mockVisibilityState('hidden')

      let count = 0
      let result

      const promise = defaultQueryCache.prefetchQuery(
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

      mockNavigatorOnLine(false)

      let count = 0
      let result

      const promise = defaultQueryCache.prefetchQuery(
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
      mockNavigatorOnLine(true)
      window.dispatchEvent(new Event('online'))

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

      const promise = defaultQueryCache.prefetchQuery(
        key,
        async () => {
          count++
          throw new Error(`error${count}`)
        },
        {
          retry: 3,
          retryDelay: 1,
        },
        {
          throwOnError: true,
        }
      )

      promise.catch(data => {
        result = data
      })

      const query = defaultQueryCache.getQuery(key)!

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

    test('query should continue if cancellation is not supported', async () => {
      const key = queryKey()

      defaultQueryCache.prefetchQuery(key, async () => {
        await sleep(100)
        return 'data'
      })

      await sleep(10)

      const query = defaultQueryCache.getQuery(key)!

      // Subscribe and unsubscribe to simulate cancellation because the last observer unsubscribed
      const observer = query.subscribe()
      observer.unsubscribe()

      await sleep(100)

      expect(query.state).toMatchObject({
        data: 'data',
        status: 'success',
        updateCount: 1,
      })
    })

    test('query should not continue if cancellation is supported', async () => {
      const key = queryKey()

      const cancel = jest.fn()

      defaultQueryCache.prefetchQuery(key, async () => {
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

      const query = defaultQueryCache.getQuery(key)!

      // Subscribe and unsubscribe to simulate cancellation because the last observer unsubscribed
      const observer = query.subscribe()
      observer.unsubscribe()

      await sleep(100)

      expect(cancel).toHaveBeenCalled()
      expect(query.state).toMatchObject({
        data: undefined,
        status: 'error',
        updateCount: 1,
      })
    })

    test('query should not continue if explicitly cancelled', async () => {
      const key = queryKey()

      const queryFn = jest.fn()

      queryFn.mockImplementation(async () => {
        await sleep(10)
        throw new Error()
      })

      let error

      const promise = defaultQueryCache.prefetchQuery(
        key,
        queryFn,
        {
          retry: 3,
          retryDelay: 10,
        },
        {
          throwOnError: true,
        }
      )

      promise.catch(e => {
        error = e
      })

      const query = defaultQueryCache.getQuery(key)!
      query.cancel()

      await sleep(100)

      expect(queryFn).toHaveBeenCalledTimes(1)
      expect(isCancelledError(error)).toBe(true)
    })

    test('should be able to refetch a cancelled query', async () => {
      const key = queryKey()

      const queryFn = jest.fn()

      queryFn.mockImplementation(async () => {
        await sleep(50)
        return 'data'
      })

      defaultQueryCache.prefetchQuery(key, queryFn)
      const query = defaultQueryCache.getQuery(key)!
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
      await defaultQueryCache.prefetchQuery(key, async () => 'data')
      const query = defaultQueryCache.getQuery(key)!
      query.cancel()
      await sleep(10)
      expect(query.state.data).toBe('data')
    })

    test('cancelling a rejected query should not have any effect', async () => {
      const consoleMock = mockConsoleError()

      const key = queryKey()

      await defaultQueryCache.prefetchQuery(key, async () => {
        throw new Error('error')
      })
      const query = defaultQueryCache.getQuery(key)!
      query.cancel()
      await sleep(10)

      expect(isError(query.state.error)).toBe(true)
      expect(isCancelledError(query.state.error)).toBe(false)

      consoleMock.mockRestore()
    })
  })
})
