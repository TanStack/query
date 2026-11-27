import { setFlagsFromString } from 'node:v8'
import { runInNewContext } from 'node:vm'
import { createKey, sleep } from '@tanstack/query-test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueriesObserver, QueryClient, QueryObserver, defaultQueryFn } from '..'
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
      const keyA = createKey()
      const keyB = createKey()
      queryClient.setQueryData(keyA, 1)
      queryClient.setQueryData(keyB, 10)
      const optionsA = {
        queryKey: keyA,
        queryFn: defaultQueryFn,
        staleTime: Infinity,
      } as const
      const optionsB = {
        queryKey: keyB,
        queryFn: defaultQueryFn,
        staleTime: Infinity,
      } as const
      const combineA = vi.fn<
        (results: Array<QueryObserverResult>) => { data: unknown }
      >((results: Array<QueryObserverResult>) => ({
        data: results[0]!.data,
      }))
      const combineB = vi.fn<
        (results: Array<QueryObserverResult>) => { data: unknown }
      >((results: Array<QueryObserverResult>) => ({
        data: results[0]!.data,
      }))
      const observer = new QueriesObserver(queryClient, [optionsA], {
        combine: combineA,
      })
      const listener = vi.fn<() => void>()
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
      expect(readerB.combineResult(snapshotB)).toStrictEqual({ data: 10 })
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
      expect(readerA.combineResult(readerA.getSnapshot())).toStrictEqual({
        data: 2,
      })
      expect(combineB).toHaveBeenCalledTimes(1)

      listener.mockClear()
      readerB.commit()
      expect(listener).toHaveBeenCalledTimes(1)
      expect(
        observer.getObservers()[0]!.getCurrentQuery().queryKey,
      ).toStrictEqual(keyB)
      listener.mockClear()
      queryClient.setQueryData(keyA, 3)
      expect(listener).not.toHaveBeenCalled()
      queryClient.setQueryData(keyB, 11)
      expect(listener).toHaveBeenCalledTimes(1)
      expect(readerB.combineResult(readerB.getSnapshot())).toStrictEqual({
        data: 11,
      })
      unsubscribe()
    })

    it('keeps the snapshot stable when predicted fetching starts', async () => {
      const options = queryClient.defaultQueryOptions({
        queryKey: createKey(),
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
      const keyA = createKey()
      const keyB = createKey()
      queryClient.setQueryData(keyA, { value: 1 })
      queryClient.setQueryData(keyB, { value: 2 })
      const select = vi.fn<(data: { value: number }) => Array<number>>(
        (data: { value: number }) => [data.value],
      )
      const optionsA = {
        queryKey: keyA,
        queryFn: defaultQueryFn,
        staleTime: Infinity,
      } as const
      const optionsB = {
        queryKey: keyB,
        queryFn: defaultQueryFn,
        staleTime: Infinity,
        select,
        structuralSharing: false,
      } as const
      const observer = new QueriesObserver(queryClient, [optionsA])
      const unsubscribe = observer.subscribe(vi.fn())
      const reader = observer.createResultReader([optionsB, optionsA])
      const snapshot = reader.getSnapshot()
      reader.commit()
      expect(select).toHaveBeenCalledTimes(1)
      expect(observer.getCurrentResult()[0]!.data).toBe(snapshot[0]!.data)
      expect(
        observer
          .getObservers()
          .map((entry) => entry.getCurrentQuery().queryKey),
      ).toStrictEqual([keyB, keyA])
      unsubscribe()
    })

    it('checks cache updates between reading and committing', () => {
      const key = createKey()
      queryClient.setQueryData(key, 1)
      const select = vi.fn<(data: number) => Array<number>>((data: number) => [
        data,
      ])
      const options = {
        queryKey: key,
        queryFn: defaultQueryFn,
        select,
        structuralSharing: false,
      } as const
      const observer = new QueriesObserver(queryClient, [])
      const reader = observer.createResultReader([options])
      const snapshot = reader.getSnapshot()
      queryClient.setQueryData(key, 2)
      reader.commit()
      expect(observer.getCurrentResult()[0]!.data).toStrictEqual([2])
      expect(observer.getCurrentResult()[0]!.data).not.toBe(snapshot[0]!.data)
      expect(select).toHaveBeenCalledTimes(2)
    })

    it('combines the complete result when several selectors change on commit', () => {
      const keys = [createKey(), createKey()]
      keys.forEach((key, index) => queryClient.setQueryData(key, index + 1))
      const queries = keys.map(
        (key) =>
          ({
            queryKey: key,
            queryFn: defaultQueryFn,
            staleTime: Infinity,
          }) as const,
      )
      const combine = vi.fn<
        (results: Array<QueryObserverResult>) => Array<unknown>
      >((results: Array<QueryObserverResult>) =>
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
      expect(reader.combineResult(snapshot)).toStrictEqual([10, 20])
      reader.commit()
      expect(combine).toHaveBeenCalledTimes(1)
      expect(
        observer.getCurrentResult().map((result) => result.data),
      ).toStrictEqual([10, 20])
      unsubscribe()
    })

    it('updates a stable combine when only selection options change', () => {
      const key = createKey()
      queryClient.setQueryData(key, 2)
      const options = {
        queryKey: key,
        queryFn: defaultQueryFn,
        staleTime: Infinity,
      } as const
      const combine = vi.fn<
        (results: Array<QueryObserverResult>) => { data: unknown }
      >((results: Array<QueryObserverResult>) => ({
        data: results[0]!.data,
      }))
      const observer = new QueriesObserver(queryClient, [options], { combine })
      const first = observer.createResultReader([options], { combine })
      expect(first.combineResult(first.getSnapshot())).toStrictEqual({
        data: 2,
      })
      first.commit()
      const second = observer.createResultReader(
        [{ ...options, select: (data: number) => data * 3 }],
        { combine },
      )
      expect(second.combineResult(second.getSnapshot())).toStrictEqual({
        data: 6,
      })
      expect(observer.getCurrentResult()[0]!.data).toBe(2)
      second.commit()
      const third = observer.createResultReader(
        [{ ...options, select: (data: number) => data * 3 }],
        { combine },
      )
      expect(third.combineResult(third.getSnapshot())).toStrictEqual({
        data: 6,
      })
      expect(combine).toHaveBeenCalledTimes(2)
    })
  })

  it('keeps the current snapshot during an optimistic read for a different query list', () => {
    const first = {
      queryKey: createKey(),
      enabled: false,
      placeholderData: 1,
      queryFn: defaultQueryFn,
    } as const
    const second = {
      queryKey: createKey(),
      enabled: false,
      placeholderData: 2,
      queryFn: defaultQueryFn,
    } as const
    const third = {
      queryKey: createKey(),
      enabled: false,
      placeholderData: 3,
      queryFn: defaultQueryFn,
    } as const
    const observer = new QueriesObserver(queryClient, [first, second])
    const current = observer.getCurrentResult()

    const optimistic = observer
      .createResultReader([{ ...first, placeholderData: 4 }, third])
      .getSnapshot()

    expect(optimistic.map((result) => result.data)).toStrictEqual([4, 3])
    expect(observer.getCurrentResult()).toBe(current)
  })

  it('should return an array with all query results', async () => {
    const key1 = createKey()
    const key2 = createKey()
    const queryFn1 = vi.fn<() => number>().mockReturnValue(1)
    const queryFn2 = vi.fn<() => number>().mockReturnValue(2)
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

  it('should update when a query updates', async () => {
    const key1 = createKey()
    const key2 = createKey()
    const queryFn1 = vi.fn<() => number>().mockReturnValue(1)
    const queryFn2 = vi.fn<() => number>().mockReturnValue(2)
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

    expect(results).toHaveLength(6)
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
    const key1 = createKey()
    const key2 = createKey()
    const queryFn1 = vi.fn<() => number>().mockReturnValue(1)
    const queryFn2 = vi.fn<() => number>().mockReturnValue(2)
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
    const key1 = createKey()
    const key2 = createKey()
    const queryFn1 = vi.fn<() => number>().mockReturnValue(1)
    const queryFn2 = vi.fn<() => number>().mockReturnValue(2)
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
    ).toStrictEqual(key2)

    unsubscribe()
    expect(queryCache.find({ queryKey: key1, type: 'active' })).toBeUndefined()
    expect(queryCache.find({ queryKey: key2, type: 'active' })).toBeUndefined()
    expect(results).toHaveLength(6)
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
    const key1 = createKey()
    const key2 = createKey()
    const queryFn1 = vi.fn<() => number>().mockReturnValue(1)
    const queryFn2 = vi.fn<() => number>().mockReturnValue(2)
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

    expect(results).toHaveLength(6)
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
    const key1 = createKey()
    const key2 = createKey()
    const queryFn1 = vi.fn<() => number>().mockReturnValue(1)
    const queryFn2 = vi.fn<() => number>().mockReturnValue(2)
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

    expect(results).toHaveLength(5)
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
    const key1 = createKey()
    const key2 = createKey()
    const queryFn1 = vi.fn<() => number>().mockReturnValue(1)
    const queryFn2 = vi.fn<() => number>().mockReturnValue(2)
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
    const key1 = createKey()
    const observer = new QueriesObserver(queryClient, [
      {
        queryKey: key1,
        queryFn: () => sleep(20).then(() => 1),
      },
    ])

    const subscription1Handler =
      vi.fn<(result: Array<QueryObserverResult>) => void>()
    const subscription2Handler =
      vi.fn<(result: Array<QueryObserverResult>) => void>()

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
    const key1 = createKey()
    const key2 = createKey()
    const queryFn1 = vi.fn<() => number>().mockReturnValue(1)
    const queryFn2 = vi.fn<() => number>().mockReturnValue(2)

    const observer = new QueriesObserver(queryClient, [
      { queryKey: key1, queryFn: queryFn1 },
      { queryKey: key2, queryFn: queryFn2 },
      { queryKey: key1, queryFn: queryFn1 },
    ])

    const results: Array<Array<QueryObserverResult>> = []

    results.push(
      observer
        .createResultReader([
          { queryKey: key1, queryFn: queryFn1 },
          { queryKey: key2, queryFn: queryFn2 },
          { queryKey: key1, queryFn: queryFn1 },
        ])
        .getSnapshot(),
    )

    const unsubscribe = observer.subscribe((result) => {
      results.push(result)
    })
    await vi.advanceTimersByTimeAsync(0)

    unsubscribe()

    expect(results).toHaveLength(6)
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
    const key1 = createKey()
    const key2 = createKey()
    const queryFn1 = vi.fn<() => number>().mockReturnValue(1)
    const queryFn2 = vi.fn<() => number>().mockReturnValue(2)

    queryClient.setQueryData(key1, 1)
    queryClient.setQueryData(key2, 2)

    const observer = new QueriesObserver(queryClient, [
      { queryKey: key1, queryFn: queryFn1 },
      { queryKey: key2, queryFn: queryFn2 },
    ])

    const results: Array<Array<QueryObserverResult>> = []
    results.push(observer.getCurrentResult())

    const onUpdate = vi.fn<(result: Array<QueryObserverResult>) => void>(
      (result: Array<QueryObserverResult>) => {
        results.push(result)
      },
    )
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
    const combine = vi.fn<
      (results: Array<QueryObserverResult>) => {
        count: number
        results: Array<QueryObserverResult>
      }
    >((results: Array<QueryObserverResult>) => ({
      count: results.length,
      results,
    }))

    const key1 = createKey()
    const key2 = createKey()
    const queryFn1 = vi.fn<() => number>().mockReturnValue(1)
    const queryFn2 = vi.fn<() => number>().mockReturnValue(2)

    const observer = new QueriesObserver<{
      count: number
      results: Array<QueryObserverResult>
    }>(queryClient, [{ queryKey: key1, queryFn: queryFn1 }], { combine })

    const initialCombinedReader = observer.createResultReader(
      [{ queryKey: key1, queryFn: queryFn1 }],
      { combine: combine },
    )
    const initialCombined = initialCombinedReader.combineResult(
      initialCombinedReader.getSnapshot(),
    )

    expect(initialCombined.count).toBe(1)

    const newQueries = [
      { queryKey: key1, queryFn: queryFn1 },
      { queryKey: key2, queryFn: queryFn2 },
    ]
    const newCombinedReader = observer.createResultReader(newQueries, {
      combine,
    })
    const newCombined = newCombinedReader.combineResult(
      newCombinedReader.getSnapshot(),
    )

    expect(newCombined.count).toBe(2)
  })

  it('should skip combine notifications while suspense queries have no data', () => {
    const key = createKey()
    const combine = vi.fn<
      (results: Array<QueryObserverResult>) => Array<unknown>
    >((results: Array<QueryObserverResult>) =>
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

    const combinedResultReader = observer.createResultReader([query], {
      combine,
    })
    const rawResult = combinedResultReader.getSnapshot()
    const getCombinedResult = combinedResultReader.combineResult
    expect(getCombinedResult(rawResult)).toStrictEqual(['data'])
    expect(combine).toHaveBeenCalledTimes(1)

    const unsubscribe = observer.subscribe(() => undefined)

    void queryClient.resetQueries({ queryKey: key })
    expect(combine).toHaveBeenCalledTimes(1)

    unsubscribe()
  })

  it('should skip combine notifications after suspense is enabled without structural changes', () => {
    const key = createKey()
    const combine = vi.fn<
      (results: Array<QueryObserverResult>) => Array<unknown>
    >((results: Array<QueryObserverResult>) =>
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

    const combinedResultReader = observer.createResultReader([query], {
      combine,
    })
    const rawResult = combinedResultReader.getSnapshot()
    const getCombinedResult = combinedResultReader.combineResult
    expect(getCombinedResult(rawResult)).toStrictEqual(['data'])
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

  it('should notify listeners when a query with throwOnError fails without changing the combined result', async () => {
    const key = createKey()
    const combine = (results: Array<QueryObserverResult>) =>
      results.map((result) => result.data)
    const query = {
      queryKey: key,
      queryFn: () => sleep(10).then(() => Promise.reject(new Error('error'))),
      retry: false,
      throwOnError: true,
    }

    const observer = new QueriesObserver<Array<unknown>>(queryClient, [query])
    observer.setQueries([query], { combine })

    const reader = observer.createResultReader([query], { combine })
    expect(reader.combineResult(reader.getSnapshot())).toStrictEqual([
      undefined,
    ])
    reader.commit()

    const results: Array<Array<QueryObserverResult>> = []
    const unsubscribe = observer.subscribe((result) => {
      results.push(result)
    })

    await vi.advanceTimersByTimeAsync(10)
    expect(results).toHaveLength(1)
    expect(results[0]?.[0]).toMatchObject({
      status: 'error',
      error: new Error('error'),
    })

    unsubscribe()
  })

  it('should not notify listeners when a query without throwOnError fails without changing the combined result', async () => {
    const key = createKey()
    const combine = (results: Array<QueryObserverResult>) =>
      results.map((result) => result.data)
    const query = {
      queryKey: key,
      queryFn: () => sleep(10).then(() => Promise.reject(new Error('error'))),
      retry: false,
    }

    const observer = new QueriesObserver<Array<unknown>>(queryClient, [query])
    observer.setQueries([query], { combine })

    const reader = observer.createResultReader([query], { combine })
    expect(reader.combineResult(reader.getSnapshot())).toStrictEqual([
      undefined,
    ])
    reader.commit()

    const listener = vi.fn<(result: Array<QueryObserverResult>) => void>()
    const unsubscribe = observer.subscribe(listener)

    await vi.advanceTimersByTimeAsync(10)
    expect(listener).not.toHaveBeenCalled()

    unsubscribe()
  })

  it('should notify listeners when a query with throwOnError function returning true fails without changing the combined result', async () => {
    const key = createKey()
    const combine = (results: Array<QueryObserverResult>) =>
      results.map((result) => result.data)
    const throwOnError = vi.fn<() => boolean>(() => true)
    const query = {
      queryKey: key,
      queryFn: () => sleep(10).then(() => Promise.reject(new Error('error'))),
      retry: false,
      throwOnError,
    }

    const observer = new QueriesObserver<Array<unknown>>(queryClient, [query])
    observer.setQueries([query], { combine })

    const reader = observer.createResultReader([query], { combine })
    expect(reader.combineResult(reader.getSnapshot())).toStrictEqual([
      undefined,
    ])
    reader.commit()

    const listener = vi.fn<(result: Array<QueryObserverResult>) => void>()
    const unsubscribe = observer.subscribe(listener)

    await vi.advanceTimersByTimeAsync(10)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(throwOnError).toHaveBeenCalledWith(
      new Error('error'),
      queryClient.getQueryCache().find({ queryKey: key }),
    )

    unsubscribe()
  })

  it('should not notify listeners when a query with throwOnError function returning false fails without changing the combined result', async () => {
    const key = createKey()
    const combine = (results: Array<QueryObserverResult>) =>
      results.map((result) => result.data)
    const throwOnError = vi.fn<() => boolean>(() => false)
    const query = {
      queryKey: key,
      queryFn: () => sleep(10).then(() => Promise.reject(new Error('error'))),
      retry: false,
      throwOnError,
    }

    const observer = new QueriesObserver<Array<unknown>>(queryClient, [query])
    observer.setQueries([query], { combine })

    const reader = observer.createResultReader([query], { combine })
    expect(reader.combineResult(reader.getSnapshot())).toStrictEqual([
      undefined,
    ])
    reader.commit()

    const listener = vi.fn<(result: Array<QueryObserverResult>) => void>()
    const unsubscribe = observer.subscribe(listener)

    await vi.advanceTimersByTimeAsync(10)
    expect(listener).not.toHaveBeenCalled()
    expect(throwOnError).toHaveBeenCalledWith(
      new Error('error'),
      queryClient.getQueryCache().find({ queryKey: key }),
    )

    unsubscribe()
  })

  it('should not notify listeners while a query with throwOnError refetches after failing without changing the combined result', async () => {
    const key = createKey()
    const combine = (results: Array<QueryObserverResult>) =>
      results.map((result) => result.data)
    let count = 0
    const query = {
      queryKey: key,
      queryFn: () =>
        sleep(10).then(() =>
          count++ === 0 ? 'data' : Promise.reject(new Error('error')),
        ),
      retry: false,
      throwOnError: true,
      notifyOnChangeProps: 'all' as const,
    }

    const observer = new QueriesObserver<Array<unknown>>(queryClient, [query])
    observer.setQueries([query], { combine })

    const reader = observer.createResultReader([query], { combine })
    expect(reader.combineResult(reader.getSnapshot())).toStrictEqual([
      undefined,
    ])
    reader.commit()

    const listener = vi.fn<(result: Array<QueryObserverResult>) => void>()
    const unsubscribe = observer.subscribe(listener)

    await vi.advanceTimersByTimeAsync(10)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenLastCalledWith([
      expect.objectContaining({ status: 'success', data: 'data' }),
    ])

    void queryClient.refetchQueries({ queryKey: key })
    await vi.advanceTimersByTimeAsync(10)
    expect(listener).toHaveBeenCalledTimes(2)
    expect(listener).toHaveBeenLastCalledWith([
      expect.objectContaining({
        status: 'error',
        fetchStatus: 'idle',
        data: 'data',
      }),
    ])

    void queryClient.refetchQueries({ queryKey: key })
    await vi.advanceTimersByTimeAsync(0)
    expect(observer.getCurrentResult()[0]).toMatchObject({
      status: 'error',
      fetchStatus: 'fetching',
    })
    expect(listener).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(10)
    expect(listener).toHaveBeenCalledTimes(3)
    expect(listener).toHaveBeenLastCalledWith([
      expect.objectContaining({ status: 'error', fetchStatus: 'idle' }),
    ])

    unsubscribe()
  })

  it('should handle queries being removed with stable combine reference', () => {
    const combine = vi.fn<
      (results: Array<QueryObserverResult>) => {
        count: number
        results: Array<QueryObserverResult>
      }
    >((results: Array<QueryObserverResult>) => ({
      count: results.length,
      results,
    }))

    const key1 = createKey()
    const key2 = createKey()
    const queryFn1 = vi.fn<() => number>().mockReturnValue(1)
    const queryFn2 = vi.fn<() => number>().mockReturnValue(2)

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

    const initialCombinedReader = observer.createResultReader(
      [
        { queryKey: key1, queryFn: queryFn1 },
        { queryKey: key2, queryFn: queryFn2 },
      ],
      { combine: combine },
    )
    const initialCombined = initialCombinedReader.combineResult(
      initialCombinedReader.getSnapshot(),
    )

    expect(initialCombined.count).toBe(2)

    const newQueries = [{ queryKey: key1, queryFn: queryFn1 }]
    const newCombinedReader = observer.createResultReader(newQueries, {
      combine,
    })
    const newCombined = newCombinedReader.combineResult(
      newCombinedReader.getSnapshot(),
    )

    expect(newCombined.count).toBe(1)
  })

  it('should not return a stale combined result when a query updates before setQueries is called with the new queries', async () => {
    const combine = vi.fn<
      (results: Array<QueryObserverResult>) => {
        count: number
        results: Array<QueryObserverResult>
      }
    >((results: Array<QueryObserverResult>) => ({
      count: results.length,
      results,
    }))

    const key1 = createKey()
    const key2 = createKey()
    const queryFn1 = vi.fn<() => Promise<number>>(() => sleep(10).then(() => 1))
    const queryFn2 = vi.fn<() => Promise<number>>(() => sleep(10).then(() => 2))

    const queries1 = [{ queryKey: key1, queryFn: queryFn1 }]
    const queries2 = [
      { queryKey: key1, queryFn: queryFn1 },
      { queryKey: key2, queryFn: queryFn2 },
    ]

    const observer = new QueriesObserver<{
      count: number
      results: Array<QueryObserverResult>
    }>(queryClient, queries1, { combine })
    const unsubscribe = observer.subscribe(() => undefined)
    // like the effect in `useQueries` after the first render
    observer.setQueries(queries1, { combine })

    // render with the new queries, before an effect calls `setQueries`
    const reader1 = observer.createResultReader(queries2, { combine })
    expect(reader1.combineResult(reader1.getSnapshot()).count).toBe(2)

    // the already-observed query resolves before `setQueries` runs
    await vi.advanceTimersByTimeAsync(10)

    // re-render with the same new queries
    const reader2 = observer.createResultReader(queries2, { combine })
    expect(reader2.combineResult(reader2.getSnapshot()).count).toBe(2)

    unsubscribe()
  })

  it('should update combined result when queries are replaced with different ones (same length)', () => {
    const combine = vi.fn<
      (results: Array<QueryObserverResult>) => {
        keys: Array<'error' | 'success' | 'pending'>
        results: Array<QueryObserverResult>
      }
    >((results: Array<QueryObserverResult>) => ({
      keys: results.map((r) => r.status),
      results,
    }))

    const key1 = createKey()
    const key2 = createKey()
    const queryFn1 = vi.fn<() => number>().mockReturnValue(1)
    const queryFn2 = vi.fn<() => number>().mockReturnValue(2)

    queryClient.setQueryData(key1, 'cached-1')

    const observer = new QueriesObserver<{
      keys: Array<string>
      results: Array<QueryObserverResult>
    }>(queryClient, [{ queryKey: key1, queryFn: queryFn1 }], { combine })

    const initialCombinedReader = observer.createResultReader(
      [{ queryKey: key1, queryFn: queryFn1 }],
      { combine: combine },
    )
    const initialCombined = initialCombinedReader.combineResult(
      initialCombinedReader.getSnapshot(),
    )

    expect(initialCombined.keys).toStrictEqual(['success'])

    const newCombinedReader = observer.createResultReader(
      [{ queryKey: key2, queryFn: queryFn2 }],
      { combine: combine },
    )
    const newCombined = newCombinedReader.combineResult(
      newCombinedReader.getSnapshot(),
    )

    expect(newCombined.keys).toStrictEqual(['pending'])
  })

  it('should recalculate combined result when combine function changes', () => {
    const combine1 = vi.fn<
      (results: Array<QueryObserverResult>) => { total: number }
    >((results: Array<QueryObserverResult>) => ({
      total: results.length,
    }))
    const combine2 = vi.fn<
      (results: Array<QueryObserverResult>) => { total: number }
    >((results: Array<QueryObserverResult>) => ({
      total: results.length * 4,
    }))

    const key1 = createKey()
    const key2 = createKey()
    const queryFn1 = vi.fn<() => number>().mockReturnValue(1)
    const queryFn2 = vi.fn<() => number>().mockReturnValue(2)

    const queries = [
      { queryKey: key1, queryFn: queryFn1 },
      { queryKey: key2, queryFn: queryFn2 },
    ]

    const observer = new QueriesObserver<{ total: number }>(
      queryClient,
      queries,
      { combine: combine1 },
    )

    const combined1Reader = observer.createResultReader(queries, {
      combine: combine1,
    })
    const combined1 = combined1Reader.combineResult(
      combined1Reader.getSnapshot(),
    )

    const combined2Reader = observer.createResultReader(queries, {
      combine: combine2,
    })
    const combined2 = combined2Reader.combineResult(
      combined2Reader.getSnapshot(),
    )

    expect(combined1.total).toBe(2)
    expect(combined2.total).toBe(8)
  })

  it.each(['all', 'none'] as const)(
    'returns the unwrapped result with notifyOnChangeProps set to %s',
    (notifyOnChangeProps) => {
      const queries = [
        { queryKey: createKey(), queryFn: () => 1, notifyOnChangeProps },
      ]
      const observer = new QueriesObserver(queryClient, queries)
      const reader = observer.createResultReader(queries)
      const snapshot = reader.getSnapshot()
      const results = reader.combineResult(snapshot)

      expect(results).toHaveLength(1)
      expect(results[0]).toBe(snapshot[0])
    },
  )

  it('should return cached combined result when nothing has changed', () => {
    const combine = vi.fn<
      (results: Array<QueryObserverResult>) => { count: number }
    >((results: Array<QueryObserverResult>) => ({
      count: results.length,
    }))

    const key = createKey()
    const queryFn = vi.fn<() => number>().mockReturnValue(1)

    const queries = [{ queryKey: key, queryFn }]

    const observer = new QueriesObserver<{ count: number }>(
      queryClient,
      queries,
      { combine },
    )

    const reader = observer.createResultReader(queries, { combine })
    const combined1 = reader.combineResult(reader.getSnapshot())

    const combined2 = reader.combineResult(reader.getSnapshot())

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
      const combine = vi.fn<
        () => string | number | bigint | boolean | null | undefined
      >(() => value)
      const key = createKey()
      const queries = [{ queryKey: key, queryFn: () => 1 }]
      const observer = new QueriesObserver<typeof value>(queryClient, queries, {
        combine,
      })

      const reader = observer.createResultReader(queries, { combine })
      reader.combineResult(reader.getSnapshot())
      reader.combineResult(reader.getSnapshot())

      expect(combine).toHaveBeenCalledTimes(1)
    },
  )

  it('should track properties on all observers when trackResult is called', () => {
    const key1 = createKey()
    const key2 = createKey()
    const queryFn1 = () => 'data1'
    const queryFn2 = () => 'data2'

    const observer = new QueriesObserver(queryClient, [
      { queryKey: key1, queryFn: queryFn1 },
      { queryKey: key2, queryFn: queryFn2 },
    ])

    const trackPropSpy = vi.spyOn(QueryObserver.prototype, 'trackProp')

    const reader = observer.createResultReader([
      { queryKey: key1, queryFn: queryFn1 },
      { queryKey: key2, queryFn: queryFn2 },
    ])
    const trackedResults = reader.combineResult(reader.getSnapshot())

    expect(trackedResults).toHaveLength(2)

    // Accessing a property on the first result should trigger trackProp on all observers
    void trackedResults[0]!.status

    // 1 direct call from the accessed observer's proxy +
    // 2 synchronized calls from onPropTracked callback (one per observer)
    expect(trackPropSpy).toHaveBeenCalledWith('status')
    expect(trackPropSpy).toHaveBeenCalledTimes(3)

    void trackedResults[1]!.status

    expect(trackPropSpy).toHaveBeenCalledTimes(4)
  })

  it('should subscribe to new observers when a query is added while subscribed', async () => {
    const key1 = createKey()
    const key2 = createKey()
    const key3 = createKey()
    const queryFn1 = vi.fn<() => number>().mockReturnValue(1)
    const queryFn2 = vi.fn<() => number>().mockReturnValue(2)
    const queryFn3 = vi.fn<() => Promise<number>>(() => sleep(10).then(() => 3))
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

  it('should not keep queries it moved off alive after they are removed from the cache (#12656)', async () => {
    setFlagsFromString('--expose-gc')
    const gc = runInNewContext('gc') as () => void
    const oldKey = createKey()
    const observer = new QueriesObserver(queryClient, [
      { queryKey: oldKey, queryFn: () => 1 },
    ])
    const unsubscribe = observer.subscribe(() => undefined)
    await vi.advanceTimersByTimeAsync(0)
    const oldQuery = new WeakRef(
      queryClient.getQueryCache().find({ queryKey: oldKey })!,
    )

    observer.setQueries([{ queryKey: createKey(), queryFn: () => 2 }])
    queryClient.removeQueries({ queryKey: oldKey })
    // A WeakRef keeps its target alive until the current job ends.
    await vi.advanceTimersByTimeAsync(0)
    gc()

    expect(oldQuery.deref()).toBeUndefined()
    unsubscribe()
  })
})
