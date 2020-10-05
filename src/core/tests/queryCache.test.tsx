import {
  sleep,
  queryKey,
  mockVisibilityState,
  mockConsoleError,
  mockNavigatorOnLine,
  expectType,
} from '../../react/tests/utils'
import { QueryCache, QueryClient } from '../..'
import { isCancelledError, isError } from '../utils'
import { QueryObserverResult } from '../types'

describe('queryCache', () => {
  const cache = new QueryCache()
  const client = new QueryClient({ cache })
  client.mount()

  test('setQueryDefaults does not trigger a fetch', async () => {
    const key = queryKey()
    client.setQueryDefaults(key, () => 'data')
    await sleep(1)
    const data = client.getQueryData(key)
    expect(data).toBeUndefined()
  })

  test('setQueryDefaults should be able to override defaults', async () => {
    const consoleMock = mockConsoleError()
    const key = queryKey()
    const queryFn = jest.fn().mockRejectedValue('reject')
    client.setQueryDefaults(key, queryFn, { retry: 1 })
    const observer = client.watchQuery(key)
    const { error } = await observer.getNextResult({ throwOnError: false })
    expect(error).toBe('reject')
    expect(queryFn).toHaveBeenCalledTimes(2)
    consoleMock.mockRestore()
  })

  test('setQueryData does not crash if query could not be found', () => {
    const key = queryKey()

    const user = { userId: 1 }
    expect(() => {
      client.setQueryData([key, user], (prevUser?: typeof user) => ({
        ...prevUser!,
        name: 'Edvin',
      }))
    }).not.toThrow()
  })

  test('setQueryData does not crash when variable is null', () => {
    const key = queryKey()

    client.setQueryData([key, { userId: null }], 'Old Data')

    expect(() => {
      client.setQueryData([key, { userId: null }], 'New Data')
    }).not.toThrow()
  })

  // https://github.com/tannerlinsley/react-query/issues/652
  test('fetchQueryData should not retry by default', async () => {
    const consoleMock = mockConsoleError()

    const key = queryKey()

    await expect(
      client.fetchQueryData(key, async () => {
        throw new Error('error')
      })
    ).rejects.toEqual(new Error('error'))

    consoleMock.mockRestore()
  })

  test('fetchQueryData returns the cached data on cache hits', async () => {
    const key = queryKey()

    const fetchFn = () => Promise.resolve('data')
    const first = await client.fetchQueryData(key, fetchFn)
    const second = await client.fetchQueryData(key, fetchFn)

    expect(second).toBe(first)
  })

  test('fetchQueryData should not force fetch', async () => {
    const key = queryKey()

    client.setQueryData(key, 'og')
    const fetchFn = () => Promise.resolve('new')
    const first = await client.fetchQueryData(key, fetchFn, {
      initialData: 'initial',
      staleTime: 100,
    })
    expect(first).toBe('og')
  })

  test('fetchQueryData should only fetch if the data is older then the given stale time', async () => {
    const key = queryKey()

    let count = 0
    const fetchFn = () => ++count

    client.setQueryData(key, count)
    const first = await client.fetchQueryData(key, fetchFn, {
      staleTime: 100,
    })
    await sleep(11)
    const second = await client.fetchQueryData(key, fetchFn, {
      staleTime: 10,
    })
    const third = await client.fetchQueryData(key, fetchFn, {
      staleTime: 10,
    })
    await sleep(11)
    const fourth = await client.fetchQueryData(key, fetchFn, {
      staleTime: 10,
    })
    expect(first).toBe(0)
    expect(second).toBe(1)
    expect(third).toBe(1)
    expect(fourth).toBe(2)
  })

  test('fetchQueryData should be able to perform an infinite query', async () => {
    const key = queryKey()
    const fetchFn = () => Promise.resolve('data')
    const data = await client.fetchQueryData<string[], unknown, string>(
      key,
      fetchFn,
      { infinite: true }
    )
    expect(data).toMatchObject(['data'])
  })

  test('prefetchQuery should return undefined when an error is thrown', async () => {
    const consoleMock = mockConsoleError()

    const key = queryKey()

    const result = await client.prefetchQuery(
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

    cache.subscribe(callback)

    client.prefetchQuery(key, () => 'data')

    await sleep(100)

    expect(callback).toHaveBeenCalled()
  })

  test('should include the queryCache and query when notifying listeners', async () => {
    const key = queryKey()

    const callback = jest.fn()

    cache.subscribe(callback)

    client.prefetchQuery(key, () => 'data')
    const query = cache.find(key)

    await sleep(100)

    expect(callback).toHaveBeenCalledWith(query)
  })

  test('should notify subscribers when new query with initialData is added', async () => {
    const key = queryKey()

    const callback = jest.fn()

    cache.subscribe(callback)

    client.prefetchQuery(key, () => 'data', {
      initialData: 'initial',
    })

    await sleep(100)

    expect(callback).toHaveBeenCalled()
  })

  test('setQueryData creates a new query if query was not found', () => {
    const key = queryKey()

    client.setQueryData(key, 'bar')

    expect(client.getQueryData(key)).toBe('bar')
  })

  test('setQueryData creates a new query if query was not found', () => {
    const key = queryKey()

    client.setQueryData(key, 'qux')

    expect(client.getQueryData(key)).toBe('qux')
  })

  test('removeQueries does not crash when exact is provided', async () => {
    const key = queryKey()

    const fetchFn = () => Promise.resolve('data')

    // check the query was added to the cache
    await client.prefetchQuery(key, fetchFn)
    expect(cache.find(key)).toBeTruthy()

    // check the error doesn't occur
    expect(() =>
      client.removeQueries({ queryKey: key, exact: true })
    ).not.toThrow()

    // check query was successful removed
    expect(cache.find(key)).toBeFalsy()
  })

  test('setQueryData updater function works as expected', () => {
    const key = queryKey()

    const updater = jest.fn(oldData => `new data + ${oldData}`)

    client.setQueryData(key, 'test data')
    client.setQueryData(key, updater)

    expect(updater).toHaveBeenCalled()
    expect(cache.find(key)!.state.data).toEqual('new data + test data')
  })

  test('watchQueries should return an array with all query results', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = jest.fn().mockReturnValue(1)
    const queryFn2 = jest.fn().mockReturnValue(2)
    const testCache = new QueryCache()
    const testClient = new QueryClient({ cache: testCache })
    const observer = testClient.watchQueries([
      { queryKey: key1, queryFn: queryFn1 },
      { queryKey: key2, queryFn: queryFn2 },
    ])
    let observerResult
    const unsubscribe = observer.subscribe(result => {
      observerResult = result
    })
    await sleep(1)
    unsubscribe()
    testCache.clear()
    expect(observerResult).toMatchObject([{ data: 1 }, { data: 2 }])
  })

  test('watchQueries should update when a query updates', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = jest.fn().mockReturnValue(1)
    const queryFn2 = jest.fn().mockReturnValue(2)
    const testCache = new QueryCache()
    const testClient = new QueryClient({ cache: testCache })
    const observer = testClient.watchQueries([
      { queryKey: key1, queryFn: queryFn1 },
      { queryKey: key2, queryFn: queryFn2 },
    ])
    const results: QueryObserverResult[][] = []
    results.push(observer.getCurrentResult())
    const unsubscribe = observer.subscribe(result => {
      results.push(result)
    })
    await sleep(1)
    testClient.setQueryData(key2, 3)
    await sleep(1)
    unsubscribe()
    testCache.clear()
    expect(results.length).toBe(4)
    expect(results).toMatchObject([
      [{ data: undefined }, { data: undefined }],
      [{ data: 1 }, { data: undefined }],
      [{ data: 1 }, { data: 2 }],
      [{ data: 1 }, { data: 3 }],
    ])
  })

  test('watchQueries should update when a query is removed', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = jest.fn().mockReturnValue(1)
    const queryFn2 = jest.fn().mockReturnValue(2)
    const testCache = new QueryCache()
    const testClient = new QueryClient({ cache: testCache })
    const observer = testClient.watchQueries([
      { queryKey: key1, queryFn: queryFn1 },
      { queryKey: key2, queryFn: queryFn2 },
    ])
    const results: QueryObserverResult[][] = []
    results.push(observer.getCurrentResult())
    const unsubscribe = observer.subscribe(result => {
      results.push(result)
    })
    await sleep(1)
    observer.setQueries([{ queryKey: key2, queryFn: queryFn2 }])
    await sleep(1)
    expect(testCache.find(key1, { active: true })).toBeUndefined()
    expect(testCache.find(key2, { active: true })).toBeDefined()
    unsubscribe()
    expect(testCache.find(key1, { active: true })).toBeUndefined()
    expect(testCache.find(key2, { active: true })).toBeUndefined()
    testCache.clear()
    expect(results.length).toBe(4)
    expect(results).toMatchObject([
      [{ data: undefined }, { data: undefined }],
      [{ data: 1 }, { data: undefined }],
      [{ data: 1 }, { data: 2 }],
      [{ data: 2 }],
    ])
  })

  test('watchQueries should update when a query changed position', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = jest.fn().mockReturnValue(1)
    const queryFn2 = jest.fn().mockReturnValue(2)
    const testCache = new QueryCache()
    const testClient = new QueryClient({ cache: testCache })
    const observer = testClient.watchQueries([
      { queryKey: key1, queryFn: queryFn1 },
      { queryKey: key2, queryFn: queryFn2 },
    ])
    const results: QueryObserverResult[][] = []
    results.push(observer.getCurrentResult())
    const unsubscribe = observer.subscribe(result => {
      results.push(result)
    })
    await sleep(1)
    observer.setQueries([
      { queryKey: key2, queryFn: queryFn2 },
      { queryKey: key1, queryFn: queryFn1 },
    ])
    await sleep(1)
    unsubscribe()
    testCache.clear()
    expect(results.length).toBe(4)
    expect(results).toMatchObject([
      [{ data: undefined }, { data: undefined }],
      [{ data: 1 }, { data: undefined }],
      [{ data: 1 }, { data: 2 }],
      [{ data: 2 }, { data: 1 }],
    ])
  })

  test('watchQueries should not update when nothing has changed', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = jest.fn().mockReturnValue(1)
    const queryFn2 = jest.fn().mockReturnValue(2)
    const testCache = new QueryCache()
    const testClient = new QueryClient({ cache: testCache })
    const observer = testClient.watchQueries([
      { queryKey: key1, queryFn: queryFn1 },
      { queryKey: key2, queryFn: queryFn2 },
    ])
    const results: QueryObserverResult[][] = []
    results.push(observer.getCurrentResult())
    const unsubscribe = observer.subscribe(result => {
      results.push(result)
    })
    await sleep(1)
    observer.setQueries([
      { queryKey: key1, queryFn: queryFn1 },
      { queryKey: key2, queryFn: queryFn2 },
    ])
    await sleep(1)
    unsubscribe()
    testCache.clear()
    expect(results.length).toBe(3)
    expect(results).toMatchObject([
      [{ data: undefined }, { data: undefined }],
      [{ data: 1 }, { data: undefined }],
      [{ data: 1 }, { data: 2 }],
    ])
  })

  test('watchQueries should trigger all fetches when subscribed', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = jest.fn()
    const queryFn2 = jest.fn()
    const testCache = new QueryCache()
    const testClient = new QueryClient({ cache: testCache })
    const observer = testClient.watchQueries([
      { queryKey: key1, queryFn: queryFn1 },
      { queryKey: key2, queryFn: queryFn2 },
    ])
    const unsubscribe = observer.subscribe()
    await sleep(1)
    unsubscribe()
    testCache.clear()
    expect(queryFn1).toHaveBeenCalledTimes(1)
    expect(queryFn2).toHaveBeenCalledTimes(1)
  })

  test('watchQuery should trigger a fetch when subscribed', async () => {
    const key = queryKey()
    const queryFn = jest.fn()
    const testCache = new QueryCache()
    const testClient = new QueryClient({ cache: testCache })
    const observer = testClient.watchQuery(key, queryFn)
    const unsubscribe = observer.subscribe()
    await sleep(1)
    unsubscribe()
    testCache.clear()
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  test('watchQuery should be able to fetch with a selector', async () => {
    const key = queryKey()
    const testCache = new QueryCache()
    const testClient = new QueryClient({ cache: testCache })
    const observer = testClient.watchQuery(key, () => ({ count: 1 }), {
      select: data => ({ myCount: data.count }),
    })
    let observerResult
    const unsubscribe = observer.subscribe(result => {
      expectType<QueryObserverResult<{ myCount: number }>>(result)
      observerResult = result
    })
    await sleep(1)
    unsubscribe()
    testCache.clear()
    expect(observerResult).toMatchObject({ data: { myCount: 1 } })
  })

  test('watchQuery should be able to fetch with a selector using the fetch method', async () => {
    const key = queryKey()
    const testCache = new QueryCache()
    const testClient = new QueryClient({ cache: testCache })
    const observer = testClient.watchQuery(key, () => ({ count: 1 }), {
      select: data => ({ myCount: data.count }),
    })
    const observerResult = await observer.fetch()
    testCache.clear()
    expectType<{ myCount: number } | undefined>(observerResult.data)
    expect(observerResult.data).toMatchObject({ myCount: 1 })
  })

  test('watchQuery should be able to fetch an infinite query with selector', async () => {
    const key = queryKey()
    const testCache = new QueryCache()
    const testClient = new QueryClient({ cache: testCache })
    const observer = testClient.watchQuery<string[], unknown, number, number[]>(
      {
        queryKey: key,
        queryFn: () => 1,
        select: data => data.map(x => `${x}`),
        infinite: true,
      }
    )
    let observerResult
    const unsubscribe = observer.subscribe(result => {
      observerResult = result
    })
    await sleep(1)
    unsubscribe()
    testCache.clear()
    expect(observerResult).toMatchObject({ data: ['1'] })
  })

  test('watchQuery should be able to fetch with a selector and object syntax', async () => {
    const key = queryKey()
    const testCache = new QueryCache()
    const testClient = new QueryClient({ cache: testCache })
    const observer = testClient.watchQuery({
      queryKey: key,
      queryFn: () => ({ count: 1 }),
      select: data => ({ myCount: data.count }),
    })
    let observerResult
    const unsubscribe = observer.subscribe(result => {
      observerResult = result
    })
    await sleep(1)
    unsubscribe()
    testCache.clear()
    expect(observerResult).toMatchObject({ data: { myCount: 1 } })
  })

  test('watchQuery should run the selector again if the data changed', async () => {
    const key = queryKey()
    const testCache = new QueryCache()
    const testClient = new QueryClient({ cache: testCache })
    let count = 0
    const observer = testClient.watchQuery(key, () => ({ count }), {
      select: data => {
        count++
        return { myCount: data.count }
      },
    })
    const observerResult1 = await observer.fetch()
    const observerResult2 = await observer.fetch()
    testCache.clear()
    expect(count).toBe(2)
    expect(observerResult1.data).toMatchObject({ myCount: 0 })
    expect(observerResult2.data).toMatchObject({ myCount: 1 })
  })

  test('watchQuery should not run the selector again if the data did not change', async () => {
    const key = queryKey()
    const testCache = new QueryCache()
    const testClient = new QueryClient({ cache: testCache })
    let count = 0
    const observer = testClient.watchQuery(key, () => ({ count: 1 }), {
      select: data => {
        count++
        return { myCount: data.count }
      },
    })
    const observerResult1 = await observer.fetch()
    const observerResult2 = await observer.fetch()
    testCache.clear()
    expect(count).toBe(1)
    expect(observerResult1.data).toMatchObject({ myCount: 1 })
    expect(observerResult2.data).toMatchObject({ myCount: 1 })
  })

  test('watchQuery should structurally share the selector', async () => {
    const key = queryKey()
    const testCache = new QueryCache()
    const testClient = new QueryClient({ cache: testCache })
    let count = 0
    const observer = testClient.watchQuery(key, () => ({ count: ++count }), {
      select: () => ({ myCount: 1 }),
    })
    const observerResult1 = await observer.fetch()
    const observerResult2 = await observer.fetch()
    testCache.clear()
    expect(count).toBe(2)
    expect(observerResult1.data).toBe(observerResult2.data)
  })

  test('watchQuery should not trigger a fetch when subscribed and disabled', async () => {
    const key = queryKey()
    const queryFn = jest.fn()
    const testCache = new QueryCache()
    const testClient = new QueryClient({ cache: testCache })
    const observer = testClient.watchQuery(key, queryFn, { enabled: false })
    const unsubscribe = observer.subscribe()
    await sleep(1)
    unsubscribe()
    testCache.clear()
    expect(queryFn).toHaveBeenCalledTimes(0)
  })

  test('watchQuery should not trigger a fetch when not subscribed', async () => {
    const key = queryKey()
    const queryFn = jest.fn()
    const testCache = new QueryCache()
    const testClient = new QueryClient({ cache: testCache })
    testClient.watchQuery(key, queryFn)
    await sleep(1)
    testCache.clear()
    expect(queryFn).toHaveBeenCalledTimes(0)
  })

  test('watchQuery should be able to watch a query without defining a query function', async () => {
    const key = queryKey()
    const queryFn = jest.fn()
    const callback = jest.fn()
    const testCache = new QueryCache()
    const testClient = new QueryClient({ cache: testCache })
    const observer = testClient.watchQuery(key)
    const unsubscribe = observer.subscribe(callback)
    await testClient.fetchQueryData(key, queryFn)
    unsubscribe()
    testCache.clear()
    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledTimes(1)
  })

  test('watchQuery should accept unresolved query config in update function', async () => {
    const key = queryKey()
    const queryFn = jest.fn()
    const testCache = new QueryCache()
    const testClient = new QueryClient({ cache: testCache })
    const observer = testClient.watchQuery(key)
    const results: QueryObserverResult<unknown>[] = []
    const unsubscribe = observer.subscribe(x => {
      results.push(x)
    })
    observer.setOptions({ staleTime: 10 })
    await testClient.fetchQueryData(key, queryFn)
    await sleep(100)
    unsubscribe()
    testCache.clear()
    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(results.length).toBe(2)
    expect(results[0]).toMatchObject({ isStale: false })
    expect(results[1]).toMatchObject({ isStale: true })
  })

  test('watchQuery should be able to handle multiple subscribers', async () => {
    const key = queryKey()
    const queryFn = jest.fn().mockReturnValue('data')
    const testCache = new QueryCache()
    const testClient = new QueryClient({ cache: testCache })
    const observer = testClient.watchQuery<string>(key)
    const results1: QueryObserverResult<string>[] = []
    const results2: QueryObserverResult<string>[] = []
    const unsubscribe1 = observer.subscribe(x => {
      results1.push(x)
    })
    const unsubscribe2 = observer.subscribe(x => {
      results2.push(x)
    })
    await testClient.fetchQueryData(key, queryFn)
    await sleep(50)
    unsubscribe1()
    unsubscribe2()
    testCache.clear()
    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(results1.length).toBe(1)
    expect(results2.length).toBe(1)
    expect(results1[0]).toMatchObject({ data: 'data' })
    expect(results1[0]).toMatchObject({ data: 'data' })
  })

  test('watchQuery should be able to resolve a promise', async () => {
    const key = queryKey()
    const queryFn = jest.fn().mockReturnValue('data')
    const testCache = new QueryCache()
    const testClient = new QueryClient({ cache: testCache })
    const observer = testClient.watchQuery<string>(key)
    let value
    observer.getNextResult().then(x => {
      value = x
    })
    testClient.prefetchQuery(key, queryFn)
    await sleep(50)
    testCache.clear()
    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(value).toMatchObject({ data: 'data' })
  })

  test('watchQuery should be able to resolve a promise with an error', async () => {
    const consoleMock = mockConsoleError()
    const key = queryKey()
    const testCache = new QueryCache()
    const testClient = new QueryClient({ cache: testCache })
    const observer = testClient.watchQuery<string>(key)
    let error
    observer.getNextResult({ throwOnError: true }).catch(e => {
      error = e
    })
    testClient.prefetchQuery(key, () => Promise.reject('reject'))
    await sleep(50)
    testCache.clear()
    expect(error).toEqual('reject')
    consoleMock.mockRestore()
  })

  test('cancelQueries should revert queries to their previous state', async () => {
    const consoleMock = mockConsoleError()
    const key1 = queryKey()
    const key2 = queryKey()
    const key3 = queryKey()
    const testCache = new QueryCache()
    const testClient = new QueryClient({ cache: testCache })
    await testClient.fetchQueryData(key1, async () => {
      return 'data'
    })
    try {
      await testClient.fetchQueryData(key2, async () => {
        return Promise.reject('err')
      })
    } catch {}
    testClient.fetchQueryData(key1, async () => {
      await sleep(1000)
      return 'data2'
    })
    try {
      testClient.fetchQueryData(key2, async () => {
        await sleep(1000)
        return Promise.reject('err2')
      })
    } catch {}
    testClient.fetchQueryData(key3, async () => {
      await sleep(1000)
      return 'data3'
    })
    await sleep(10)
    await testClient.cancelQueries()
    const state1 = testClient.getQueryState(key1)
    const state2 = testClient.getQueryState(key2)
    const state3 = testClient.getQueryState(key3)
    testCache.clear()
    expect(state1).toMatchObject({
      data: 'data',
      status: 'success',
    })
    expect(state2).toMatchObject({
      data: undefined,
      error: 'err',
      status: 'error',
    })
    expect(state3).toMatchObject({
      data: undefined,
      status: 'idle',
    })
    consoleMock.mockRestore()
  })

  test('refetchQueries should refetch all queries when no arguments are given', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = jest.fn()
    const queryFn2 = jest.fn()
    const testCache = new QueryCache()
    const testClient = new QueryClient({ cache: testCache })
    await testClient.fetchQueryData(key1, queryFn1)
    await testClient.fetchQueryData(key2, queryFn2)
    const observer1 = testClient.watchQuery(key1)
    const observer2 = testClient.watchQuery(key2)
    observer1.subscribe()
    observer2.subscribe()
    await testClient.refetchQueries()
    observer1.clear()
    observer2.clear()
    testCache.clear()
    expect(queryFn1).toHaveBeenCalledTimes(2)
    expect(queryFn2).toHaveBeenCalledTimes(2)
  })

  test('refetchQueries should be able to refetch all fresh queries', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = jest.fn()
    const queryFn2 = jest.fn()
    const testCache = new QueryCache()
    const testClient = new QueryClient({ cache: testCache })
    await testClient.fetchQueryData(key1, queryFn1)
    await testClient.fetchQueryData(key2, queryFn2)
    const observer = testClient.watchQuery(key1, { staleTime: Infinity })
    const unsubscribe = observer.subscribe()
    await testClient.refetchQueries({ active: true, stale: false })
    unsubscribe()
    testCache.clear()
    expect(queryFn1).toHaveBeenCalledTimes(2)
    expect(queryFn2).toHaveBeenCalledTimes(1)
  })

  test('refetchQueries should be able to refetch all stale queries', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = jest.fn()
    const queryFn2 = jest.fn()
    const testCache = new QueryCache()
    const testClient = new QueryClient({ cache: testCache })
    await testClient.fetchQueryData(key1, queryFn1)
    await testClient.fetchQueryData(key2, queryFn2)
    const observer = testClient.watchQuery(key1)
    const unsubscribe = observer.subscribe()
    testClient.invalidateQueries(key1)
    await testClient.refetchQueries({ stale: true })
    unsubscribe()
    testCache.clear()
    expect(queryFn1).toHaveBeenCalledTimes(2)
    expect(queryFn2).toHaveBeenCalledTimes(1)
  })

  test('refetchQueries should be able to refetch all stale and active queries', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = jest.fn()
    const queryFn2 = jest.fn()
    const testCache = new QueryCache()
    const testClient = new QueryClient({ cache: testCache })
    await testClient.fetchQueryData(key1, queryFn1)
    await testClient.fetchQueryData(key2, queryFn2)
    testClient.invalidateQueries(key1)
    const observer = testClient.watchQuery(key1)
    const unsubscribe = observer.subscribe()
    await testClient.refetchQueries({ active: true, stale: true })
    unsubscribe()
    testCache.clear()
    expect(queryFn1).toHaveBeenCalledTimes(2)
    expect(queryFn2).toHaveBeenCalledTimes(1)
  })

  test('refetchQueries should be able to refetch all active and inactive queries', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = jest.fn()
    const queryFn2 = jest.fn()
    const testCache = new QueryCache()
    const testClient = new QueryClient({ cache: testCache })
    await testClient.fetchQueryData(key1, queryFn1)
    await testClient.fetchQueryData(key2, queryFn2)
    const observer = testClient.watchQuery(key1, { staleTime: Infinity })
    const unsubscribe = observer.subscribe()
    await testClient.refetchQueries()
    unsubscribe()
    testCache.clear()
    expect(queryFn1).toHaveBeenCalledTimes(2)
    expect(queryFn2).toHaveBeenCalledTimes(2)
  })

  test('refetchQueries should be able to refetch all active and inactive queries', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = jest.fn()
    const queryFn2 = jest.fn()
    const testCache = new QueryCache()
    const testClient = new QueryClient({ cache: testCache })
    await testClient.fetchQueryData(key1, queryFn1)
    await testClient.fetchQueryData(key2, queryFn2)
    const observer = testClient.watchQuery(key1, { staleTime: Infinity })
    const unsubscribe = observer.subscribe()
    await testClient.refetchQueries({ active: true, inactive: true })
    unsubscribe()
    testCache.clear()
    expect(queryFn1).toHaveBeenCalledTimes(2)
    expect(queryFn2).toHaveBeenCalledTimes(2)
  })

  test('invalidateQueries should not refetch inactive queries by default', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = jest.fn()
    const queryFn2 = jest.fn()
    const testCache = new QueryCache()
    const testClient = new QueryClient({ cache: testCache })
    await testClient.fetchQueryData(key1, queryFn1)
    await testClient.fetchQueryData(key2, queryFn2)
    const observer = testClient.watchQuery(key1, {
      enabled: false,
      staleTime: Infinity,
    })
    const unsubscribe = observer.subscribe()
    testClient.invalidateQueries(key1)
    unsubscribe()
    testCache.clear()
    expect(queryFn1).toHaveBeenCalledTimes(1)
    expect(queryFn2).toHaveBeenCalledTimes(1)
  })

  test('find should filter correctly', async () => {
    const key = queryKey()
    const testCache = new QueryCache()
    const testClient = new QueryClient({ cache: testCache })
    await testClient.prefetchQuery(key, () => 'data1')
    const query = testCache.find(key)!
    expect(query).toBeDefined()
  })

  test('findAll should filter correctly', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const testCache = new QueryCache()
    const testClient = new QueryClient({ cache: testCache })
    await testClient.prefetchQuery(key1, () => 'data1')
    await testClient.prefetchQuery(key2, () => 'data2')
    await testClient.prefetchQuery([{ a: 'a', b: 'b' }], () => 'data3')
    await testClient.prefetchQuery(['posts', 1], () => 'data4')
    testClient.invalidateQueries(key2)
    const query1 = testCache.find(key1)!
    const query2 = testCache.find(key2)!
    const query3 = testCache.find([{ a: 'a', b: 'b' }])!
    const query4 = testCache.find(['posts', 1])!

    expect(testCache.findAll(key1)).toEqual([query1])
    expect(testCache.findAll([key1])).toEqual([query1])
    expect(testCache.findAll()).toEqual([query1, query2, query3, query4])
    expect(testCache.findAll({})).toEqual([query1, query2, query3, query4])
    expect(testCache.findAll(key1, { active: false })).toEqual([query1])
    expect(testCache.findAll(key1, { active: true })).toEqual([])
    expect(testCache.findAll(key1, { stale: true })).toEqual([])
    expect(testCache.findAll(key1, { stale: false })).toEqual([query1])
    expect(testCache.findAll(key1, { stale: false, active: true })).toEqual([])
    expect(testCache.findAll(key1, { stale: false, active: false })).toEqual([
      query1,
    ])
    expect(
      testCache.findAll(key1, {
        stale: false,
        active: false,
        exact: true,
      })
    ).toEqual([query1])

    expect(testCache.findAll(key2)).toEqual([query2])
    expect(testCache.findAll(key2, { stale: undefined })).toEqual([query2])
    expect(testCache.findAll(key2, { stale: true })).toEqual([query2])
    expect(testCache.findAll(key2, { stale: false })).toEqual([])
    expect(testCache.findAll([{ b: 'b' }])).toEqual([query3])
    expect(testCache.findAll([{ a: 'a' }], { exact: false })).toEqual([query3])
    expect(testCache.findAll([{ a: 'a' }], { exact: true })).toEqual([])
    expect(testCache.findAll([{ a: 'a', b: 'b' }], { exact: true })).toEqual([
      query3,
    ])
    expect(testCache.findAll([{ a: 'a', b: 'b' }])).toEqual([query3])
    expect(testCache.findAll([{ a: 'a', b: 'b', c: 'c' }])).toEqual([])
    expect(testCache.findAll([{ a: 'a' }], { stale: false })).toEqual([query3])
    expect(testCache.findAll([{ a: 'a' }], { stale: true })).toEqual([])
    expect(testCache.findAll([{ a: 'a' }], { fresh: false })).toEqual([])
    expect(testCache.findAll([{ a: 'a' }], { fresh: true })).toEqual([query3])
    expect(testCache.findAll([{ a: 'a' }], { active: true })).toEqual([])
    expect(testCache.findAll([{ a: 'a' }], { inactive: true })).toEqual([
      query3,
    ])
    expect(
      testCache.findAll({ predicate: query => query === query3 })
    ).toEqual([query3])
    expect(testCache.findAll('posts')).toEqual([query4])
  })

  test('query interval is cleared when unsubscribed to a refetchInterval query', async () => {
    const key = queryKey()

    const fetchData = () => Promise.resolve('data')
    const observer = client.watchQuery(key, fetchData, {
      cacheTime: 0,
      refetchInterval: 1,
    })
    const unsubscribe = observer.subscribe()
    // @ts-expect-error
    expect(observer.refetchIntervalId).not.toBeUndefined()
    unsubscribe()
    // @ts-expect-error
    expect(observer.refetchIntervalId).toBeUndefined()
    await sleep(10)
    expect(cache.find(key)).toBeUndefined()
  })

  test('query is garbage collected when unsubscribed to', async () => {
    const key = queryKey()
    const observer = client.watchQuery(key, async () => 'data', {
      cacheTime: 0,
    })
    expect(cache.find(key)).toBeDefined()
    const unsubscribe = observer.subscribe()
    unsubscribe()
    expect(cache.find(key)).toBeDefined()
    await sleep(100)
    expect(cache.find(key)).toBeUndefined()
  })

  test('query is not garbage collected unless there are no subscribers', async () => {
    const key = queryKey()
    const observer = client.watchQuery(key, async () => 'data', {
      cacheTime: 0,
    })
    expect(cache.find(key)).toBeDefined()
    const unsubscribe = observer.subscribe()
    await sleep(100)
    expect(cache.find(key)).toBeDefined()
    unsubscribe()
    await sleep(100)
    expect(cache.find(key)).toBeUndefined()
    client.setQueryData(key, 'data')
    await sleep(100)
    expect(cache.find(key)).toBeDefined()
  })

  describe('QueryCache', () => {
    test('merges defaultOptions', async () => {
      const key = queryKey()

      const queryFn = () => 'data'
      const testClient = new QueryClient({
        cache: cache,
        defaultOptions: { queries: { queryFn } },
      })

      expect(() => testClient.prefetchQuery(key)).not.toThrow()
    })

    test('merges defaultOptions when query is added to cache', async () => {
      const key = queryKey()

      const testClient = new QueryClient({
        cache: cache,
        defaultOptions: {
          queries: { cacheTime: Infinity },
        },
      })

      const fetchData = () => Promise.resolve(undefined)
      await testClient.prefetchQuery(key, fetchData)
      const newQuery = cache.find(key)
      expect(newQuery?.options.cacheTime).toBe(Infinity)
    })

    test('subscribe passes the correct query', async () => {
      const key = queryKey()
      const testCache = new QueryCache()
      const testClient = new QueryClient({ cache: testCache })
      const subscriber = jest.fn()
      const unsubscribe = testCache.subscribe(subscriber)
      testClient.setQueryData(key, 'foo')
      const query = testCache.find(key)
      await sleep(1)
      expect(subscriber).toHaveBeenCalledWith(query)
      unsubscribe()
    })

    test('query should use the longest cache time it has seen', async () => {
      const key = queryKey()
      await client.prefetchQuery(key, () => 'data', {
        cacheTime: 100,
      })
      await client.prefetchQuery(key, () => 'data', {
        cacheTime: 200,
      })
      await client.prefetchQuery(key, () => 'data', {
        cacheTime: 10,
      })
      const query = cache.find(key)!
      expect(query.cacheTime).toBe(200)
    })

    it('should continue retry after focus regain and resolve all promises', async () => {
      const key = queryKey()

      const originalVisibilityState = document.visibilityState

      // make page unfocused
      mockVisibilityState('hidden')

      let count = 0
      let result

      const promise = client.fetchQueryData(
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

      const promise = client.fetchQueryData(
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

      const promise = client.fetchQueryData(
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

      const query = cache.find(key)!

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

      client.prefetchQuery(key, async () => {
        await sleep(100)
        return 'data'
      })

      await sleep(10)

      // Subscribe and unsubscribe to simulate cancellation because the last observer unsubscribed
      const observer = client.watchQuery(key)
      const unsubscribe = observer.subscribe()
      unsubscribe()

      await sleep(100)

      const query = cache.find(key)!

      expect(query.state).toMatchObject({
        data: 'data',
        status: 'success',
        dataUpdateCount: 1,
      })
    })

    test('query should not continue if cancellation is supported', async () => {
      const key = queryKey()

      const cancel = jest.fn()

      client.prefetchQuery(key, async () => {
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
      const observer = client.watchQuery(key)
      const unsubscribe = observer.subscribe()
      unsubscribe()

      await sleep(100)

      const query = cache.find(key)!

      expect(cancel).toHaveBeenCalled()
      expect(query.state).toMatchObject({
        data: undefined,
        status: 'error',
        errorUpdateCount: 1,
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

      const promise = client.fetchQueryData(key, queryFn, {
        retry: 3,
        retryDelay: 10,
      })

      promise.catch(e => {
        error = e
      })

      const query = cache.find(key)!
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

      client.prefetchQuery(key, queryFn)
      const query = cache.find(key)!
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
      await client.prefetchQuery(key, async () => 'data')
      const query = cache.find(key)!
      query.cancel()
      await sleep(10)
      expect(query.state.data).toBe('data')
    })

    test('cancelling a rejected query should not have any effect', async () => {
      const consoleMock = mockConsoleError()

      const key = queryKey()

      await client.prefetchQuery(key, async () => {
        throw new Error('error')
      })
      const query = cache.find(key)!
      query.cancel()
      await sleep(10)

      expect(isError(query.state.error)).toBe(true)
      expect(isCancelledError(query.state.error)).toBe(false)

      consoleMock.mockRestore()
    })
  })
})
