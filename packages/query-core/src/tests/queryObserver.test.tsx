import {
  sleep,
  queryKey,
  expectType,
  mockLogger,
  createQueryClient,
} from './utils'
import type { QueryClient, QueryObserverResult } from '..'
import { QueryObserver, focusManager } from '..'

describe('queryObserver', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createQueryClient()
    queryClient.mount()
  })

  afterEach(() => {
    queryClient.clear()
  })

  test('should trigger a fetch when subscribed', async () => {
    const key = queryKey()
    const queryFn = jest.fn<string, unknown[]>().mockReturnValue('data')
    const observer = new QueryObserver(queryClient, { queryKey: key, queryFn })
    const unsubscribe = observer.subscribe(() => undefined)
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
    const unsubscribe = observer.subscribe((result) => {
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
      select: (data) => ({ myCount: data.count }),
    })
    let observerResult
    const unsubscribe = observer.subscribe((result) => {
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
      select: (data) => ({ myCount: data.count }),
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
      select: (data) => ({ myCount: data.count }),
    })
    let observerResult
    const unsubscribe = observer.subscribe((result) => {
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
      select: (data) => {
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
    const unsubscribe = observer.subscribe((result) => {
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
    const unsubscribe = observer.subscribe((result) => {
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
      select: (data) => {
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

  test('should always run the selector again if selector throws an error and selector is not referentially stable', async () => {
    const key = queryKey()
    const results: QueryObserverResult[] = []
    const queryFn = async () => {
      await sleep(10)
      return { count: 1 }
    }
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn,
      select: () => {
        throw new Error('selector error')
      },
    })
    const unsubscribe = observer.subscribe((result) => {
      results.push(result)
    })
    await sleep(50)
    await observer.refetch()
    unsubscribe()
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
  })

  test('should return stale data if selector throws an error', async () => {
    const key = queryKey()
    const results: QueryObserverResult[] = []
    let shouldError = false
    const error = new Error('select error')
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      retry: 0,
      queryFn: async () => {
        await sleep(10)
        return shouldError ? 2 : 1
      },
      select: (num) => {
        if (shouldError) {
          throw error
        }
        shouldError = true
        return String(num)
      },
    })

    const unsubscribe = observer.subscribe((result) => {
      results.push(result)
    })
    await sleep(50)
    await observer.refetch()
    unsubscribe()

    expect(results[0]).toMatchObject({
      status: 'loading',
      isFetching: true,
      data: undefined,
      error: null,
    })
    expect(results[1]).toMatchObject({
      status: 'success',
      isFetching: false,
      data: '1',
      error: null,
    })
    expect(results[2]).toMatchObject({
      status: 'success',
      isFetching: true,
      data: '1',
      error: null,
    })
    expect(results[3]).toMatchObject({
      status: 'error',
      isFetching: false,
      data: '1',
      error,
    })
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
    const queryFn = jest.fn<string, unknown[]>().mockReturnValue('data')
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn,
      enabled: false,
    })
    const unsubscribe = observer.subscribe(() => undefined)
    await sleep(1)
    unsubscribe()
    expect(queryFn).toHaveBeenCalledTimes(0)
  })

  test('should not trigger a fetch when not subscribed', async () => {
    const key = queryKey()
    const queryFn = jest.fn<string, unknown[]>().mockReturnValue('data')
    new QueryObserver(queryClient, { queryKey: key, queryFn })
    await sleep(1)
    expect(queryFn).toHaveBeenCalledTimes(0)
  })

  test('should be able to watch a query without defining a query function', async () => {
    const key = queryKey()
    const queryFn = jest.fn<string, unknown[]>().mockReturnValue('data')
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
    const queryFn = jest.fn<string, unknown[]>().mockReturnValue('data')
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      enabled: false,
    })
    const results: QueryObserverResult<unknown>[] = []
    const unsubscribe = observer.subscribe((x) => {
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
    const queryFn = jest.fn<string, unknown[]>().mockReturnValue('data')
    const observer = new QueryObserver<string>(queryClient, {
      queryKey: key,
      enabled: false,
    })
    const results1: QueryObserverResult<string>[] = []
    const results2: QueryObserverResult<string>[] = []
    const unsubscribe1 = observer.subscribe((x) => {
      results1.push(x)
    })
    const unsubscribe2 = observer.subscribe((x) => {
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

  test('should stop retry when unsubscribing', async () => {
    const key = queryKey()
    let count = 0
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: () => {
        count++
        return Promise.reject<unknown>('reject')
      },
      retry: 10,
      retryDelay: 50,
    })
    const unsubscribe = observer.subscribe(() => undefined)
    await sleep(70)
    unsubscribe()
    await sleep(200)
    expect(count).toBe(2)
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
    const unsubscribe = observer.subscribe(() => undefined)
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
      status: 'success',
      data: 'placeholder',
    })

    const results: QueryObserverResult<unknown>[] = []

    const unsubscribe = observer.subscribe((x) => {
      results.push(x)
    })

    await sleep(10)
    unsubscribe()

    expect(results.length).toBe(2)
    expect(results[0]).toMatchObject({ status: 'success', data: 'placeholder' })
    expect(results[1]).toMatchObject({ status: 'success', data: 'data' })
  })

  test('should structurally share placeholder data', async () => {
    const key = queryKey()
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      enabled: false,
      queryFn: () => 'data',
      placeholderData: {},
    })

    const firstData = observer.getCurrentResult().data

    observer.setOptions({ placeholderData: {} })

    const secondData = observer.getCurrentResult().data

    expect(firstData).toBe(secondData)
  })

  test('the retrier should not throw an error when reject if the retrier is already resolved', async () => {
    const key = queryKey()
    let count = 0

    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: () => {
        count++
        return Promise.reject<unknown>(`reject ${count}`)
      },
      retry: 1,
      retryDelay: 20,
    })

    const unsubscribe = observer.subscribe(() => undefined)

    // Simulate a race condition when an unsubscribe and a retry occur.
    await sleep(20)
    unsubscribe()

    // A second reject is triggered for the retry
    // but the retryer has already set isResolved to true
    // so it does nothing and no error is thrown

    // Should not log an error
    queryClient.clear()
    await sleep(40)
    expect(mockLogger.error).not.toHaveBeenNthCalledWith(1, 'reject 1')
  })

  test('should throw an error if enabled option type is not valid', async () => {
    const key = queryKey()

    expect(
      () =>
        new QueryObserver(queryClient, {
          queryKey: key,
          queryFn: () => 'data',
          //@ts-expect-error
          enabled: null,
        }),
    ).toThrowError('Expected enabled to be a boolean')
  })

  test('getCurrentQuery should return the current query', async () => {
    const key = queryKey()

    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: () => 'data',
    })

    expect(observer.getCurrentQuery().queryKey).toEqual(key)
  })

  test('should throw an error if throwOnError option is true', async () => {
    const key = queryKey()

    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: () => Promise.reject<unknown>('error'),
      retry: false,
    })

    let error: string | null = null
    try {
      await observer.refetch({ throwOnError: true })
    } catch (err) {
      error = err as string
    }

    expect(error).toEqual('error')
  })

  test('should not refetch in background if refetchIntervalInBackground is false', async () => {
    const key = queryKey()
    const queryFn = jest.fn<string, unknown[]>().mockReturnValue('data')

    focusManager.setFocused(false)
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn,
      refetchIntervalInBackground: false,
      refetchInterval: 10,
    })

    const unsubscribe = observer.subscribe(() => undefined)
    await sleep(30)

    expect(queryFn).toHaveBeenCalledTimes(1)

    // Clean-up
    unsubscribe()
    focusManager.setFocused(true)
  })

  test('should not use replaceEqualDeep for select value when structuralSharing option is true', async () => {
    const key = queryKey()

    const data = { value: 'data' }
    const selectedData = { value: 'data' }

    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: () => data,
      select: () => data,
    })

    const unsubscribe = observer.subscribe(() => undefined)

    await sleep(10)
    expect(observer.getCurrentResult().data).toBe(data)

    observer.setOptions({
      queryKey: key,
      queryFn: () => data,
      structuralSharing: false,
      select: () => selectedData,
    })

    await observer.refetch()
    expect(observer.getCurrentResult().data).toBe(selectedData)

    unsubscribe()
  })

  test('should prefer isDataEqual to structuralSharing', async () => {
    const key = queryKey()

    const data = { value: 'data' }
    const newData = { value: 'data' }

    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: () => data,
    })

    const unsubscribe = observer.subscribe(() => undefined)

    await sleep(10)
    expect(observer.getCurrentResult().data).toBe(data)

    observer.setOptions({
      queryKey: key,
      queryFn: () => newData,
      isDataEqual: () => true,
      structuralSharing: false,
    })

    await observer.refetch()
    expect(observer.getCurrentResult().data).toBe(data)

    unsubscribe()
  })

  test('select function error using placeholderdata should log an error', () => {
    const key = queryKey()

    new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: () => 'data',
      placeholderData: 'placeholderdata',
      select: () => {
        throw new Error('error')
      },
    })

    expect(mockLogger.error).toHaveBeenNthCalledWith(2, new Error('error'))
  })

  test('should not use replaceEqualDeep for select value when structuralSharing option is true and placeholderdata is defined', () => {
    const key = queryKey()

    const data = { value: 'data' }
    const selectedData1 = { value: 'data' }
    const selectedData2 = { value: 'data' }
    const placeholderData1 = { value: 'data' }
    const placeholderData2 = { value: 'data' }

    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: () => data,
      select: () => data,
    })

    observer.setOptions({
      queryKey: key,
      queryFn: () => data,
      select: () => {
        return selectedData1
      },
      placeholderData: placeholderData1,
    })

    observer.setOptions({
      queryKey: key,
      queryFn: () => data,
      select: () => {
        return selectedData2
      },
      placeholderData: placeholderData2,
      structuralSharing: false,
    })

    expect(observer.getCurrentResult().data).toBe(selectedData2)
  })

  test('should not use an undefined value returned by select as placeholderdata', () => {
    const key = queryKey()

    const data = { value: 'data' }
    const selectedData = { value: 'data' }
    const placeholderData1 = { value: 'data' }
    const placeholderData2 = { value: 'data' }

    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: () => data,
      select: () => data,
    })

    observer.setOptions({
      queryKey: key,
      queryFn: () => data,
      select: () => {
        return selectedData
      },
      placeholderData: placeholderData1,
    })

    expect(observer.getCurrentResult().isPlaceholderData).toBe(true)

    observer.setOptions({
      queryKey: key,
      queryFn: () => data,
      //@ts-expect-error
      select: () => undefined,
      placeholderData: placeholderData2,
    })

    expect(observer.getCurrentResult().isPlaceholderData).toBe(false)
  })

  test('updateResult should not notify cache listeners if cache option is false', async () => {
    const key = queryKey()

    const data1 = { value: 'data 1' }
    const data2 = { value: 'data 2' }

    await queryClient.prefetchQuery(key, () => data1)
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
    })
    await queryClient.prefetchQuery(key, () => data2)

    const spy = jest.fn()
    const unsubscribe = queryClient.getQueryCache().subscribe(spy)
    observer.updateResult({ cache: false })

    expect(spy).toHaveBeenCalledTimes(0)

    unsubscribe()
  })

  test('should not notify observer when the stale timeout expires and the current result is stale', async () => {
    const key = queryKey()
    const queryFn = () => 'data'

    await queryClient.prefetchQuery(key, queryFn)
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn,
      staleTime: 20,
    })

    const spy = jest.fn()
    const unsubscribe = observer.subscribe(spy)
    await queryClient.refetchQueries(key)
    await sleep(10)

    // Force isStale to true
    // because no use case has been found to reproduce this condition
    // @ts-ignore
    observer['currentResult'].isStale = true
    spy.mockReset()
    await sleep(30)
    expect(spy).not.toHaveBeenCalled()

    unsubscribe()
  })

  test('setOptions should notify cache listeners', async () => {
    const key = queryKey()

    const observer = new QueryObserver(queryClient, {
      queryKey: key,
    })

    const spy = jest.fn()
    const unsubscribe = queryClient.getQueryCache().subscribe(spy)
    observer.setOptions({ enabled: false })

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'observerOptionsUpdated' }),
    )

    unsubscribe()
  })
})
