import {
  sleep,
  queryKey,
  mockVisibilityState,
  mockConsoleError,
  mockNavigatorOnLine,
} from '../../react/tests/utils'
import { QueryCache, queryCache as defaultQueryCache } from '../..'
import { isCancelledError, isError } from '../utils'
import { QueryResult } from '../types'

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
  test('fetchQuery should not retry by default', async () => {
    const consoleMock = mockConsoleError()

    const key = queryKey()

    await expect(
      defaultQueryCache.fetchQuery(key, async () => {
        throw new Error('error')
      })
    ).rejects.toEqual(new Error('error'))

    consoleMock.mockRestore()
  })

  test('fetchQuery returns the cached data on cache hits', async () => {
    const key = queryKey()

    const fetchFn = () => Promise.resolve('data')
    const first = await defaultQueryCache.fetchQuery(key, fetchFn)
    const second = await defaultQueryCache.fetchQuery(key, fetchFn)

    expect(second).toBe(first)
  })

  test('fetchQuery should not force fetch', async () => {
    const key = queryKey()

    defaultQueryCache.setQueryData(key, 'og', { staleTime: 100 })
    const fetchFn = () => Promise.resolve('new')
    const first = await defaultQueryCache.fetchQuery(key, fetchFn, {
      initialData: 'initial',
      staleTime: 100,
    })
    expect(first).toBe('og')
  })

  test('fetchQuery should only fetch if the data is older then the given stale time', async () => {
    const key = queryKey()

    let count = 0
    const fetchFn = () => ++count

    defaultQueryCache.setQueryData(key, count)
    const first = await defaultQueryCache.fetchQuery(key, fetchFn, {
      staleTime: 100,
    })
    await sleep(11)
    const second = await defaultQueryCache.fetchQuery(key, fetchFn, {
      staleTime: 10,
    })
    const third = await defaultQueryCache.fetchQuery(key, fetchFn, {
      staleTime: 10,
    })
    await sleep(11)
    const fourth = await defaultQueryCache.fetchQuery(key, fetchFn, {
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

  test('watchQuery should trigger a fetch when subscribed', async () => {
    const key = queryKey()
    const queryFn = jest.fn()
    const cache = new QueryCache()
    const observer = cache.watchQuery(key, queryFn)
    observer.subscribe()
    await sleep(1)
    observer.unsubscribe()
    cache.clear()
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  test('watchQuery should not trigger a fetch when subscribed and disabled', async () => {
    const key = queryKey()
    const queryFn = jest.fn()
    const cache = new QueryCache()
    const observer = cache.watchQuery(key, queryFn, { enabled: false })
    observer.subscribe()
    await sleep(1)
    observer.unsubscribe()
    cache.clear()
    expect(queryFn).toHaveBeenCalledTimes(0)
  })

  test('watchQuery should not trigger a fetch when not subscribed', async () => {
    const key = queryKey()
    const queryFn = jest.fn()
    const cache = new QueryCache()
    cache.watchQuery(key, queryFn)
    await sleep(1)
    cache.clear()
    expect(queryFn).toHaveBeenCalledTimes(0)
  })

  test('watchQuery should be able to watch a query without defining a query function', async () => {
    const key = queryKey()
    const queryFn = jest.fn()
    const callback = jest.fn()
    const cache = new QueryCache()
    const observer = cache.watchQuery(key)
    observer.subscribe(callback)
    await cache.fetchQuery(key, queryFn)
    observer.unsubscribe()
    cache.clear()
    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledTimes(1)
  })

  test('watchQuery should accept unresolved query config in update function', async () => {
    const key = queryKey()
    const queryFn = jest.fn()
    const cache = new QueryCache()
    const observer = cache.watchQuery(key)
    const results: QueryResult<unknown>[] = []
    observer.subscribe(x => {
      results.push(x)
    })
    observer.updateConfig({ staleTime: 10 })
    await cache.fetchQuery(key, queryFn)
    await sleep(100)
    observer.unsubscribe()
    cache.clear()
    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(results.length).toBe(2)
    expect(results[0]).toMatchObject({ isStale: false })
    expect(results[1]).toMatchObject({ isStale: true })
  })

  test('refetchQueries should refetch all queries when no arguments are given', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = jest.fn()
    const queryFn2 = jest.fn()
    const cache = new QueryCache()
    await cache.fetchQuery(key1, queryFn1)
    await cache.fetchQuery(key2, queryFn2)
    await cache.refetchQueries()
    cache.clear()
    expect(queryFn1).toHaveBeenCalledTimes(2)
    expect(queryFn2).toHaveBeenCalledTimes(2)
  })

  test('refetchQueries should be able to refetch all fresh queries', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = jest.fn()
    const queryFn2 = jest.fn()
    const cache = new QueryCache()
    await cache.fetchQuery(key1, queryFn1)
    await cache.fetchQuery(key2, queryFn2)
    await cache.refetchQueries([], { stale: false })
    cache.clear()
    expect(queryFn1).toHaveBeenCalledTimes(2)
    expect(queryFn2).toHaveBeenCalledTimes(2)
  })

  test('refetchQueries should be able to refetch all stale queries', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = jest.fn()
    const queryFn2 = jest.fn()
    const cache = new QueryCache()
    await cache.fetchQuery(key1, queryFn1)
    await cache.fetchQuery(key2, queryFn2)
    cache.getQuery(key1)!.invalidate()
    await cache.refetchQueries([], { stale: true })
    cache.clear()
    expect(queryFn1).toHaveBeenCalledTimes(2)
    expect(queryFn2).toHaveBeenCalledTimes(1)
  })

  test('refetchQueries should be able to refetch all stale and active queries', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = jest.fn()
    const queryFn2 = jest.fn()
    const cache = new QueryCache()
    await cache.fetchQuery(key1, queryFn1)
    await cache.fetchQuery(key2, queryFn2)
    await cache.invalidateQueries(key1)
    const observer = cache.watchQuery(key1)
    observer.subscribe()
    await cache.refetchQueries([], { active: true, stale: true })
    observer.unsubscribe()
    cache.clear()
    expect(queryFn1).toHaveBeenCalledTimes(2)
    expect(queryFn2).toHaveBeenCalledTimes(1)
  })

  test('refetchQueries should be able to refetch all inactive queries', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = jest.fn()
    const queryFn2 = jest.fn()
    const cache = new QueryCache()
    await cache.fetchQuery(key1, queryFn1)
    await cache.fetchQuery(key2, queryFn2)
    const observer = cache.watchQuery(key1, { staleTime: Infinity })
    observer.subscribe()
    await cache.refetchQueries([], { active: false })
    expect(queryFn1).toHaveBeenCalledTimes(1)
    observer.unsubscribe()
    cache.clear()
    expect(queryFn1).toHaveBeenCalledTimes(1)
    expect(queryFn2).toHaveBeenCalledTimes(2)
  })

  test('invalidateQueries should not refetch inactive queries by default', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = jest.fn()
    const queryFn2 = jest.fn()
    const cache = new QueryCache()
    await cache.fetchQuery(key1, queryFn1)
    await cache.fetchQuery(key2, queryFn2)
    const observer = cache.watchQuery(key1, {
      enabled: false,
      staleTime: Infinity,
    })
    observer.subscribe()
    await cache.invalidateQueries(key1)
    observer.unsubscribe()
    cache.clear()
    expect(queryFn1).toHaveBeenCalledTimes(1)
    expect(queryFn2).toHaveBeenCalledTimes(1)
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
    const observer = defaultQueryCache.watchQuery(key, fetchData, {
      cacheTime: 0,
      refetchInterval: 1,
    })
    observer.subscribe()
    // @ts-expect-error
    expect(observer.refetchIntervalId).not.toBeUndefined()
    observer.unsubscribe()
    // @ts-expect-error
    expect(observer.refetchIntervalId).toBeUndefined()
    await sleep(10)
    expect(defaultQueryCache.getQuery(key)).toBeUndefined()
  })

  test('query is garbage collected when unsubscribed to', async () => {
    const key = queryKey()
    const observer = defaultQueryCache.watchQuery(key, async () => 'data', {
      cacheTime: 0,
    })
    expect(defaultQueryCache.getQuery(key)).toBeDefined()
    observer.subscribe()
    observer.unsubscribe()
    expect(defaultQueryCache.getQuery(key)).toBeDefined()
    await sleep(100)
    expect(defaultQueryCache.getQuery(key)).toBeUndefined()
  })

  test('query is not garbage collected unless there are no subscribers', async () => {
    const key = queryKey()
    const observer = defaultQueryCache.watchQuery(key, async () => 'data', {
      cacheTime: 0,
    })
    expect(defaultQueryCache.getQuery(key)).toBeDefined()
    observer.subscribe()
    await sleep(100)
    expect(defaultQueryCache.getQuery(key)).toBeDefined()
    observer.unsubscribe()
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

    test('notifyGlobalListeners passes the same instance', async () => {
      const key = queryKey()

      const queryCache = new QueryCache()
      const subscriber = jest.fn()
      const unsubscribe = queryCache.subscribe(subscriber)
      const query = queryCache.buildQuery(key)
      query.setData('foo')
      await sleep(1)
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

      const promise = defaultQueryCache.fetchQuery(
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

      const promise = defaultQueryCache.fetchQuery(
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

      const promise = defaultQueryCache.fetchQuery(
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

      // Subscribe and unsubscribe to simulate cancellation because the last observer unsubscribed
      const observer = defaultQueryCache.watchQuery(key)
      observer.subscribe()
      observer.unsubscribe()

      await sleep(100)

      const query = defaultQueryCache.getQuery(key)!

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

      // Subscribe and unsubscribe to simulate cancellation because the last observer unsubscribed
      const observer = defaultQueryCache.watchQuery(key)
      observer.subscribe()
      observer.unsubscribe()

      await sleep(100)

      const query = defaultQueryCache.getQuery(key)!

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

      const promise = defaultQueryCache.fetchQuery(key, queryFn, {
        retry: 3,
        retryDelay: 10,
      })

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

  describe('QueryObserver', () => {
    test('uses placeholderData as non-cache data when loading a query with no data', async () => {
      const key = queryKey()
      const cache = new QueryCache()
      const observer = cache.watchQuery(key, { placeholderData: 'placeholder' })

      expect(observer.getCurrentResult()).toMatchObject({
        status: 'success',
        data: 'placeholder',
      })

      const results: QueryResult<unknown>[] = []

      observer.subscribe(x => {
        results.push(x)
      })

      await cache.fetchQuery(key, async () => {
        await sleep(100)
        return 'data'
      })

      expect(results[0].data).toBe('data')

      observer.unsubscribe()
      cache.clear()
    })
  })
})
