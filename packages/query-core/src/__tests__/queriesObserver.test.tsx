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

  describe('result readers', () => {
    it('keeps active queries and combine state unchanged until commit', () => {
      const keyA = queryKey()
      const keyB = queryKey()
      queryClient.setQueryData(keyA, 1)
      queryClient.setQueryData(keyB, 10)
      const optionsA = { queryKey: keyA, staleTime: Infinity }
      const optionsB = { queryKey: keyB, staleTime: Infinity }
      const combineA = vi.fn((results: Array<QueryObserverResult>) => ({
        data: results[0]!.data,
      }))
      const combineB = vi.fn((results: Array<QueryObserverResult>) => ({
        data: results[0]!.data,
      }))
      const observer = new QueriesObserver(queryClient, [optionsA], {
        combine: combineA,
      })
      const listener = vi.fn()
      const unsubscribe = observer.subscribe(listener)
      const readerA = observer.createResultReader([optionsA], {
        combine: combineA,
      })
      const snapshotA = readerA.getSnapshot()
      const combinedA = readerA.combineResult(snapshotA)
      readerA.commit()
      const current = observer.getCurrentResult()
      const observers = observer.getObservers()
      const readerB = observer.createResultReader([optionsB], {
        combine: combineB,
      })
      const snapshotB = readerB.getSnapshot()
      expect(readerB.combineResult(snapshotB)).toEqual({ data: 10 })
      expect(readerA.getSnapshot()).toBe(snapshotA)
      expect(readerA.combineResult(snapshotA)).toBe(combinedA)
      expect(observer.getCurrentResult()).toBe(current)
      expect(observer.getObservers()).toBe(observers)
      expect(
        queryClient
          .getQueryCache()
          .find({ queryKey: keyB })!
          .getObserversCount(),
      ).toBe(0)

      queryClient.setQueryData(keyA, 2)
      expect(listener).toHaveBeenCalledTimes(1)
      expect(readerA.combineResult(readerA.getSnapshot())).toEqual({ data: 2 })
      expect(combineB).toHaveBeenCalledTimes(1)

      listener.mockClear()
      readerB.commit()
      expect(listener).toHaveBeenCalledTimes(1)
      expect(observer.getQueries()[0]!.queryKey).toEqual(keyB)
      listener.mockClear()
      queryClient.setQueryData(keyA, 3)
      expect(listener).not.toHaveBeenCalled()
      queryClient.setQueryData(keyB, 11)
      expect(listener).toHaveBeenCalledTimes(1)
      expect(readerB.combineResult(readerB.getSnapshot())).toEqual({
        data: 11,
      })
      unsubscribe()
    })

    it('keeps the snapshot stable when predicted fetching starts', async () => {
      const options = queryClient.defaultQueryOptions({
        queryKey: queryKey(),
        queryFn: () => sleep(10).then(() => 'data'),
        _optimisticResults: 'optimistic',
      })
      const observer = new QueriesObserver(queryClient, [options])
      const reader = observer.createResultReader([options])
      const snapshot = reader.getSnapshot()
      expect(snapshot[0]!.fetchStatus).toBe('fetching')
      expect(reader.getSnapshot()).toBe(snapshot)
      const unsubscribe = observer.subscribe(vi.fn())
      reader.commit()
      expect(reader.getSnapshot()).toBe(snapshot)
      await vi.advanceTimersByTimeAsync(10)
      expect(reader.getSnapshot()).not.toBe(snapshot)
      expect(reader.getSnapshot()[0]!.data).toBe('data')
      unsubscribe()
    })

    it('reuses selection when committing added and reordered queries', () => {
      const keyA = queryKey()
      const keyB = queryKey()
      queryClient.setQueryData(keyA, { value: 1 })
      queryClient.setQueryData(keyB, { value: 2 })
      const select = vi.fn((data: { value: number }) => [data.value])
      const optionsA = { queryKey: keyA, staleTime: Infinity }
      const optionsB = {
        queryKey: keyB,
        staleTime: Infinity,
        select,
        structuralSharing: false,
      }
      const observer = new QueriesObserver(queryClient, [optionsA])
      const unsubscribe = observer.subscribe(vi.fn())
      const reader = observer.createResultReader([optionsB, optionsA])
      const snapshot = reader.getSnapshot()
      reader.commit()
      expect(select).toHaveBeenCalledTimes(1)
      expect(observer.getCurrentResult()[0]!.data).toBe(snapshot[0]!.data)
      expect(observer.getQueries().map((query) => query.queryKey)).toEqual([
        keyB,
        keyA,
      ])
      unsubscribe()
    })

    it('checks cache updates between reading and committing', () => {
      const key = queryKey()
      queryClient.setQueryData(key, 1)
      const select = vi.fn((data: number) => [data])
      const options = { queryKey: key, select, structuralSharing: false }
      const observer = new QueriesObserver(queryClient, [])
      const reader = observer.createResultReader([options])
      const snapshot = reader.getSnapshot()
      queryClient.setQueryData(key, 2)
      reader.commit()
      expect(observer.getCurrentResult()[0]!.data).toEqual([2])
      expect(observer.getCurrentResult()[0]!.data).not.toBe(snapshot[0]!.data)
      expect(select).toHaveBeenCalledTimes(2)
    })

    it('combines the complete result when several selectors change on commit', () => {
      const keys = [queryKey(), queryKey()]
      keys.forEach((key, index) => queryClient.setQueryData(key, index + 1))
      const queries = keys.map((key) => ({
        queryKey: key,
        staleTime: Infinity,
      }))
      const combine = vi.fn((results: Array<QueryObserverResult>) =>
        results.map((result) => result.data),
      )
      const observer = new QueriesObserver(queryClient, queries, { combine })
      const first = observer.createResultReader(queries, { combine })
      first.combineResult(first.getSnapshot())
      first.commit()
      const unsubscribe = observer.subscribe(vi.fn())
      combine.mockClear()
      const reader = observer.createResultReader(
        queries.map((query) => ({
          ...query,
          select: (data: number) => data * 10,
        })),
        { combine },
      )
      const snapshot = reader.getSnapshot()
      expect(reader.combineResult(snapshot)).toEqual([10, 20])
      reader.commit()
      expect(combine).toHaveBeenCalledTimes(1)
      expect(observer.getCurrentResult().map((result) => result.data)).toEqual([
        10, 20,
      ])
      unsubscribe()
    })

    it('updates a stable combine when only selection options change', () => {
      const key = queryKey()
      queryClient.setQueryData(key, 2)
      const options = { queryKey: key, staleTime: Infinity }
      const combine = vi.fn((results: Array<QueryObserverResult>) => ({
        data: results[0]!.data,
      }))
      const observer = new QueriesObserver(queryClient, [options], { combine })
      const first = observer.createResultReader([options], { combine })
      expect(first.combineResult(first.getSnapshot())).toEqual({ data: 2 })
      first.commit()
      const second = observer.createResultReader(
        [{ ...options, select: (data: number) => data * 3 }],
        { combine },
      )
      expect(second.combineResult(second.getSnapshot())).toEqual({ data: 6 })
      expect(observer.getCurrentResult()[0]!.data).toBe(2)
      second.commit()
      const third = observer.createResultReader(
        [{ ...options, select: (data: number) => data * 3 }],
        { combine },
      )
      expect(third.combineResult(third.getSnapshot())).toEqual({ data: 6 })
      expect(combine).toHaveBeenCalledTimes(2)
    })
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
    expect(
      queryCache.find({ queryKey: key2, type: 'active' })?.queryKey,
    ).toEqual(key2)

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
    expect(subscription1Handler).toHaveBeenCalledTimes(1)
    // 1 call: success
    expect(subscription2Handler).toHaveBeenCalledTimes(1)

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

  it('should skip combine notifications while suspense queries have no data', () => {
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

  it('should skip combine notifications after suspense is enabled without structural changes', () => {
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

  it.each([
    ['zero', 0],
    ['negative zero', -0],
    ['NaN', Number.NaN],
    ['false', false],
    ['empty string', ''],
    ['null', null],
    ['undefined', undefined],
    ['zero bigint', 0n],
  ])(
    'should cache the falsy combined result %s when nothing has changed',
    (_name, value) => {
      const combine = vi.fn(() => value)
      const key = queryKey()
      const queries = [{ queryKey: key, queryFn: () => 1 }]
      const observer = new QueriesObserver<typeof value>(queryClient, queries, {
        combine,
      })

      const [raw1, getCombined1] = observer.getOptimisticResult(
        queries,
        combine,
      )
      getCombined1(raw1)

      const [raw2, getCombined2] = observer.getOptimisticResult(
        queries,
        combine,
      )
      getCombined2(raw2)

      expect(combine).toHaveBeenCalledTimes(1)
    },
  )

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

    void trackedResults[1]!.status

    expect(trackPropSpy).toHaveBeenCalledTimes(4)

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
