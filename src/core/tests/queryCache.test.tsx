import { sleep, queryKey } from '../../react/tests/utils'
import { makeQueryCache, queryCache as defaultQueryCache } from '..'

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
      },
      {
        throwOnError: true,
      }
    )
    expect(first).toBe('og')
  })

  test('prefetchQuery should throw error when throwOnError is true', async () => {
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
  })

  test('prefetchQuery should return undefined when an error is thrown', async () => {
    const key = queryKey()

    const consoleMock = jest.spyOn(console, 'error')
    consoleMock.mockImplementation(() => undefined)

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

  test('setQueryData should schedule stale timeout, if staleTime is set', async () => {
    const key = queryKey()

    defaultQueryCache.setQueryData(key, 'test data', { staleTime: 10 })
    // @ts-expect-error
    expect(defaultQueryCache.getQuery(key)!.staleTimeout).not.toBeUndefined()
  })

  test('setQueryData should not schedule stale timeout by default', async () => {
    const key = queryKey()

    defaultQueryCache.setQueryData(key, 'test data')
    // @ts-expect-error
    expect(defaultQueryCache.getQuery(key)!.staleTimeout).toBeUndefined()
  })

  test('setQueryData should not schedule stale timeout, if staleTime is set to `Infinity`', async () => {
    const key = queryKey()

    defaultQueryCache.setQueryData(key, 'test data', { staleTime: Infinity })
    // @ts-expect-error
    expect(defaultQueryCache.getQuery(key)!.staleTimeout).toBeUndefined()
  })

  test('setQueryData schedules stale timeouts appropriately', async () => {
    const key = queryKey()

    defaultQueryCache.setQueryData(key, 'test data', { staleTime: 100 })

    expect(defaultQueryCache.getQuery(key)!.state.data).toEqual('test data')
    expect(defaultQueryCache.getQuery(key)!.state.isStale).toEqual(false)

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(defaultQueryCache.getQuery(key)!.state.isStale).toEqual(true)
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

  test('stale timeout dispatch is not called if query is no longer in the query cache', async () => {
    const key = queryKey()

    const fetchData = () => Promise.resolve('data')
    await defaultQueryCache.prefetchQuery(key, fetchData, {
      staleTime: 100,
    })
    const query = defaultQueryCache.getQuery(key)
    expect(query!.state.isStale).toBe(false)
    defaultQueryCache.removeQueries(key)
    await sleep(50)
    expect(query!.state.isStale).toBe(false)
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
    instance.updateConfig(query.config)
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

  describe('makeQueryCache', () => {
    test('merges defaultConfig so providing a queryFn does not overwrite the default queryKeySerializerFn', async () => {
      const key = queryKey()

      const queryFn = () => 'data'
      const queryCache = makeQueryCache({
        defaultConfig: { queries: { queryFn } },
      })

      expect(() => queryCache.buildQuery(key)).not.toThrow(
        'config.queryKeySerializerFn is not a function'
      )
    })

    test('merges defaultConfig when query is added to cache', async () => {
      const key = queryKey()

      const queryCache = makeQueryCache({
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

      const queryCache = makeQueryCache()
      const query = queryCache.buildQuery(key)

      expect(query.queryCache).toBe(queryCache)
    })

    test('notifyGlobalListeners passes the same instance', () => {
      const key = queryKey()

      const queryCache = makeQueryCache()
      const subscriber = jest.fn()
      const unsubscribe = queryCache.subscribe(subscriber)
      const query = queryCache.buildQuery(key)
      query.setData('foo')
      expect(subscriber).toHaveBeenCalledWith(queryCache, query)

      unsubscribe()
    })
  })
})
