import { sleep, queryKey } from '../../react/tests/utils'
import { QueryClient, QueriesObserver, QueryObserverResult } from '../..'

describe('queriesObserver', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    queryClient.mount()
  })

  afterEach(() => {
    queryClient.clear()
  })

  test('should return an array with all query results', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = jest.fn().mockReturnValue(1)
    const queryFn2 = jest.fn().mockReturnValue(2)
    const observer = new QueriesObserver(queryClient, [
      { queryKey: key1, queryFn: queryFn1 },
      { queryKey: key2, queryFn: queryFn2 },
    ])
    let observerResult
    const unsubscribe = observer.subscribe(result => {
      observerResult = result
    })
    await sleep(1)
    unsubscribe()
    expect(observerResult).toMatchObject([{ data: 1 }, { data: 2 }])
  })

  test('should update when a query updates', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = jest.fn().mockReturnValue(1)
    const queryFn2 = jest.fn().mockReturnValue(2)
    const observer = new QueriesObserver(queryClient, [
      { queryKey: key1, queryFn: queryFn1 },
      { queryKey: key2, queryFn: queryFn2 },
    ])
    const results: QueryObserverResult[][] = []
    results.push(observer.getCurrentResult())
    const unsubscribe = observer.subscribe(result => {
      results.push(result)
    })
    await sleep(1)
    queryClient.setQueryData(key2, 3)
    await sleep(1)
    unsubscribe()
    expect(results.length).toBe(6)
    expect(results[0]).toMatchObject([
      { status: 'idle', data: undefined },
      { status: 'idle', data: undefined },
    ])
    expect(results[1]).toMatchObject([
      { status: 'loading', data: undefined },
      { status: 'idle', data: undefined },
    ])
    expect(results[2]).toMatchObject([
      { status: 'loading', data: undefined },
      { status: 'loading', data: undefined },
    ])
    expect(results[3]).toMatchObject([
      { status: 'success', data: 1 },
      { status: 'loading', data: undefined },
    ])
    expect(results[4]).toMatchObject([
      { status: 'success', data: 1 },
      { status: 'success', data: 2 },
    ])
    expect(results[5]).toMatchObject([
      { status: 'success', data: 1 },
      { status: 'success', data: 3 },
    ])
  })

  test('should update when a query is removed', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = jest.fn().mockReturnValue(1)
    const queryFn2 = jest.fn().mockReturnValue(2)
    const observer = new QueriesObserver(queryClient, [
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
    const queryCache = queryClient.getQueryCache()
    expect(queryCache.find(key1, { active: true })).toBeUndefined()
    expect(queryCache.find(key2, { active: true })).toBeDefined()
    unsubscribe()
    expect(queryCache.find(key1, { active: true })).toBeUndefined()
    expect(queryCache.find(key2, { active: true })).toBeUndefined()
    expect(results.length).toBe(6)
    expect(results[0]).toMatchObject([
      { status: 'idle', data: undefined },
      { status: 'idle', data: undefined },
    ])
    expect(results[1]).toMatchObject([
      { status: 'loading', data: undefined },
      { status: 'idle', data: undefined },
    ])
    expect(results[2]).toMatchObject([
      { status: 'loading', data: undefined },
      { status: 'loading', data: undefined },
    ])
    expect(results[3]).toMatchObject([
      { status: 'success', data: 1 },
      { status: 'loading', data: undefined },
    ])
    expect(results[4]).toMatchObject([
      { status: 'success', data: 1 },
      { status: 'success', data: 2 },
    ])
    expect(results[5]).toMatchObject([{ status: 'success', data: 2 }])
  })

  test('should update when a query changed position', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = jest.fn().mockReturnValue(1)
    const queryFn2 = jest.fn().mockReturnValue(2)
    const observer = new QueriesObserver(queryClient, [
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
    expect(results.length).toBe(6)
    expect(results[0]).toMatchObject([
      { status: 'idle', data: undefined },
      { status: 'idle', data: undefined },
    ])
    expect(results[1]).toMatchObject([
      { status: 'loading', data: undefined },
      { status: 'idle', data: undefined },
    ])
    expect(results[2]).toMatchObject([
      { status: 'loading', data: undefined },
      { status: 'loading', data: undefined },
    ])
    expect(results[3]).toMatchObject([
      { status: 'success', data: 1 },
      { status: 'loading', data: undefined },
    ])
    expect(results[4]).toMatchObject([
      { status: 'success', data: 1 },
      { status: 'success', data: 2 },
    ])
    expect(results[5]).toMatchObject([
      { status: 'success', data: 2 },
      { status: 'success', data: 1 },
    ])
  })

  test('should not update when nothing has changed', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = jest.fn().mockReturnValue(1)
    const queryFn2 = jest.fn().mockReturnValue(2)
    const observer = new QueriesObserver(queryClient, [
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
    expect(results.length).toBe(5)
    expect(results[0]).toMatchObject([
      { status: 'idle', data: undefined },
      { status: 'idle', data: undefined },
    ])
    expect(results[1]).toMatchObject([
      { status: 'loading', data: undefined },
      { status: 'idle', data: undefined },
    ])
    expect(results[2]).toMatchObject([
      { status: 'loading', data: undefined },
      { status: 'loading', data: undefined },
    ])
    expect(results[3]).toMatchObject([
      { status: 'success', data: 1 },
      { status: 'loading', data: undefined },
    ])
    expect(results[4]).toMatchObject([
      { status: 'success', data: 1 },
      { status: 'success', data: 2 },
    ])
  })

  test('should trigger all fetches when subscribed', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = jest.fn()
    const queryFn2 = jest.fn()
    const observer = new QueriesObserver(queryClient, [
      { queryKey: key1, queryFn: queryFn1 },
      { queryKey: key2, queryFn: queryFn2 },
    ])
    const unsubscribe = observer.subscribe()
    await sleep(1)
    unsubscribe()
    expect(queryFn1).toHaveBeenCalledTimes(1)
    expect(queryFn2).toHaveBeenCalledTimes(1)
  })
})
