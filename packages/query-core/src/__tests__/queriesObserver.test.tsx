import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { QueriesObserver, QueryClient } from '..'
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

  describe('SSR Hydration', () => {
    describe('Hydration Mismatch Problem', () => {
      test('should demonstrate hydration mismatch issue with multiple queries (before fix)', () => {
        const key1 = queryKey()
        const key2 = queryKey()

        queryClient.setQueryData(key1, { amount: 10 })
        queryClient.setQueryData(key2, { amount: 20 })

        const cache1 = queryClient.getQueryCache().find({ queryKey: key1 })
        const cache2 = queryClient.getQueryCache().find({ queryKey: key2 })

        if (cache1) {
          cache1.state.dataUpdatedAt = 0
          cache1.state.fetchStatus = 'idle'
        }
        if (cache2) {
          cache2.state.dataUpdatedAt = 0
          cache2.state.fetchStatus = 'idle'
        }

        const observer = new QueriesObserver(queryClient, [
          { queryKey: key1, queryFn: () => ({ amount: 10 }) },
          { queryKey: key2, queryFn: () => ({ amount: 20 }) },
        ])

        const clientResults = observer.getCurrentResult()

        expect(clientResults[0]).toMatchObject({
          status: 'success',
          data: { amount: 10 },
          isLoading: false,
          isPending: false,
        })
        expect(clientResults[1]).toMatchObject({
          status: 'success',
          data: { amount: 20 },
          isLoading: false,
          isPending: false,
        })
      })
    })

    describe('Solution with getServerResult', () => {
      test('getServerResult should return pending state for hydrated queries', () => {
        const key1 = queryKey()
        const key2 = queryKey()

        queryClient.setQueryData(key1, { amount: 10 })
        queryClient.setQueryData(key2, { amount: 20 })

        const cache1 = queryClient.getQueryCache().find({ queryKey: key1 })
        const cache2 = queryClient.getQueryCache().find({ queryKey: key2 })

        if (cache1) {
          cache1.state.dataUpdatedAt = 0
          cache1.state.fetchStatus = 'idle'
        }
        if (cache2) {
          cache2.state.dataUpdatedAt = 0
          cache2.state.fetchStatus = 'idle'
        }

        const observer = new QueriesObserver(queryClient, [
          { queryKey: key1, queryFn: () => ({ amount: 10 }) },
          { queryKey: key2, queryFn: () => ({ amount: 20 }) },
        ])

        const clientResults = observer.getCurrentResult()
        const serverResults = observer.getServerResult()

        expect(clientResults[0]).toMatchObject({
          status: 'success',
          data: { amount: 10 },
          isLoading: false,
        })
        expect(serverResults[0]).toMatchObject({
          status: 'pending',
          data: undefined,
          isLoading: false,
          isPending: true,
          isSuccess: false,
        })

        expect(clientResults[1]).toMatchObject({
          status: 'success',
          data: { amount: 20 },
          isLoading: false,
        })
        expect(serverResults[1]).toMatchObject({
          status: 'pending',
          data: undefined,
          isLoading: false,
          isPending: true,
          isSuccess: false,
        })
      })

      test('should handle mixed hydrated and non-hydrated queries', () => {
        const key1 = queryKey()
        const key2 = queryKey()

        queryClient.setQueryData(key1, { amount: 10 })
        queryClient.setQueryData(key2, { amount: 20 })

        const cache1 = queryClient.getQueryCache().find({ queryKey: key1 })
        const cache2 = queryClient.getQueryCache().find({ queryKey: key2 })

        if (cache1) {
          cache1.state.dataUpdatedAt = 0
          cache1.state.fetchStatus = 'idle'
        }
        if (cache2) {
          cache2.state.dataUpdatedAt = Date.now()
          cache2.state.fetchStatus = 'idle'
        }

        const observer = new QueriesObserver(queryClient, [
          { queryKey: key1, queryFn: () => ({ amount: 10 }) },
          { queryKey: key2, queryFn: () => ({ amount: 20 }) },
        ])

        const serverResults = observer.getServerResult()

        expect(serverResults[0]).toMatchObject({
          status: 'pending',
          data: undefined,
          isPending: true,
        })

        expect(serverResults[1]).toMatchObject({
          status: 'success',
          data: { amount: 20 },
          isPending: false,
        })
      })

      test('should handle fetching state during hydration for multiple queries', () => {
        const key1 = queryKey()
        const key2 = queryKey()

        queryClient.setQueryData(key1, { amount: 10 })
        queryClient.setQueryData(key2, { amount: 20 })

        const cache1 = queryClient.getQueryCache().find({ queryKey: key1 })
        const cache2 = queryClient.getQueryCache().find({ queryKey: key2 })

        if (cache1) {
          cache1.state.dataUpdatedAt = 0
          cache1.state.fetchStatus = 'fetching'
        }
        if (cache2) {
          cache2.state.dataUpdatedAt = 0
          cache2.state.fetchStatus = 'idle'
        }

        const observer = new QueriesObserver(queryClient, [
          { queryKey: key1, queryFn: () => ({ amount: 10 }) },
          { queryKey: key2, queryFn: () => ({ amount: 20 }) },
        ])

        const serverResults = observer.getServerResult()

        expect(serverResults[0]).toMatchObject({
          status: 'pending',
          fetchStatus: 'fetching',
          isLoading: true,
          isPending: true,
        })

        expect(serverResults[1]).toMatchObject({
          status: 'pending',
          fetchStatus: 'idle',
          isLoading: false,
          isPending: true,
        })
      })
    })
  })
})
