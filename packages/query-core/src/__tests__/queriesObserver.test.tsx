import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

  it('should return an array with all query results', async () => {
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

  it('should return current queries via getQueries', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = vi.fn().mockReturnValue(1)
    const queryFn2 = vi.fn().mockReturnValue(2)
    const observer = new QueriesObserver(queryClient, [
      { queryKey: key1, queryFn: queryFn1 },
      { queryKey: key2, queryFn: queryFn2 },
    ])
    const unsubscribe = observer.subscribe(() => undefined)

    await vi.advanceTimersByTimeAsync(0)

    const queries = observer.getQueries()

    expect(queries).toHaveLength(2)
    expect(queries[0]?.queryKey).toEqual(key1)
    expect(queries[1]?.queryKey).toEqual(key2)

    unsubscribe()
  })

  it('should update when a query updates', async () => {
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

  it('should return current observers via getObservers', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = vi.fn().mockReturnValue(1)
    const queryFn2 = vi.fn().mockReturnValue(2)
    const observer = new QueriesObserver(queryClient, [
      { queryKey: key1, queryFn: queryFn1 },
      { queryKey: key2, queryFn: queryFn2 },
    ])
    const unsubscribe = observer.subscribe(() => undefined)

    await vi.advanceTimersByTimeAsync(0)

    const observers = observer.getObservers()

    expect(observers).toHaveLength(2)
    expect(observers[0]).toBeInstanceOf(QueryObserver)
    expect(observers[1]).toBeInstanceOf(QueryObserver)

    unsubscribe()
  })

  it('should update when a query is removed', async () => {
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

  it('should update when a query changed position', async () => {
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

  it('should not update when nothing has changed', async () => {
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

  it('should trigger all fetches when subscribed', () => {
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

  it('should not destroy the observer if there is still a subscription', async () => {
    const key1 = queryKey()
    const observer = new QueriesObserver(queryClient, [
      {
        queryKey: key1,
        queryFn: () => sleep(20).then(() => 1),
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

  it('should handle duplicate query keys in different positions', async () => {
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

  it('should notify when results change during early return', async () => {
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

  it('should update combined result when queries are added with stable combine reference', () => {
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

  it('should skip combine notifications while suspense queries have no data', async () => {
    const key = queryKey()
    const combine = vi.fn((results: Array<QueryObserverResult>) =>
      results.map((result) => result.data),
    )
    const query = {
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'data'),
      staleTime: Infinity,
      suspense: true,
    }

    queryClient.setQueryData(key, 'data')

    const observer = new QueriesObserver<Array<unknown>>(queryClient, [query], {
      combine,
    })

    const [rawResult, getCombinedResult] = observer.getOptimisticResult(
      [query],
      combine,
    )
    expect(getCombinedResult(rawResult)).toEqual(['data'])
    expect(combine).toHaveBeenCalledTimes(1)

    const unsubscribe = observer.subscribe(() => undefined)

    void queryClient.resetQueries({ queryKey: key })
    expect(combine).toHaveBeenCalledTimes(1)

    unsubscribe()
  })

  it('should skip combine notifications after suspense is enabled without structural changes', async () => {
    const key = queryKey()
    const combine = vi.fn((results: Array<QueryObserverResult>) =>
      results.map((result) => result.data),
    )
    const query = {
      queryKey: key,
      queryFn: () => sleep(10).then(() => 'data'),
      staleTime: Infinity,
      suspense: false,
    }

    queryClient.setQueryData(key, 'data')

    const observer = new QueriesObserver<Array<unknown>>(queryClient, [query], {
      combine,
    })

    const [rawResult, getCombinedResult] = observer.getOptimisticResult(
      [query],
      combine,
    )
    expect(getCombinedResult(rawResult)).toEqual(['data'])
    expect(combine).toHaveBeenCalledTimes(1)

    const unsubscribe = observer.subscribe(() => undefined)

    observer.setQueries(
      [
        {
          ...query,
          suspense: true,
        },
      ],
      { combine },
    )

    void queryClient.resetQueries({ queryKey: key })
    expect(combine).toHaveBeenCalledTimes(1)

    unsubscribe()
  })

  it('should handle queries being removed with stable combine reference', () => {
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

  it('should update combined result when queries are replaced with different ones (same length)', () => {
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

  it('should recalculate combined result when combine function changes', () => {
    const combine1 = vi.fn((results: Array<QueryObserverResult>) => ({
      total: results.length,
    }))
    const combine2 = vi.fn((results: Array<QueryObserverResult>) => ({
      total: results.length * 4,
    }))

    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = vi.fn().mockReturnValue(1)
    const queryFn2 = vi.fn().mockReturnValue(2)

    const queries = [
      { queryKey: key1, queryFn: queryFn1 },
      { queryKey: key2, queryFn: queryFn2 },
    ]

    const observer = new QueriesObserver<{ total: number }>(
      queryClient,
      queries,
      { combine: combine1 },
    )

    const [raw1, getCombined1] = observer.getOptimisticResult(queries, combine1)
    const combined1 = getCombined1(raw1)

    const [raw2, getCombined2] = observer.getOptimisticResult(queries, combine2)
    const combined2 = getCombined2(raw2)

    expect(combined1.total).toBe(2)
    expect(combined2.total).toBe(8)
  })

  it('should use fallback result when combineResult is called without raw argument', () => {
    const combine = vi.fn((results: Array<QueryObserverResult>) => ({
      count: results.length,
    }))

    const key = queryKey()
    const queryFn = vi.fn().mockReturnValue(1)

    const observer = new QueriesObserver<{ count: number }>(
      queryClient,
      [{ queryKey: key, queryFn }],
      { combine },
    )

    const [, getCombined] = observer.getOptimisticResult(
      [{ queryKey: key, queryFn }],
      combine,
    )
    const combined = getCombined()

    expect(combined.count).toBe(1)
  })

  it('should return observer result directly when notifyOnChangeProps is set', () => {
    const key = queryKey()
    const queryFn = vi.fn().mockReturnValue(1)

    const observer = new QueriesObserver(queryClient, [
      { queryKey: key, queryFn, notifyOnChangeProps: ['data'] },
    ])

    const trackResultSpy = vi.spyOn(QueryObserver.prototype, 'trackResult')

    const [, , trackResult] = observer.getOptimisticResult(
      [{ queryKey: key, queryFn, notifyOnChangeProps: ['data'] }],
      undefined,
    )

    const trackedResults = trackResult()

    expect(trackedResults).toHaveLength(1)
    // trackResult should NOT be called when notifyOnChangeProps is set
    expect(trackResultSpy).not.toHaveBeenCalled()

    trackResultSpy.mockRestore()
  })

  it('should return cached combined result when nothing has changed', () => {
    const combine = vi.fn((results: Array<QueryObserverResult>) => ({
      count: results.length,
    }))

    const key = queryKey()
    const queryFn = vi.fn().mockReturnValue(1)

    const queries = [{ queryKey: key, queryFn }]

    const observer = new QueriesObserver<{ count: number }>(
      queryClient,
      queries,
      { combine },
    )

    const [raw1, getCombined1] = observer.getOptimisticResult(queries, combine)
    const combined1 = getCombined1(raw1)

    const [raw2, getCombined2] = observer.getOptimisticResult(queries, combine)
    const combined2 = getCombined2(raw2)

    // Same combine, same queries → cached result returned
    expect(combined1).toBe(combined2)
  })

  it('should track properties on all observers when trackResult is called', () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = () => 'data1'
    const queryFn2 = () => 'data2'

    const observer = new QueriesObserver(queryClient, [
      { queryKey: key1, queryFn: queryFn1 },
      { queryKey: key2, queryFn: queryFn2 },
    ])

    const trackPropSpy = vi.spyOn(QueryObserver.prototype, 'trackProp')

    const [, , trackResult] = observer.getOptimisticResult(
      [
        { queryKey: key1, queryFn: queryFn1 },
        { queryKey: key2, queryFn: queryFn2 },
      ],
      undefined,
    )

    const trackedResults = trackResult()

    expect(trackedResults).toHaveLength(2)

    // Accessing a property on the first result should trigger trackProp on all observers
    void trackedResults[0]!.status

    // 1 direct call from the accessed observer's proxy +
    // 2 synchronized calls from onPropTracked callback (one per observer)
    expect(trackPropSpy).toHaveBeenCalledWith('status')
    expect(trackPropSpy).toHaveBeenCalledTimes(3)

    trackPropSpy.mockRestore()
  })

  it('should subscribe to new observers when a query is added while subscribed', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const key3 = queryKey()
    const queryFn1 = vi.fn().mockReturnValue(1)
    const queryFn2 = vi.fn().mockReturnValue(2)
    const queryFn3 = vi.fn(() => sleep(10).then(() => 3))
    const observer = new QueriesObserver(queryClient, [
      { queryKey: key1, queryFn: queryFn1 },
      { queryKey: key2, queryFn: queryFn2 },
    ])
    const results: Array<Array<QueryObserverResult>> = []
    const unsubscribe = observer.subscribe((result) => {
      results.push(result)
    })

    await vi.advanceTimersByTimeAsync(0)

    expect(results[results.length - 1]).toMatchObject([
      { status: 'success', data: 1 },
      { status: 'success', data: 2 },
    ])

    observer.setQueries([
      { queryKey: key1, queryFn: queryFn1 },
      { queryKey: key2, queryFn: queryFn2 },
      { queryKey: key3, queryFn: queryFn3 },
    ])

    await vi.advanceTimersByTimeAsync(10)

    unsubscribe()

    expect(results[results.length - 1]).toMatchObject([
      { status: 'success', data: 1 },
      { status: 'success', data: 2 },
      { status: 'success', data: 3 },
    ])
  })
})
