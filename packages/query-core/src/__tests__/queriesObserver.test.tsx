import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { QueriesObserver, QueryClient, QueryObserver } from '..'
import type { QueryObserverResult } from '..'

describe('queriesObserver', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
    queryClient.mount()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  test('should return an array with all query results', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = vi.fn().mockReturnValue(1)
    const queryFn2 = vi.fn().mockReturnValue(2)
    const observer = new QueriesObserver(queryClient, [
      { queryKey: key1, queryFn: queryFn1 },
      { queryKey: key2, queryFn: queryFn2 },
    ])
    let observerResult
    const unsubscribe = observer.subscribe((result) => {
      observerResult = result
    })

    await vi.advanceTimersByTimeAsync(0)

    unsubscribe()

    expect(observerResult).toMatchObject([{ data: 1 }, { data: 2 }])
  })

  test('should update when a query updates', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = vi.fn().mockReturnValue(1)
    const queryFn2 = vi.fn().mockReturnValue(2)
    const observer = new QueriesObserver(queryClient, [
      { queryKey: key1, queryFn: queryFn1 },
      { queryKey: key2, queryFn: queryFn2 },
    ])
    const results: Array<Array<QueryObserverResult>> = []
    results.push(observer.getCurrentResult())
    const unsubscribe = observer.subscribe((result) => {
      results.push(result)
    })

    await vi.advanceTimersByTimeAsync(0)
    queryClient.setQueryData(key2, 3)
    unsubscribe()

    expect(results.length).toBe(6)
    expect(results[0]).toMatchObject([
      { status: 'pending', fetchStatus: 'idle', data: undefined },
      { status: 'pending', fetchStatus: 'idle', data: undefined },
    ])
    expect(results[1]).toMatchObject([
      { status: 'pending', fetchStatus: 'fetching', data: undefined },
      { status: 'pending', fetchStatus: 'idle', data: undefined },
    ])
    expect(results[2]).toMatchObject([
      { status: 'pending', fetchStatus: 'fetching', data: undefined },
      { status: 'pending', fetchStatus: 'fetching', data: undefined },
    ])
    expect(results[3]).toMatchObject([
      { status: 'success', data: 1 },
      { status: 'pending', fetchStatus: 'fetching', data: undefined },
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
    const queryFn1 = vi.fn().mockReturnValue(1)
    const queryFn2 = vi.fn().mockReturnValue(2)
    const observer = new QueriesObserver(queryClient, [
      { queryKey: key1, queryFn: queryFn1 },
      { queryKey: key2, queryFn: queryFn2 },
    ])
    const results: Array<Array<QueryObserverResult>> = []
    results.push(observer.getCurrentResult())
    const unsubscribe = observer.subscribe((result) => {
      results.push(result)
    })

    await vi.advanceTimersByTimeAsync(0)
    observer.setQueries([{ queryKey: key2, queryFn: queryFn2 }])

    const queryCache = queryClient.getQueryCache()

    expect(queryCache.find({ queryKey: key1, type: 'active' })).toBeUndefined()
    expect(queryCache.find({ queryKey: key2, type: 'active' })).toBeDefined()
    unsubscribe()
    expect(queryCache.find({ queryKey: key1, type: 'active' })).toBeUndefined()
    expect(queryCache.find({ queryKey: key2, type: 'active' })).toBeUndefined()
    expect(results.length).toBe(6)
    expect(results[0]).toMatchObject([
      { status: 'pending', fetchStatus: 'idle', data: undefined },
      { status: 'pending', fetchStatus: 'idle', data: undefined },
    ])
    expect(results[1]).toMatchObject([
      { status: 'pending', fetchStatus: 'fetching', data: undefined },
      { status: 'pending', fetchStatus: 'idle', data: undefined },
    ])
    expect(results[2]).toMatchObject([
      { status: 'pending', fetchStatus: 'fetching', data: undefined },
      { status: 'pending', fetchStatus: 'fetching', data: undefined },
    ])
    expect(results[3]).toMatchObject([
      { status: 'success', data: 1 },
      { status: 'pending', fetchStatus: 'fetching', data: undefined },
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
    const queryFn1 = vi.fn().mockReturnValue(1)
    const queryFn2 = vi.fn().mockReturnValue(2)
    const observer = new QueriesObserver(queryClient, [
      { queryKey: key1, queryFn: queryFn1 },
      { queryKey: key2, queryFn: queryFn2 },
    ])
    const results: Array<Array<QueryObserverResult>> = []
    results.push(observer.getCurrentResult())
    const unsubscribe = observer.subscribe((result) => {
      results.push(result)
    })

    await vi.advanceTimersByTimeAsync(0)
    observer.setQueries([
      { queryKey: key2, queryFn: queryFn2 },
      { queryKey: key1, queryFn: queryFn1 },
    ])

    unsubscribe()

    expect(results.length).toBe(6)
    expect(results[0]).toMatchObject([
      { status: 'pending', fetchStatus: 'idle', data: undefined },
      { status: 'pending', fetchStatus: 'idle', data: undefined },
    ])
    expect(results[1]).toMatchObject([
      { status: 'pending', fetchStatus: 'fetching', data: undefined },
      { status: 'pending', fetchStatus: 'idle', data: undefined },
    ])
    expect(results[2]).toMatchObject([
      { status: 'pending', fetchStatus: 'fetching', data: undefined },
      { status: 'pending', fetchStatus: 'fetching', data: undefined },
    ])
    expect(results[3]).toMatchObject([
      { status: 'success', data: 1 },
      { status: 'pending', fetchStatus: 'fetching', data: undefined },
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
    const queryFn1 = vi.fn().mockReturnValue(1)
    const queryFn2 = vi.fn().mockReturnValue(2)
    const observer = new QueriesObserver(queryClient, [
      { queryKey: key1, queryFn: queryFn1 },
      { queryKey: key2, queryFn: queryFn2 },
    ])
    const results: Array<Array<QueryObserverResult>> = []
    results.push(observer.getCurrentResult())
    const unsubscribe = observer.subscribe((result) => {
      results.push(result)
    })

    await vi.advanceTimersByTimeAsync(0)
    observer.setQueries([
      { queryKey: key1, queryFn: queryFn1 },
      { queryKey: key2, queryFn: queryFn2 },
    ])

    unsubscribe()

    expect(results.length).toBe(5)
    expect(results[0]).toMatchObject([
      { status: 'pending', fetchStatus: 'idle', data: undefined },
      { status: 'pending', fetchStatus: 'idle', data: undefined },
    ])
    expect(results[1]).toMatchObject([
      { status: 'pending', fetchStatus: 'fetching', data: undefined },
      { status: 'pending', fetchStatus: 'idle', data: undefined },
    ])
    expect(results[2]).toMatchObject([
      { status: 'pending', fetchStatus: 'fetching', data: undefined },
      { status: 'pending', fetchStatus: 'fetching', data: undefined },
    ])
    expect(results[3]).toMatchObject([
      { status: 'success', data: 1 },
      { status: 'pending', fetchStatus: 'fetching', data: undefined },
    ])
    expect(results[4]).toMatchObject([
      { status: 'success', data: 1 },
      { status: 'success', data: 2 },
    ])
  })

  test('should trigger all fetches when subscribed', () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = vi.fn().mockReturnValue(1)
    const queryFn2 = vi.fn().mockReturnValue(2)
    const observer = new QueriesObserver(queryClient, [
      { queryKey: key1, queryFn: queryFn1 },
      { queryKey: key2, queryFn: queryFn2 },
    ])

    const unsubscribe = observer.subscribe(() => undefined)

    unsubscribe()

    expect(queryFn1).toHaveBeenCalledTimes(1)
    expect(queryFn2).toHaveBeenCalledTimes(1)
  })

  test('should not destroy the observer if there is still a subscription', async () => {
    const key1 = queryKey()
    const observer = new QueriesObserver(queryClient, [
      {
        queryKey: key1,
        queryFn: async () => {
          await sleep(20)
          return 1
        },
      },
    ])

    const subscription1Handler = vi.fn()
    const subscription2Handler = vi.fn()

    const unsubscribe1 = observer.subscribe(subscription1Handler)
    const unsubscribe2 = observer.subscribe(subscription2Handler)

    unsubscribe1()

    await vi.advanceTimersByTimeAsync(20)

    // 1 call: pending
    expect(subscription1Handler).toBeCalledTimes(1)
    // 1 call: success
    expect(subscription2Handler).toBeCalledTimes(1)

    // Clean-up
    unsubscribe2()
  })

  test('should handle duplicate query keys in different positions', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = vi.fn().mockReturnValue(1)
    const queryFn2 = vi.fn().mockReturnValue(2)

    const observer = new QueriesObserver(queryClient, [
      { queryKey: key1, queryFn: queryFn1 },
      { queryKey: key2, queryFn: queryFn2 },
      { queryKey: key1, queryFn: queryFn1 },
    ])

    const results: Array<Array<QueryObserverResult>> = []

    results.push(
      observer.getOptimisticResult(
        [
          { queryKey: key1, queryFn: queryFn1 },
          { queryKey: key2, queryFn: queryFn2 },
          { queryKey: key1, queryFn: queryFn1 },
        ],
        undefined,
      )[0],
    )

    const unsubscribe = observer.subscribe((result) => {
      results.push(result)
    })

    await vi.advanceTimersByTimeAsync(0)

    unsubscribe()

    expect(results.length).toBe(6)
    expect(results[0]).toMatchObject([
      { status: 'pending', fetchStatus: 'idle', data: undefined },
      { status: 'pending', fetchStatus: 'idle', data: undefined },
      { status: 'pending', fetchStatus: 'idle', data: undefined },
    ])
    expect(results[1]).toMatchObject([
      { status: 'pending', fetchStatus: 'fetching', data: undefined },
      { status: 'pending', fetchStatus: 'idle', data: undefined },
      { status: 'pending', fetchStatus: 'idle', data: undefined },
    ])
    expect(results[2]).toMatchObject([
      { status: 'pending', fetchStatus: 'fetching', data: undefined },
      { status: 'pending', fetchStatus: 'fetching', data: undefined },
      { status: 'pending', fetchStatus: 'idle', data: undefined },
    ])
    expect(results[3]).toMatchObject([
      { status: 'success', fetchStatus: 'idle', data: 1 },
      { status: 'pending', fetchStatus: 'fetching', data: undefined },
      { status: 'pending', fetchStatus: 'idle', data: undefined },
    ])
    expect(results[4]).toMatchObject([
      { status: 'success', fetchStatus: 'idle', data: 1 },
      { status: 'pending', fetchStatus: 'fetching', data: undefined },
      { status: 'success', fetchStatus: 'idle', data: 1 },
    ])
    expect(results[5]).toMatchObject([
      { status: 'success', fetchStatus: 'idle', data: 1 },
      { status: 'success', fetchStatus: 'idle', data: 2 },
      { status: 'success', fetchStatus: 'idle', data: 1 },
    ])

    // Verify that queryFn1 was only called once despite being used twice
    expect(queryFn1).toHaveBeenCalledTimes(1)
    expect(queryFn2).toHaveBeenCalledTimes(1)
  })

  test('should notify when results change during early return', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = vi.fn().mockReturnValue(1)
    const queryFn2 = vi.fn().mockReturnValue(2)

    queryClient.setQueryData(key1, 1)
    queryClient.setQueryData(key2, 2)

    const observer = new QueriesObserver(queryClient, [
      { queryKey: key1, queryFn: queryFn1 },
      { queryKey: key2, queryFn: queryFn2 },
    ])

    const results: Array<Array<QueryObserverResult>> = []
    results.push(observer.getCurrentResult())

    const onUpdate = vi.fn((result: Array<QueryObserverResult>) => {
      results.push(result)
    })
    const unsubscribe = observer.subscribe(onUpdate)
    const baseline = results.length

    observer.setQueries([
      {
        queryKey: key1,
        queryFn: queryFn1,
        select: (d: any) => d + 100,
      },
      {
        queryKey: key2,
        queryFn: queryFn2,
        select: (d: any) => d + 100,
      },
    ])

    await vi.advanceTimersByTimeAsync(0)

    unsubscribe()

    expect(results.length).toBeGreaterThan(baseline)
    expect(results[results.length - 1]).toMatchObject([
      { status: 'success', data: 101 },
      { status: 'success', data: 102 },
    ])
  })

  test('should update combined result when queries are added with stable combine reference', () => {
    const combine = vi.fn((results: Array<QueryObserverResult>) => ({
      count: results.length,
      results,
    }))

    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = vi.fn().mockReturnValue(1)
    const queryFn2 = vi.fn().mockReturnValue(2)

    const observer = new QueriesObserver<{
      count: number
      results: Array<QueryObserverResult>
    }>(queryClient, [{ queryKey: key1, queryFn: queryFn1 }], { combine })

    const [initialRaw, getInitialCombined] = observer.getOptimisticResult(
      [{ queryKey: key1, queryFn: queryFn1 }],
      combine,
    )
    const initialCombined = getInitialCombined(initialRaw)

    expect(initialCombined.count).toBe(1)

    const newQueries = [
      { queryKey: key1, queryFn: queryFn1 },
      { queryKey: key2, queryFn: queryFn2 },
    ]
    const [newRaw, getNewCombined] = observer.getOptimisticResult(
      newQueries,
      combine,
    )
    const newCombined = getNewCombined(newRaw)

    expect(newCombined.count).toBe(2)
  })

  test('should handle queries being removed with stable combine reference', () => {
    const combine = vi.fn((results: Array<QueryObserverResult>) => ({
      count: results.length,
      results,
    }))

    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = vi.fn().mockReturnValue(1)
    const queryFn2 = vi.fn().mockReturnValue(2)

    const observer = new QueriesObserver<{
      count: number
      results: Array<QueryObserverResult>
    }>(
      queryClient,
      [
        { queryKey: key1, queryFn: queryFn1 },
        { queryKey: key2, queryFn: queryFn2 },
      ],
      { combine },
    )

    const [initialRaw, getInitialCombined] = observer.getOptimisticResult(
      [
        { queryKey: key1, queryFn: queryFn1 },
        { queryKey: key2, queryFn: queryFn2 },
      ],
      combine,
    )
    const initialCombined = getInitialCombined(initialRaw)

    expect(initialCombined.count).toBe(2)

    const newQueries = [{ queryKey: key1, queryFn: queryFn1 }]
    const [newRaw, getNewCombined] = observer.getOptimisticResult(
      newQueries,
      combine,
    )
    const newCombined = getNewCombined(newRaw)

    expect(newCombined.count).toBe(1)
  })

  test('should update combined result when queries are replaced with different ones (same length)', () => {
    const combine = vi.fn((results: Array<QueryObserverResult>) => ({
      keys: results.map((r) => r.status),
      results,
    }))

    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = vi.fn().mockReturnValue(1)
    const queryFn2 = vi.fn().mockReturnValue(2)

    queryClient.setQueryData(key1, 'cached-1')

    const observer = new QueriesObserver<{
      keys: Array<string>
      results: Array<QueryObserverResult>
    }>(queryClient, [{ queryKey: key1, queryFn: queryFn1 }], { combine })

    const [initialRaw, getInitialCombined] = observer.getOptimisticResult(
      [{ queryKey: key1, queryFn: queryFn1 }],
      combine,
    )
    const initialCombined = getInitialCombined(initialRaw)

    expect(initialCombined.keys).toEqual(['success'])

    const [newRaw, getNewCombined] = observer.getOptimisticResult(
      [{ queryKey: key2, queryFn: queryFn2 }],
      combine,
    )
    const newCombined = getNewCombined(newRaw)

    expect(newCombined.keys).toEqual(['pending'])
  })

  test('should track properties on all observers when trackResult is called', () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = () => 'data1'
    const queryFn2 = () => 'data2'

    const observer = new QueriesObserver(queryClient, [
      { queryKey: key1, queryFn: queryFn1 },
      { queryKey: key2, queryFn: queryFn2 },
    ])

    const trackPropSpy = vi.spyOn(QueryObserver.prototype, 'trackProp')

    const [, getCombinedResult, trackResult] = observer.getOptimisticResult(
      [
        { queryKey: key1, queryFn: queryFn1 },
        { queryKey: key2, queryFn: queryFn2 },
      ],
      undefined,
    )

    const trackedResults = trackResult()
    const combinedResult = getCombinedResult(trackedResults)

    expect(combinedResult).toHaveLength(2)

    // Accessing a property on the first result should trigger trackProp on all observers
    void trackedResults[0]!.status

    // 1 direct call from the accessed observer's proxy +
    // 2 synchronized calls from onPropTracked callback (one per observer)
    expect(trackPropSpy).toHaveBeenCalledWith('status')
    expect(trackPropSpy).toHaveBeenCalledTimes(3)

    trackPropSpy.mockRestore()
  })
})
