import {
  sleep,
  queryKey,
  mockConsoleError,
  expectType,
} from '../../react/tests/utils'
import { QueryClient, QueryObserver, QueryObserverResult } from '../..'

describe('queryObserver', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    queryClient.mount()
  })

  afterEach(() => {
    queryClient.clear()
  })

  test('should trigger a fetch when subscribed', async () => {
    const key = queryKey()
    const queryFn = jest.fn()
    const observer = new QueryObserver(queryClient, { queryKey: key, queryFn })
    const unsubscribe = observer.subscribe()
    await sleep(1)
    unsubscribe()
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  test('should notify when switching query', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const results: QueryObserverResult[] = []
    const observer = new QueryObserver(queryClient, {
      queryKey: key1,
      queryFn: () => 1,
    })
    const unsubscribe = observer.subscribe(result => {
      results.push(result)
    })
    await sleep(1)
    observer.setOptions({ queryKey: key2, queryFn: () => 2 })
    await sleep(1)
    unsubscribe()
    expect(results.length).toBe(4)
    expect(results[0]).toMatchObject({ data: undefined, status: 'loading' })
    expect(results[1]).toMatchObject({ data: 1, status: 'success' })
    expect(results[2]).toMatchObject({ data: undefined, status: 'loading' })
    expect(results[3]).toMatchObject({ data: 2, status: 'success' })
  })

  test('should be able to fetch with a selector', async () => {
    const key = queryKey()
    const observer = new QueryObserver(queryClient, {
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
    expect(observerResult).toMatchObject({ data: { myCount: 1 } })
  })

  test('should be able to fetch with a selector using the fetch method', async () => {
    const key = queryKey()
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: () => ({ count: 1 }),
      select: data => ({ myCount: data.count }),
    })
    const observerResult = await observer.refetch()
    expectType<{ myCount: number } | undefined>(observerResult.data)
    expect(observerResult.data).toMatchObject({ myCount: 1 })
  })

  test('should be able to fetch with a selector and object syntax', async () => {
    const key = queryKey()
    const observer = new QueryObserver(queryClient, {
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
    expect(observerResult).toMatchObject({ data: { myCount: 1 } })
  })

  test('should run the selector again if the data changed', async () => {
    const key = queryKey()
    let count = 0
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: () => ({ count }),
      select: data => {
        count++
        return { myCount: data.count }
      },
    })
    const observerResult1 = await observer.refetch()
    const observerResult2 = await observer.refetch()
    expect(count).toBe(2)
    expect(observerResult1.data).toMatchObject({ myCount: 0 })
    expect(observerResult2.data).toMatchObject({ myCount: 1 })
  })

  test('should run the selector again if the selector changed', async () => {
    const key = queryKey()
    let count = 0
    const results: QueryObserverResult[] = []
    const queryFn = () => ({ count: 1 })
    const select1 = (data: ReturnType<typeof queryFn>) => {
      count++
      return { myCount: data.count }
    }
    const select2 = (_data: ReturnType<typeof queryFn>) => {
      count++
      return { myCount: 99 }
    }
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn,
      select: select1,
    })
    const unsubscribe = observer.subscribe(result => {
      results.push(result)
    })
    await sleep(1)
    observer.setOptions({
      queryKey: key,
      queryFn,
      select: select2,
    })
    await sleep(1)
    await observer.refetch()
    unsubscribe()
    expect(count).toBe(2)
    expect(results.length).toBe(5)
    expect(results[0]).toMatchObject({
      status: 'loading',
      isFetching: true,
      data: undefined,
    })
    expect(results[1]).toMatchObject({
      status: 'success',
      isFetching: false,
      data: { myCount: 1 },
    })
    expect(results[2]).toMatchObject({
      status: 'success',
      isFetching: false,
      data: { myCount: 99 },
    })
    expect(results[3]).toMatchObject({
      status: 'success',
      isFetching: true,
      data: { myCount: 99 },
    })
    expect(results[4]).toMatchObject({
      status: 'success',
      isFetching: false,
      data: { myCount: 99 },
    })
  })

  test('should not run the selector again if the data and selector did not change', async () => {
    const key = queryKey()
    let count = 0
    const results: QueryObserverResult[] = []
    const queryFn = () => ({ count: 1 })
    const select = (data: ReturnType<typeof queryFn>) => {
      count++
      return { myCount: data.count }
    }
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn,
      select,
    })
    const unsubscribe = observer.subscribe(result => {
      results.push(result)
    })
    await sleep(1)
    observer.setOptions({
      queryKey: key,
      queryFn,
      select,
    })
    await sleep(1)
    await observer.refetch()
    unsubscribe()
    expect(count).toBe(1)
    expect(results.length).toBe(4)
    expect(results[0]).toMatchObject({
      status: 'loading',
      isFetching: true,
      data: undefined,
    })
    expect(results[1]).toMatchObject({
      status: 'success',
      isFetching: false,
      data: { myCount: 1 },
    })
    expect(results[2]).toMatchObject({
      status: 'success',
      isFetching: true,
      data: { myCount: 1 },
    })
    expect(results[3]).toMatchObject({
      status: 'success',
      isFetching: false,
      data: { myCount: 1 },
    })
  })

  test('should not run the selector again if the data did not change', async () => {
    const key = queryKey()
    let count = 0
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: () => ({ count: 1 }),
      select: data => {
        count++
        return { myCount: data.count }
      },
    })
    const observerResult1 = await observer.refetch()
    const observerResult2 = await observer.refetch()
    expect(count).toBe(1)
    expect(observerResult1.data).toMatchObject({ myCount: 1 })
    expect(observerResult2.data).toMatchObject({ myCount: 1 })
  })

  test('should always run the selector again if selector throws an error', async () => {
    const consoleMock = mockConsoleError()
    const key = queryKey()
    const results: QueryObserverResult[] = []
    const select = () => {
      throw new Error('selector error')
    }
    const queryFn = () => ({ count: 1 })
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn,
      select,
    })
    const unsubscribe = observer.subscribe(result => {
      results.push(result)
    })
    await sleep(1)
    await observer.refetch()
    unsubscribe()
    expect(results.length).toBe(5)
    expect(results[0]).toMatchObject({
      status: 'loading',
      isFetching: true,
      data: undefined,
    })
    expect(results[1]).toMatchObject({
      status: 'error',
      isFetching: false,
      data: undefined,
    })
    expect(results[2]).toMatchObject({
      status: 'error',
      isFetching: true,
      data: undefined,
    })
    expect(results[3]).toMatchObject({
      status: 'error',
      isFetching: false,
      data: undefined,
    })
    expect(results[4]).toMatchObject({
      status: 'error',
      isFetching: false,
      data: undefined,
    })
    consoleMock.mockRestore()
  })

  test('should structurally share the selector', async () => {
    const key = queryKey()
    let count = 0
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: () => ({ count: ++count }),
      select: () => ({ myCount: 1 }),
    })
    const observerResult1 = await observer.refetch()
    const observerResult2 = await observer.refetch()
    expect(count).toBe(2)
    expect(observerResult1.data).toBe(observerResult2.data)
  })

  test('should not trigger a fetch when subscribed and disabled', async () => {
    const key = queryKey()
    const queryFn = jest.fn()
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn,
      enabled: false,
    })
    const unsubscribe = observer.subscribe()
    await sleep(1)
    unsubscribe()
    expect(queryFn).toHaveBeenCalledTimes(0)
  })

  test('should not trigger a fetch when not subscribed', async () => {
    const key = queryKey()
    const queryFn = jest.fn()
    new QueryObserver(queryClient, { queryKey: key, queryFn })
    await sleep(1)
    expect(queryFn).toHaveBeenCalledTimes(0)
  })

  test('should be able to watch a query without defining a query function', async () => {
    const key = queryKey()
    const queryFn = jest.fn()
    const callback = jest.fn()
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      enabled: false,
    })
    const unsubscribe = observer.subscribe(callback)
    await queryClient.fetchQuery(key, queryFn)
    unsubscribe()
    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledTimes(2)
  })

  test('should accept unresolved query config in update function', async () => {
    const key = queryKey()
    const queryFn = jest.fn()
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      enabled: false,
    })
    const results: QueryObserverResult<unknown>[] = []
    const unsubscribe = observer.subscribe(x => {
      results.push(x)
    })
    observer.setOptions({ enabled: false, staleTime: 10 })
    await queryClient.fetchQuery(key, queryFn)
    await sleep(100)
    unsubscribe()
    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(results.length).toBe(3)
    expect(results[0]).toMatchObject({ isStale: true })
    expect(results[1]).toMatchObject({ isStale: false })
    expect(results[2]).toMatchObject({ isStale: true })
  })

  test('should be able to handle multiple subscribers', async () => {
    const key = queryKey()
    const queryFn = jest.fn().mockReturnValue('data')
    const observer = new QueryObserver<string>(queryClient, {
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
    await queryClient.fetchQuery(key, queryFn)
    await sleep(50)
    unsubscribe1()
    unsubscribe2()
    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(results1.length).toBe(2)
    expect(results2.length).toBe(2)
    expect(results1[0]).toMatchObject({ data: undefined })
    expect(results1[1]).toMatchObject({ data: 'data' })
    expect(results2[0]).toMatchObject({ data: undefined })
    expect(results2[1]).toMatchObject({ data: 'data' })
  })

  test('should be able to resolve a promise', async () => {
    const key = queryKey()
    const queryFn = jest.fn().mockReturnValue('data')
    const observer = new QueryObserver<string>(queryClient, {
      queryKey: key,
      enabled: false,
    })
    let value
    observer.getNextResult().then(x => {
      value = x
    })
    queryClient.prefetchQuery(key, queryFn)
    await sleep(50)
    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(value).toMatchObject({ data: 'data' })
  })

  test('should be able to resolve a promise with an error', async () => {
    const consoleMock = mockConsoleError()
    const key = queryKey()
    const observer = new QueryObserver<string>(queryClient, {
      queryKey: key,
      enabled: false,
    })
    let error
    observer.getNextResult({ throwOnError: true }).catch(e => {
      error = e
    })
    queryClient.prefetchQuery(key, () => Promise.reject('reject'))
    await sleep(50)
    expect(error).toEqual('reject')
    consoleMock.mockRestore()
  })

  test('should stop retry when unsubscribing', async () => {
    const consoleMock = mockConsoleError()
    const key = queryKey()
    let count = 0
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: () => {
        count++
        return Promise.reject('reject')
      },
      retry: 10,
      retryDelay: 50,
    })
    const unsubscribe = observer.subscribe()
    await sleep(70)
    unsubscribe()
    await sleep(200)
    expect(count).toBe(2)
    consoleMock.mockRestore()
  })

  test('should clear interval when unsubscribing to a refetchInterval query', async () => {
    const key = queryKey()

    const fetchData = () => Promise.resolve('data')
    const observer = new QueryObserver(queryClient, {
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
    expect(queryClient.getQueryCache().find(key)).toBeUndefined()
  })

  test('uses placeholderData as non-cache data when loading a query with no data', async () => {
    const key = queryKey()
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: () => 'data',
      placeholderData: 'placeholder',
    })

    expect(observer.getCurrentResult()).toMatchObject({
      status: 'idle',
      data: undefined,
    })

    const results: QueryObserverResult<unknown>[] = []

    const unsubscribe = observer.subscribe(x => {
      results.push(x)
    })

    await sleep(10)
    unsubscribe()

    expect(results.length).toBe(2)
    expect(results[0]).toMatchObject({ status: 'success', data: 'placeholder' })
    expect(results[1]).toMatchObject({ status: 'success', data: 'data' })
  })
})
