import { sleep } from './utils'
import { queryCache as defaultQueryCache, queryCaches } from '../'
import { makeQueryCache } from '../queryCache'

describe('queryCache', () => {
  afterEach(() => {
    queryCaches.forEach(cache => cache.clear({ notify: false }))
  })

  test('setQueryData does not crash if query could not be found', () => {
    const user = { userId: 1 }
    expect(() =>
      defaultQueryCache.setQueryData(
        ['USER', user],
        (prevUser?: typeof user) => ({
          ...prevUser!,
          name: 'Edvin',
        })
      )
    ).not.toThrow()
  })

  test('setQueryData does not crash when variable is null', () => {
    defaultQueryCache.setQueryData(['USER', { userId: null }], 'Old Data')

    expect(() =>
      defaultQueryCache.setQueryData(['USER', { userId: null }], 'New Data')
    ).not.toThrow()
  })

  // https://github.com/tannerlinsley/react-query/issues/652
  test('prefetchQuery should not retry by default', async () => {
    await expect(
      defaultQueryCache.prefetchQuery(
        'key',
        async () => {
          throw new Error('error')
        },
        {},
        { throwOnError: true }
      )
    ).rejects.toEqual(new Error('error'))
  })

  test('prefetchQuery returns the cached data on cache hits', async () => {
    const fetchFn = () => Promise.resolve('data')
    const first = await defaultQueryCache.prefetchQuery('key', fetchFn)
    const second = await defaultQueryCache.prefetchQuery('key', fetchFn)

    expect(second).toBe(first)
  })

  test('prefetchQuery should not force fetch', async () => {
    defaultQueryCache.setQueryData('key', 'og', { staleTime: 100 })
    const fetchFn = () => Promise.resolve('new')
    const first = await defaultQueryCache.prefetchQuery(
      'key',
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
    await expect(
      defaultQueryCache.prefetchQuery(
        'key',
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

  test('should notify listeners when new query is added', async () => {
    const callback = jest.fn()

    defaultQueryCache.subscribe(callback)

    defaultQueryCache.prefetchQuery('test', () => 'data')

    await sleep(100)

    expect(callback).toHaveBeenCalled()
  })

  test('should include the queryCache and query when notifying listeners', async () => {
    const callback = jest.fn()

    defaultQueryCache.subscribe(callback)

    defaultQueryCache.prefetchQuery('test', () => 'data')
    const query = defaultQueryCache.getQuery('test')

    await sleep(100)

    expect(callback).toHaveBeenCalledWith(defaultQueryCache, query)
  })

  test('should notify subscribers when new query with initialData is added', async () => {
    const callback = jest.fn()

    defaultQueryCache.subscribe(callback)

    defaultQueryCache.prefetchQuery('test', () => 'data', {
      initialData: 'initial',
    })

    await sleep(100)

    expect(callback).toHaveBeenCalled()
  })

  test('setQueryData creates a new query if query was not found', () => {
    defaultQueryCache.setQueryData('foo', 'bar')

    expect(defaultQueryCache.getQueryData('foo')).toBe('bar')
  })

  test('setQueryData creates a new query if query was not found', () => {
    defaultQueryCache.setQueryData('baz', 'qux')

    expect(defaultQueryCache.getQueryData('baz')).toBe('qux')
  })

  test('removeQueries does not crash when exact is provided', async () => {
    const fetchFn = () => Promise.resolve('data')

    // check the query was added to the cache
    await defaultQueryCache.prefetchQuery('key', fetchFn)
    expect(defaultQueryCache.getQuery('key')).toBeTruthy()

    // check the error doesn't occur
    expect(() =>
      defaultQueryCache.removeQueries('key', { exact: true })
    ).not.toThrow()

    // check query was successful removed
    expect(defaultQueryCache.getQuery('key')).toBeFalsy()
  })

  test('setQueryData should schedule stale timeout, if staleTime is set', async () => {
    defaultQueryCache.setQueryData('key', 'test data', { staleTime: 10 })
    // @ts-expect-error
    expect(defaultQueryCache.getQuery('key')!.staleTimeout).not.toBeUndefined()
  })

  test('setQueryData should not schedule stale timeout by default', async () => {
    defaultQueryCache.setQueryData('key', 'test data')
    // @ts-expect-error
    expect(defaultQueryCache.getQuery('key')!.staleTimeout).toBeUndefined()
  })

  test('setQueryData should not schedule stale timeout, if staleTime is set to `Infinity`', async () => {
    defaultQueryCache.setQueryData('key', 'test data', { staleTime: Infinity })
    // @ts-expect-error
    expect(defaultQueryCache.getQuery('key')!.staleTimeout).toBeUndefined()
  })

  test('setQueryData schedules stale timeouts appropriately', async () => {
    defaultQueryCache.setQueryData('key', 'test data', { staleTime: 100 })

    expect(defaultQueryCache.getQuery('key')!.state.data).toEqual('test data')
    expect(defaultQueryCache.getQuery('key')!.state.isStale).toEqual(false)

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(defaultQueryCache.getQuery('key')!.state.isStale).toEqual(true)
  })

  test('setQueryData updater function works as expected', () => {
    const updater = jest.fn(oldData => `new data + ${oldData}`)

    defaultQueryCache.setQueryData('updater', 'test data')
    defaultQueryCache.setQueryData('updater', updater)

    expect(updater).toHaveBeenCalled()
    expect(defaultQueryCache.getQuery('updater')!.state.data).toEqual(
      'new data + test data'
    )
  })

  test('getQueries should return queries that partially match queryKey', async () => {
    const fetchData1 = () => Promise.resolve('data1')
    const fetchData2 = () => Promise.resolve('data2')
    const fetchDifferentData = () => Promise.resolve('data3')
    await defaultQueryCache.prefetchQuery(['data', { page: 1 }], fetchData1)
    await defaultQueryCache.prefetchQuery(['data', { page: 2 }], fetchData2)
    await defaultQueryCache.prefetchQuery(['differentData'], fetchDifferentData)
    const queries = defaultQueryCache.getQueries('data')
    const data = queries.map(query => query.state.data)
    expect(data).toEqual(['data1', 'data2'])
  })

  test('stale timeout dispatch is not called if query is no longer in the query cache', async () => {
    const queryKey = 'key'
    const fetchData = () => Promise.resolve('data')
    await defaultQueryCache.prefetchQuery(queryKey, fetchData, {
      staleTime: 100,
    })
    const query = defaultQueryCache.getQuery(queryKey)
    expect(query!.state.isStale).toBe(false)
    defaultQueryCache.removeQueries(queryKey)
    await sleep(50)
    expect(query!.state.isStale).toBe(false)
  })

  test('query interval is cleared when unsubscribed to a refetchInterval query', async () => {
    const queryKey = 'key'
    const fetchData = () => Promise.resolve('data')
    await defaultQueryCache.prefetchQuery(queryKey, fetchData, {
      cacheTime: 0,
      refetchInterval: 1,
    })
    const query = defaultQueryCache.getQuery(queryKey)!
    const instance = query.subscribe()
    instance.updateConfig(query.config)
    // @ts-expect-error
    expect(instance.refetchIntervalId).not.toBeUndefined()
    instance.unsubscribe()
    // @ts-expect-error
    expect(instance.refetchIntervalId).toBeUndefined()
    await sleep(10)
    expect(defaultQueryCache.getQuery(queryKey)).toBeUndefined()
  })

  test('query is garbage collected when unsubscribed to', async () => {
    const queryKey = 'key'
    const fetchData = () => Promise.resolve('data')
    await defaultQueryCache.prefetchQuery(queryKey, fetchData, { cacheTime: 0 })
    const query = defaultQueryCache.getQuery(queryKey)!
    expect(query.state.markedForGarbageCollection).toBe(false)
    const instance = query.subscribe()
    instance.unsubscribe()
    expect(query.state.markedForGarbageCollection).toBe(true)
    await sleep(10)
    expect(defaultQueryCache.getQuery(queryKey)).toBeUndefined()
  })

  test('query is not garbage collected unless markedForGarbageCollection is true', async () => {
    const queryKey = 'key'
    const fetchData = () => Promise.resolve(undefined)
    await defaultQueryCache.prefetchQuery(queryKey, fetchData, { cacheTime: 0 })
    const query = defaultQueryCache.getQuery(queryKey)!
    expect(query.state.markedForGarbageCollection).toBe(false)
    const instance = query.subscribe()
    instance.unsubscribe()
    expect(query.state.markedForGarbageCollection).toBe(true)
    defaultQueryCache.clear({ notify: false })
    defaultQueryCache.setQueryData(queryKey, 'data')
    await sleep(10)
    const newQuery = defaultQueryCache.getQuery(queryKey)!
    expect(newQuery.state.markedForGarbageCollection).toBe(false)
    expect(newQuery.state.data).toBe('data')
  })

  describe('makeQueryCache', () => {
    test('merges defaultConfig so providing a queryFn does not overwrite the default queryKeySerializerFn', async () => {
      const queryFn = () => 'data'
      const queryCache = makeQueryCache({
        defaultConfig: { queries: { queryFn } },
      })

      expect(() => queryCache.buildQuery('test')).not.toThrow(
        'config.queryKeySerializerFn is not a function'
      )
    })

    test('merges defaultConfig when query is added to cache', async () => {
      const queryCache = makeQueryCache({
        defaultConfig: {
          queries: { refetchOnMount: false, staleTime: Infinity },
        },
      })

      const queryKey = 'key'
      const fetchData = () => Promise.resolve(undefined)
      await queryCache.prefetchQuery(queryKey, fetchData)
      const newQuery = queryCache.getQuery(queryKey)
      expect(newQuery?.config.staleTime).toBe(Infinity)
      expect(newQuery?.config.refetchOnMount).toBe(false)
    })

    test('built queries are referencing the correct queryCache', () => {
      const queryCache = makeQueryCache()
      const query = queryCache.buildQuery('test')

      expect(query.queryCache).toBe(queryCache)
    })

    test('notifyGlobalListeners passes the same instance', () => {
      const queryCache = makeQueryCache()
      const subscriber = jest.fn()
      const unsubscribe = queryCache.subscribe(subscriber)
      const query = queryCache.buildQuery('test')
      query.setData('foo');
      expect(subscriber).toHaveBeenCalledWith(queryCache, query)

      unsubscribe()
    })
  })
})
