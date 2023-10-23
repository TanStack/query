import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { waitFor } from '@testing-library/react'
import { QueriesObserver } from '..'
import { createQueryClient, queryKey, sleep } from './utils'
import type { QueryClient, QueryObserverResult } from '..'

describe('queriesObserver', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createQueryClient()
    queryClient.mount()
  })

  afterEach(() => {
    queryClient.clear()
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
    await sleep(1)
    unsubscribe()
    expect(observerResult).toMatchObject([{ data: 1 }, { data: 2 }])
  })

  test('should still return value for undefined query key', async () => {
    const consoleMock = vi.spyOn(console, 'error')
    consoleMock.mockImplementation(() => undefined)
    const key1 = queryKey()
    const queryFn1 = vi.fn().mockReturnValue(1)
    const queryFn2 = vi.fn().mockReturnValue(2)
    const observer = new QueriesObserver(queryClient, [
      { queryKey: key1, queryFn: queryFn1 },
      { queryKey: undefined, queryFn: queryFn2 },
    ])
    let observerResult
    const unsubscribe = observer.subscribe((result) => {
      observerResult = result
    })
    await sleep(1)
    unsubscribe()
    expect(observerResult).toMatchObject([{ data: 1 }, { data: 2 }])

    expect(consoleMock).toHaveBeenCalledTimes(1)
    expect(consoleMock).toHaveBeenCalledWith(
      "As of v4, queryKey needs to be an Array. If you are using a string like 'repoData', please change it to an Array, e.g. ['repoData']",
    )
    consoleMock.mockRestore()
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
    await sleep(1)
    queryClient.setQueryData(key2, 3)
    await sleep(1)
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
    await sleep(1)
    observer.setQueries([{ queryKey: key2, queryFn: queryFn2 }])
    await sleep(1)
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
    await sleep(1)
    observer.setQueries([
      { queryKey: key2, queryFn: queryFn2 },
      { queryKey: key1, queryFn: queryFn1 },
    ])
    await sleep(1)
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
    await sleep(1)
    observer.setQueries([
      { queryKey: key1, queryFn: queryFn1 },
      { queryKey: key2, queryFn: queryFn2 },
    ])
    await sleep(1)
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

  test('should trigger all fetches when subscribed', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = vi.fn().mockReturnValue(1)
    const queryFn2 = vi.fn().mockReturnValue(2)
    const observer = new QueriesObserver(queryClient, [
      { queryKey: key1, queryFn: queryFn1 },
      { queryKey: key2, queryFn: queryFn2 },
    ])
    const unsubscribe = observer.subscribe(() => undefined)
    await sleep(1)
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

    await waitFor(() => {
      // 1 call: pending
      expect(subscription1Handler).toBeCalledTimes(1)
      // 1 call: success
      expect(subscription2Handler).toBeCalledTimes(1)
    })

    // Clean-up
    unsubscribe2()
  })
})
