import {
  sleep,
  queryKey,
  mockVisibilityState,
  mockConsoleError,
  mockNavigatorOnLine,
  expectType,
} from '../../react/tests/utils'
import {
  Environment,
  QueryCache,
  cancelQueries,
  fetchQuery,
  findQueries,
  findQuery,
  getQueryData,
  getQueryState,
  invalidateQueries,
  prefetchQuery,
  refetchQueries,
  removeQueries,
  setQueryData,
} from '../..'
import { isCancelledError, isError } from '../utils'
import { QueryObserverResult } from '../types'
import { QueryObserver } from '../queryObserver'
import { QueriesObserver } from '../queriesObserver'

describe('queryCache', () => {
  const queryCache = new QueryCache()
  const environment = new Environment({ queryCache })
  environment.mount()

  test('setQueryDefaults does not trigger a fetch', async () => {
    const key = queryKey()
    environment.setQueryDefaults(key, { queryFn: () => 'data' })
    await sleep(1)
    const data = getQueryData(environment, key)
    expect(data).toBeUndefined()
  })

  test('setQueryDefaults should be able to override defaults', async () => {
    const consoleMock = mockConsoleError()
    const key = queryKey()
    const queryFn = jest.fn().mockRejectedValue('reject')
    environment.setQueryDefaults(key, { queryFn, retry: 1 })
    const observer = new QueryObserver(environment, { queryKey: key })
    const { error } = await observer.getNextResult({ throwOnError: false })
    expect(error).toBe('reject')
    expect(queryFn).toHaveBeenCalledTimes(2)
    consoleMock.mockRestore()
  })

  test('setQueryData does not crash if query could not be found', () => {
    const key = queryKey()

    const user = { userId: 1 }
    expect(() => {
      setQueryData(environment, [key, user], (prevUser?: typeof user) => ({
        ...prevUser!,
        name: 'Edvin',
      }))
    }).not.toThrow()
  })

  test('setQueryData does not crash when variable is null', () => {
    const key = queryKey()

    setQueryData(environment, [key, { userId: null }], 'Old Data')

    expect(() => {
      setQueryData(environment, [key, { userId: null }], 'New Data')
    }).not.toThrow()
  })

  // https://github.com/tannerlinsley/react-query/issues/652
  test('fetchQueryData should not retry by default', async () => {
    const consoleMock = mockConsoleError()

    const key = queryKey()

    await expect(
      fetchQuery(environment, {
        queryKey: key,
        queryFn: async () => {
          throw new Error('error')
        },
      })
    ).rejects.toEqual(new Error('error'))

    consoleMock.mockRestore()
  })

  test('fetchQueryData returns the cached data on cache hits', async () => {
    const key = queryKey()

    const fetchFn = () => Promise.resolve('data')
    const first = await fetchQuery(environment, {
      queryKey: key,
      queryFn: fetchFn,
    })
    const second = await fetchQuery(environment, {
      queryKey: key,
      queryFn: fetchFn,
    })

    expect(second).toBe(first)
  })

  test('fetchQueryData should not force fetch', async () => {
    const key = queryKey()

    setQueryData(environment, key, 'og')
    const fetchFn = () => Promise.resolve('new')
    const first = await fetchQuery(environment, {
      queryKey: key,
      queryFn: fetchFn,
      initialData: 'initial',
      staleTime: 100,
    })
    expect(first).toBe('og')
  })

  test('fetchQueryData should only fetch if the data is older then the given stale time', async () => {
    const key = queryKey()

    let count = 0
    const fetchFn = () => ++count

    setQueryData(environment, key, count)
    const first = await fetchQuery(environment, {
      queryKey: key,
      queryFn: fetchFn,
      staleTime: 100,
    })
    await sleep(11)
    const second = await fetchQuery(environment, {
      queryKey: key,
      queryFn: fetchFn,
      staleTime: 10,
    })
    const third = await fetchQuery(environment, {
      queryKey: key,
      queryFn: fetchFn,
      staleTime: 10,
    })
    await sleep(11)
    const fourth = await fetchQuery(environment, {
      queryKey: key,
      queryFn: fetchFn,
      staleTime: 10,
    })
    expect(first).toBe(0)
    expect(second).toBe(1)
    expect(third).toBe(1)
    expect(fourth).toBe(2)
  })

  test('prefetchQuery should return undefined when an error is thrown', async () => {
    const consoleMock = mockConsoleError()

    const key = queryKey()

    const result = await prefetchQuery(environment, {
      queryKey: key,
      queryFn: async () => {
        throw new Error('error')
      },
      retry: false,
    })

    expect(result).toBeUndefined()
    expect(consoleMock).toHaveBeenCalled()

    consoleMock.mockRestore()
  })

  test('should notify listeners when new query is added', async () => {
    const key = queryKey()

    const callback = jest.fn()

    queryCache.subscribe(callback)

    prefetchQuery(environment, { queryKey: key, queryFn: () => 'data' })

    await sleep(100)

    expect(callback).toHaveBeenCalled()
  })

  test('should include the queryCache and query when notifying listeners', async () => {
    const key = queryKey()

    const callback = jest.fn()

    queryCache.subscribe(callback)

    prefetchQuery(environment, { queryKey: key, queryFn: () => 'data' })
    const query = findQuery(environment, key)

    await sleep(100)

    expect(callback).toHaveBeenCalledWith(query)
  })

  test('should notify subscribers when new query with initialData is added', async () => {
    const key = queryKey()

    const callback = jest.fn()

    queryCache.subscribe(callback)

    prefetchQuery(environment, {
      queryKey: key,
      queryFn: () => 'data',
      initialData: 'initial',
    })

    await sleep(100)

    expect(callback).toHaveBeenCalled()
  })

  test('setQueryData creates a new query if query was not found', () => {
    const key = queryKey()

    setQueryData(environment, key, 'bar')

    expect(getQueryData(environment, key)).toBe('bar')
  })

  test('setQueryData creates a new query if query was not found', () => {
    const key = queryKey()

    setQueryData(environment, key, 'qux')

    expect(getQueryData(environment, key)).toBe('qux')
  })

  test('removeQueries does not crash when exact is provided', async () => {
    const key = queryKey()

    const fetchFn = () => Promise.resolve('data')

    // check the query was added to the cache
    await prefetchQuery(environment, { queryKey: key, queryFn: fetchFn })
    expect(findQuery(environment, key)).toBeTruthy()

    // check the error doesn't occur
    expect(() =>
      removeQueries(environment, { queryKey: key, exact: true })
    ).not.toThrow()

    // check query was successful removed
    expect(findQuery(environment, key)).toBeFalsy()
  })

  test('setQueryData updater function works as expected', () => {
    const key = queryKey()

    const updater = jest.fn(oldData => `new data + ${oldData}`)

    setQueryData(environment, key, 'test data')
    setQueryData(environment, key, updater)

    expect(updater).toHaveBeenCalled()
    expect(findQuery(environment, key)!.state.data).toEqual(
      'new data + test data'
    )
  })

  test('QueriesObserver should return an array with all query results', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = jest.fn().mockReturnValue(1)
    const queryFn2 = jest.fn().mockReturnValue(2)
    const testCache = new QueryCache()
    const testEnvironment = new Environment({ queryCache: testCache })
    const observer = new QueriesObserver(testEnvironment, [
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

  test('QueriesObserver should update when a query updates', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = jest.fn().mockReturnValue(1)
    const queryFn2 = jest.fn().mockReturnValue(2)
    const testCache = new QueryCache()
    const testEnvironment = new Environment({ queryCache: testCache })
    const observer = new QueriesObserver(testEnvironment, [
      { queryKey: key1, queryFn: queryFn1 },
      { queryKey: key2, queryFn: queryFn2 },
    ])
    const results: QueryObserverResult[][] = []
    results.push(observer.getCurrentResult())
    const unsubscribe = observer.subscribe(result => {
      results.push(result)
    })
    await sleep(1)
    setQueryData(testEnvironment, key2, 3)
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

  test('QueriesObserver should update when a query is removed', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = jest.fn().mockReturnValue(1)
    const queryFn2 = jest.fn().mockReturnValue(2)
    const testCache = new QueryCache()
    const testEnvironment = new Environment({ queryCache: testCache })
    const observer = new QueriesObserver(testEnvironment, [
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
    expect(
      findQuery(testEnvironment, { queryKey: key1, active: true })
    ).toBeUndefined()
    expect(
      findQuery(testEnvironment, { queryKey: key2, active: true })
    ).toBeDefined()
    unsubscribe()
    expect(
      findQuery(testEnvironment, { queryKey: key1, active: true })
    ).toBeUndefined()
    expect(
      findQuery(testEnvironment, { queryKey: key2, active: true })
    ).toBeUndefined()
    testCache.clear()
    expect(results.length).toBe(4)
    expect(results).toMatchObject([
      [{ data: undefined }, { data: undefined }],
      [{ data: 1 }, { data: undefined }],
      [{ data: 1 }, { data: 2 }],
      [{ data: 2 }],
    ])
  })

  test('QueriesObserver should update when a query changed position', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = jest.fn().mockReturnValue(1)
    const queryFn2 = jest.fn().mockReturnValue(2)
    const testCache = new QueryCache()
    const testEnvironment = new Environment({ queryCache: testCache })
    const observer = new QueriesObserver(testEnvironment, [
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

  test('QueriesObserver should not update when nothing has changed', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = jest.fn().mockReturnValue(1)
    const queryFn2 = jest.fn().mockReturnValue(2)
    const testCache = new QueryCache()
    const testEnvironment = new Environment({ queryCache: testCache })
    const observer = new QueriesObserver(testEnvironment, [
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

  test('QueriesObserver should trigger all fetches when subscribed', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = jest.fn()
    const queryFn2 = jest.fn()
    const testCache = new QueryCache()
    const testEnvironment = new Environment({ queryCache: testCache })
    const observer = new QueriesObserver(testEnvironment, [
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

  test('QueryObserver should trigger a fetch when subscribed', async () => {
    const key = queryKey()
    const queryFn = jest.fn()
    const testCache = new QueryCache()
    const testEnvironment = new Environment({ queryCache: testCache })
    const observer = new QueryObserver(testEnvironment, {
      queryKey: key,
      queryFn,
    })
    const unsubscribe = observer.subscribe()
    await sleep(1)
    unsubscribe()
    testCache.clear()
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  test('QueryObserver should be able to fetch with a selector', async () => {
    const key = queryKey()
    const testCache = new QueryCache()
    const testEnvironment = new Environment({ queryCache: testCache })
    const observer = new QueryObserver(testEnvironment, {
      queryKey: key,
      queryFn: () => ({ count: 1 }),
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

  test('QueryObserver should be able to fetch with a selector using the fetch method', async () => {
    const key = queryKey()
    const testCache = new QueryCache()
    const testEnvironment = new Environment({ queryCache: testCache })
    const observer = new QueryObserver(testEnvironment, {
      queryKey: key,
      queryFn: () => ({ count: 1 }),
      select: data => ({ myCount: data.count }),
    })
    const observerResult = await observer.refetch()
    testCache.clear()
    expectType<{ myCount: number } | undefined>(observerResult.data)
    expect(observerResult.data).toMatchObject({ myCount: 1 })
  })

  test('QueryObserver should be able to fetch with a selector and object syntax', async () => {
    const key = queryKey()
    const testCache = new QueryCache()
    const testEnvironment = new Environment({ queryCache: testCache })
    const observer = new QueryObserver(testEnvironment, {
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

  test('QueryObserver should run the selector again if the data changed', async () => {
    const key = queryKey()
    const testCache = new QueryCache()
    const testEnvironment = new Environment({ queryCache: testCache })
    let count = 0
    const observer = new QueryObserver(testEnvironment, {
      queryKey: key,
      queryFn: () => ({ count }),
      select: data => {
        count++
        return { myCount: data.count }
      },
    })
    const observerResult1 = await observer.refetch()
    const observerResult2 = await observer.refetch()
    testCache.clear()
    expect(count).toBe(2)
    expect(observerResult1.data).toMatchObject({ myCount: 0 })
    expect(observerResult2.data).toMatchObject({ myCount: 1 })
  })

  test('QueryObserver should not run the selector again if the data did not change', async () => {
    const key = queryKey()
    const testCache = new QueryCache()
    const testEnvironment = new Environment({ queryCache: testCache })
    let count = 0
    const observer = new QueryObserver(testEnvironment, {
      queryKey: key,
      queryFn: () => ({ count: 1 }),
      select: data => {
        count++
        return { myCount: data.count }
      },
    })
    const observerResult1 = await observer.refetch()
    const observerResult2 = await observer.refetch()
    testCache.clear()
    expect(count).toBe(1)
    expect(observerResult1.data).toMatchObject({ myCount: 1 })
    expect(observerResult2.data).toMatchObject({ myCount: 1 })
  })

  test('QueryObserver should structurally share the selector', async () => {
    const key = queryKey()
    const testCache = new QueryCache()
    const testEnvironment = new Environment({ queryCache: testCache })
    let count = 0
    const observer = new QueryObserver(testEnvironment, {
      queryKey: key,
      queryFn: () => ({ count: ++count }),
      select: () => ({ myCount: 1 }),
    })
    const observerResult1 = await observer.refetch()
    const observerResult2 = await observer.refetch()
    testCache.clear()
    expect(count).toBe(2)
    expect(observerResult1.data).toBe(observerResult2.data)
  })

  test('QueryObserver should not trigger a fetch when subscribed and disabled', async () => {
    const key = queryKey()
    const queryFn = jest.fn()
    const testCache = new QueryCache()
    const testEnvironment = new Environment({ queryCache: testCache })
    const observer = new QueryObserver(testEnvironment, {
      queryKey: key,
      queryFn,
      enabled: false,
    })
    const unsubscribe = observer.subscribe()
    await sleep(1)
    unsubscribe()
    testCache.clear()
    expect(queryFn).toHaveBeenCalledTimes(0)
  })

  test('QueryObserver should not trigger a fetch when not subscribed', async () => {
    const key = queryKey()
    const queryFn = jest.fn()
    const testCache = new QueryCache()
    const testEnvironment = new Environment({ queryCache: testCache })
    new QueryObserver(testEnvironment, { queryKey: key, queryFn: queryFn })
    await sleep(1)
    testCache.clear()
    expect(queryFn).toHaveBeenCalledTimes(0)
  })

  test('QueryObserver should be able to watch a query without defining a query function', async () => {
    const key = queryKey()
    const queryFn = jest.fn()
    const callback = jest.fn()
    const testCache = new QueryCache()
    const testEnvironment = new Environment({ queryCache: testCache })
    const observer = new QueryObserver(testEnvironment, {
      queryKey: key,
      enabled: false,
    })
    const unsubscribe = observer.subscribe(callback)
    await fetchQuery(testEnvironment, { queryKey: key, queryFn })
    unsubscribe()
    testCache.clear()
    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledTimes(2)
  })

  test('QueryObserver should accept unresolved query config in update function', async () => {
    const key = queryKey()
    const queryFn = jest.fn()
    const testCache = new QueryCache()
    const testEnvironment = new Environment({ queryCache: testCache })
    const observer = new QueryObserver(testEnvironment, {
      queryKey: key,
      enabled: false,
    })
    const results: QueryObserverResult<unknown>[] = []
    const unsubscribe = observer.subscribe(x => {
      results.push(x)
    })
    observer.setOptions({ enabled: false, staleTime: 10 })
    await fetchQuery(testEnvironment, { queryKey: key, queryFn })
    await sleep(100)
    unsubscribe()
    testCache.clear()
    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(results.length).toBe(3)
    expect(results[0]).toMatchObject({ isStale: true })
    expect(results[1]).toMatchObject({ isStale: false })
    expect(results[2]).toMatchObject({ isStale: true })
  })

  test('QueryObserver should be able to handle multiple subscribers', async () => {
    const key = queryKey()
    const queryFn = jest.fn().mockReturnValue('data')
    const testCache = new QueryCache()
    const testEnvironment = new Environment({ queryCache: testCache })
    const observer = new QueryObserver<string>(testEnvironment, {
      queryKey: key,
      enabled: false,
    })
    const results1: QueryObserverResult<string>[] = []
    const results2: QueryObserverResult<string>[] = []
    const unsubscribe1 = observer.subscribe(x => {
      results1.push(x)
    })
    const unsubscribe2 = observer.subscribe(x => {
      results2.push(x)
    })
    await fetchQuery(testEnvironment, { queryKey: key, queryFn })
    await sleep(50)
    unsubscribe1()
    unsubscribe2()
    testCache.clear()
    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(results1.length).toBe(2)
    expect(results2.length).toBe(2)
    expect(results1[0]).toMatchObject({ data: undefined })
    expect(results1[1]).toMatchObject({ data: 'data' })
    expect(results2[0]).toMatchObject({ data: undefined })
    expect(results2[1]).toMatchObject({ data: 'data' })
  })

  test('QueryObserver should be able to resolve a promise', async () => {
    const key = queryKey()
    const queryFn = jest.fn().mockReturnValue('data')
    const testCache = new QueryCache()
    const testEnvironment = new Environment({ queryCache: testCache })
    const observer = new QueryObserver<string>(testEnvironment, {
      queryKey: key,
      enabled: false,
    })
    let value
    observer.getNextResult().then(x => {
      value = x
    })
    prefetchQuery(testEnvironment, { queryKey: key, queryFn })
    await sleep(50)
    testCache.clear()
    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(value).toMatchObject({ data: 'data' })
  })

  test('QueryObserver should be able to resolve a promise with an error', async () => {
    const consoleMock = mockConsoleError()
    const key = queryKey()
    const testCache = new QueryCache()
    const testEnvironment = new Environment({ queryCache: testCache })
    const observer = new QueryObserver<string>(testEnvironment, {
      queryKey: key,
      enabled: false,
    })
    let error
    observer.getNextResult({ throwOnError: true }).catch(e => {
      error = e
    })
    prefetchQuery(testEnvironment, {
      queryKey: key,
      queryFn: () => Promise.reject('reject'),
    })
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
    const testEnvironment = new Environment({ queryCache: testCache })
    await fetchQuery(testEnvironment, {
      queryKey: key1,
      queryFn: async () => {
        return 'data'
      },
    })
    try {
      await fetchQuery(testEnvironment, {
        queryKey: key2,
        queryFn: async () => {
          return Promise.reject('err')
        },
      })
    } catch {}
    fetchQuery(testEnvironment, {
      queryKey: key1,
      queryFn: async () => {
        await sleep(1000)
        return 'data2'
      },
    })
    try {
      fetchQuery(testEnvironment, {
        queryKey: key2,
        queryFn: async () => {
          await sleep(1000)
          return Promise.reject('err2')
        },
      })
    } catch {}
    fetchQuery(testEnvironment, {
      queryKey: key3,
      queryFn: async () => {
        await sleep(1000)
        return 'data3'
      },
    })
    await sleep(10)
    await cancelQueries(testEnvironment)
    const state1 = getQueryState(testEnvironment, key1)
    const state2 = getQueryState(testEnvironment, key2)
    const state3 = getQueryState(testEnvironment, key3)
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
    const testEnvironment = new Environment({ queryCache: testCache })
    await fetchQuery(testEnvironment, { queryKey: key1, queryFn: queryFn1 })
    await fetchQuery(testEnvironment, { queryKey: key2, queryFn: queryFn2 })
    const observer1 = new QueryObserver(testEnvironment, {
      queryKey: key1,
      enabled: false,
    })
    const observer2 = new QueryObserver(testEnvironment, {
      queryKey: key1,
      enabled: false,
    })
    observer1.subscribe()
    observer2.subscribe()
    await refetchQueries(testEnvironment)
    observer1.destroy()
    observer2.destroy()
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
    const testEnvironment = new Environment({ queryCache: testCache })
    await fetchQuery(testEnvironment, { queryKey: key1, queryFn: queryFn1 })
    await fetchQuery(testEnvironment, { queryKey: key2, queryFn: queryFn2 })
    const observer = new QueryObserver(testEnvironment, {
      queryKey: key1,
      queryFn: queryFn1,
      staleTime: Infinity,
    })
    const unsubscribe = observer.subscribe()
    await refetchQueries(testEnvironment, { active: true, stale: false })
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
    const testEnvironment = new Environment({ queryCache: testCache })
    await fetchQuery(testEnvironment, { queryKey: key1, queryFn: queryFn1 })
    await fetchQuery(testEnvironment, { queryKey: key2, queryFn: queryFn2 })
    const observer = new QueryObserver(testEnvironment, {
      queryKey: key1,
      queryFn: queryFn1,
    })
    const unsubscribe = observer.subscribe()
    invalidateQueries(testEnvironment, key1)
    await refetchQueries(testEnvironment, { stale: true })
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
    const testEnvironment = new Environment({ queryCache: testCache })
    await fetchQuery(testEnvironment, { queryKey: key1, queryFn: queryFn1 })
    await fetchQuery(testEnvironment, { queryKey: key2, queryFn: queryFn2 })
    invalidateQueries(testEnvironment, key1)
    const observer = new QueryObserver(testEnvironment, {
      queryKey: key1,
      queryFn: queryFn1,
    })
    const unsubscribe = observer.subscribe()
    await refetchQueries(testEnvironment, { active: true, stale: true })
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
    const testEnvironment = new Environment({ queryCache: testCache })
    await fetchQuery(testEnvironment, { queryKey: key1, queryFn: queryFn1 })
    await fetchQuery(testEnvironment, { queryKey: key2, queryFn: queryFn2 })
    const observer = new QueryObserver(testEnvironment, {
      queryKey: key1,
      queryFn: queryFn1,
      staleTime: Infinity,
    })
    const unsubscribe = observer.subscribe()
    await refetchQueries(testEnvironment)
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
    const testEnvironment = new Environment({ queryCache: testCache })
    await fetchQuery(testEnvironment, { queryKey: key1, queryFn: queryFn1 })
    await fetchQuery(testEnvironment, { queryKey: key2, queryFn: queryFn2 })
    const observer = new QueryObserver(testEnvironment, {
      queryKey: key1,
      queryFn: queryFn1,
      staleTime: Infinity,
    })
    const unsubscribe = observer.subscribe()
    await refetchQueries(testEnvironment, { active: true, inactive: true })
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
    const testEnvironment = new Environment({ queryCache: testCache })
    await fetchQuery(testEnvironment, { queryKey: key1, queryFn: queryFn1 })
    await fetchQuery(testEnvironment, { queryKey: key2, queryFn: queryFn2 })
    const observer = new QueryObserver(testEnvironment, {
      queryKey: key1,
      enabled: false,
      staleTime: Infinity,
    })
    const unsubscribe = observer.subscribe()
    invalidateQueries(testEnvironment, key1)
    unsubscribe()
    testCache.clear()
    expect(queryFn1).toHaveBeenCalledTimes(1)
    expect(queryFn2).toHaveBeenCalledTimes(1)
  })

  test('find should filter correctly', async () => {
    const key = queryKey()
    const testCache = new QueryCache()
    const testEnvironment = new Environment({ queryCache: testCache })
    await prefetchQuery(testEnvironment, {
      queryKey: key,
      queryFn: () => 'data1',
    })
    const query = findQuery(testEnvironment, key)!
    expect(query).toBeDefined()
  })

  test('findAll should filter correctly', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const testCache = new QueryCache()
    const testEnvironment = new Environment({ queryCache: testCache })
    await prefetchQuery(testEnvironment, {
      queryKey: key1,
      queryFn: () => 'data1',
    })
    await prefetchQuery(testEnvironment, {
      queryKey: key2,
      queryFn: () => 'data2',
    })
    await prefetchQuery(testEnvironment, {
      queryKey: [{ a: 'a', b: 'b' }],
      queryFn: () => 'data3',
    })
    await prefetchQuery(testEnvironment, {
      queryKey: ['posts', 1],
      queryFn: () => 'data4',
    })
    invalidateQueries(testEnvironment, key2)
    const query1 = findQuery(testEnvironment, key1)!
    const query2 = findQuery(testEnvironment, key2)!
    const query3 = findQuery(testEnvironment, [{ a: 'a', b: 'b' }])!
    const query4 = findQuery(testEnvironment, ['posts', 1])!

    expect(findQueries(testEnvironment, key1)).toEqual([query1])
    expect(findQueries(testEnvironment, [key1])).toEqual([query1])
    expect(findQueries(testEnvironment)).toEqual([
      query1,
      query2,
      query3,
      query4,
    ])
    expect(findQueries(testEnvironment, {})).toEqual([
      query1,
      query2,
      query3,
      query4,
    ])
    expect(
      findQueries(testEnvironment, { queryKey: key1, active: false })
    ).toEqual([query1])
    expect(
      findQueries(testEnvironment, { queryKey: key1, active: true })
    ).toEqual([])
    expect(
      findQueries(testEnvironment, { queryKey: key1, stale: true })
    ).toEqual([])
    expect(
      findQueries(testEnvironment, { queryKey: key1, stale: false })
    ).toEqual([query1])
    expect(
      findQueries(testEnvironment, {
        queryKey: key1,
        stale: false,
        active: true,
      })
    ).toEqual([])
    expect(
      findQueries(testEnvironment, {
        queryKey: key1,
        stale: false,
        active: false,
      })
    ).toEqual([query1])
    expect(
      findQueries(testEnvironment, {
        queryKey: key1,
        stale: false,
        active: false,
        exact: true,
      })
    ).toEqual([query1])

    expect(findQueries(testEnvironment, key2)).toEqual([query2])
    expect(
      findQueries(testEnvironment, { queryKey: key2, stale: undefined })
    ).toEqual([query2])
    expect(
      findQueries(testEnvironment, { queryKey: key2, stale: true })
    ).toEqual([query2])
    expect(
      findQueries(testEnvironment, { queryKey: key2, stale: false })
    ).toEqual([])
    expect(findQueries(testEnvironment, [{ b: 'b' }])).toEqual([query3])
    expect(
      findQueries(testEnvironment, { queryKey: [{ a: 'a' }], exact: false })
    ).toEqual([query3])
    expect(
      findQueries(testEnvironment, { queryKey: [{ a: 'a' }], exact: true })
    ).toEqual([])
    expect(
      findQueries(testEnvironment, {
        queryKey: [{ a: 'a', b: 'b' }],
        exact: true,
      })
    ).toEqual([query3])
    expect(findQueries(testEnvironment, [{ a: 'a', b: 'b' }])).toEqual([query3])
    expect(findQueries(testEnvironment, [{ a: 'a', b: 'b', c: 'c' }])).toEqual(
      []
    )
    expect(
      findQueries(testEnvironment, { queryKey: [{ a: 'a' }], stale: false })
    ).toEqual([query3])
    expect(
      findQueries(testEnvironment, { queryKey: [{ a: 'a' }], stale: true })
    ).toEqual([])
    expect(
      findQueries(testEnvironment, { queryKey: [{ a: 'a' }], active: true })
    ).toEqual([])
    expect(
      findQueries(testEnvironment, { queryKey: [{ a: 'a' }], inactive: true })
    ).toEqual([query3])
    expect(
      findQueries(testEnvironment, { predicate: query => query === query3 })
    ).toEqual([query3])
    expect(findQueries(testEnvironment, 'posts')).toEqual([query4])
  })

  test('query interval is cleared when unsubscribed to a refetchInterval query', async () => {
    const key = queryKey()

    const fetchData = () => Promise.resolve('data')
    const observer = new QueryObserver(environment, {
      queryKey: key,
      queryFn: fetchData,
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
    expect(findQuery(environment, key)).toBeUndefined()
  })

  test('query is garbage collected when unsubscribed to', async () => {
    const key = queryKey()
    const observer = new QueryObserver(environment, {
      queryKey: key,
      queryFn: async () => 'data',
      cacheTime: 0,
    })
    expect(findQuery(environment, key)).toBeDefined()
    const unsubscribe = observer.subscribe()
    unsubscribe()
    expect(findQuery(environment, key)).toBeDefined()
    await sleep(100)
    expect(findQuery(environment, key)).toBeUndefined()
  })

  test('query is not garbage collected unless there are no subscribers', async () => {
    const key = queryKey()
    const observer = new QueryObserver(environment, {
      queryKey: key,
      queryFn: async () => 'data',
      cacheTime: 0,
    })
    expect(findQuery(environment, key)).toBeDefined()
    const unsubscribe = observer.subscribe()
    await sleep(100)
    expect(findQuery(environment, key)).toBeDefined()
    unsubscribe()
    await sleep(100)
    expect(findQuery(environment, key)).toBeUndefined()
    setQueryData(environment, key, 'data')
    await sleep(100)
    expect(findQuery(environment, key)).toBeDefined()
  })

  describe('QueryCache', () => {
    test('merges defaultOptions', async () => {
      const key = queryKey()

      const queryFn = () => 'data'
      const testEnvironment = new Environment({
        queryCache,
        defaultOptions: { queries: { queryFn } },
      })

      expect(() =>
        prefetchQuery(testEnvironment, { queryKey: key })
      ).not.toThrow()
    })

    test('merges defaultOptions when query is added to cache', async () => {
      const key = queryKey()

      const testEnvironment = new Environment({
        queryCache,
        defaultOptions: {
          queries: { cacheTime: Infinity },
        },
      })

      const fetchData = () => Promise.resolve(undefined)
      await prefetchQuery(testEnvironment, {
        queryKey: key,
        queryFn: fetchData,
      })
      const newQuery = findQuery(environment, key)
      expect(newQuery?.options.cacheTime).toBe(Infinity)
    })

    test('subscribe passes the correct query', async () => {
      const key = queryKey()
      const testCache = new QueryCache()
      const testEnvironment = new Environment({ queryCache: testCache })
      const subscriber = jest.fn()
      const unsubscribe = testCache.subscribe(subscriber)
      setQueryData(testEnvironment, key, 'foo')
      const query = findQuery(testEnvironment, key)
      await sleep(1)
      expect(subscriber).toHaveBeenCalledWith(query)
      unsubscribe()
    })

    test('query should use the longest cache time it has seen', async () => {
      const key = queryKey()
      await prefetchQuery(environment, {
        queryKey: key,
        queryFn: () => 'data',
        cacheTime: 100,
      })
      await prefetchQuery(environment, {
        queryKey: key,
        queryFn: () => 'data',
        cacheTime: 200,
      })
      await prefetchQuery(environment, {
        queryKey: key,
        queryFn: () => 'data',
        cacheTime: 10,
      })
      const query = findQuery(environment, key)!
      expect(query.cacheTime).toBe(200)
    })

    it('should continue retry after focus regain and resolve all promises', async () => {
      const key = queryKey()

      const originalVisibilityState = document.visibilityState

      // make page unfocused
      mockVisibilityState('hidden')

      let count = 0
      let result

      const promise = fetchQuery(environment, {
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

      const promise = fetchQuery(environment, {
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

      const promise = fetchQuery(environment, {
        queryKey: key,
        queryFn: async () => {
          count++
          throw new Error(`error${count}`)
        },
        retry: 3,
        retryDelay: 1,
      })

      promise.catch(data => {
        result = data
      })

      const query = findQuery(environment, key)!

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

      prefetchQuery(environment, {
        queryKey: key,
        queryFn: async () => {
          await sleep(100)
          return 'data'
        },
      })

      await sleep(10)

      // Subscribe and unsubscribe to simulate cancellation because the last observer unsubscribed
      const observer = new QueryObserver(environment, {
        queryKey: key,
        enabled: false,
      })
      const unsubscribe = observer.subscribe()
      unsubscribe()

      await sleep(100)

      const query = findQuery(environment, key)!

      expect(query.state).toMatchObject({
        data: 'data',
        status: 'success',
        dataUpdateCount: 1,
      })
    })

    test('query should not continue if cancellation is supported', async () => {
      const key = queryKey()

      const cancel = jest.fn()

      prefetchQuery(environment, {
        queryKey: key,
        queryFn: async () => {
          const promise = new Promise((resolve, reject) => {
            sleep(100).then(() => resolve('data'))
            cancel.mockImplementation(() => {
              reject(new Error('Cancelled'))
            })
          }) as any
          promise.cancel = cancel
          return promise
        },
      })

      await sleep(10)

      // Subscribe and unsubscribe to simulate cancellation because the last observer unsubscribed
      const observer = new QueryObserver(environment, {
        queryKey: key,
        enabled: false,
      })
      const unsubscribe = observer.subscribe()
      unsubscribe()

      await sleep(100)

      const query = findQuery(environment, key)!

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

      const promise = fetchQuery(environment, {
        queryKey: key,
        queryFn: queryFn,
        retry: 3,
        retryDelay: 10,
      })

      promise.catch(e => {
        error = e
      })

      const query = findQuery(environment, key)!
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

      prefetchQuery(environment, { queryKey: key, queryFn: queryFn })
      const query = findQuery(environment, key)!
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
      await prefetchQuery(environment, {
        queryKey: key,
        queryFn: async () => 'data',
      })
      const query = findQuery(environment, key)!
      query.cancel()
      await sleep(10)
      expect(query.state.data).toBe('data')
    })

    test('cancelling a rejected query should not have any effect', async () => {
      const consoleMock = mockConsoleError()

      const key = queryKey()

      await prefetchQuery(environment, {
        queryKey: key,
        queryFn: async () => {
          throw new Error('error')
        },
      })
      const query = findQuery(environment, key)!
      query.cancel()
      await sleep(10)

      expect(isError(query.state.error)).toBe(true)
      expect(isCancelledError(query.state.error)).toBe(false)

      consoleMock.mockRestore()
    })
  })
})
