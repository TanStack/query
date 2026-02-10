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
      undefined,
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
      undefined,
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
      undefined,
    )
    const initialCombined = getInitialCombined(initialRaw)

    expect(initialCombined.count).toBe(2)

    const newQueries = [{ queryKey: key1, queryFn: queryFn1 }]
    const [newRaw, getNewCombined] = observer.getOptimisticResult(
      newQueries,
      combine,
      undefined,
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
      undefined,
    )
    const initialCombined = getInitialCombined(initialRaw)

    expect(initialCombined.keys).toEqual(['success'])

    const [newRaw, getNewCombined] = observer.getOptimisticResult(
      [{ queryKey: key2, queryFn: queryFn2 }],
      combine,
      undefined,
    )
    const newCombined = getNewCombined(newRaw)

    expect(newCombined.keys).toEqual(['pending'])
  })

  test('should not use structural sharing when structuralSharing is false', () => {
    const key1 = queryKey()
    const queryFn1 = vi.fn().mockReturnValue(1)

    queryClient.setQueryData(key1, 'cached-1')

    // Create a combine function that returns a new object with a nested array
    const nestedArray = ['a', 'b', 'c']
    const combine = vi.fn((_results: Array<QueryObserverResult>) => ({
      nested: nestedArray,
    }))

    const observer = new QueriesObserver<{
      nested: Array<string>
    }>(queryClient, [{ queryKey: key1, queryFn: queryFn1 }], {
      combine,
      structuralSharing: false,
    })

    const [initialRaw, getInitialCombined] = observer.getOptimisticResult(
      [{ queryKey: key1, queryFn: queryFn1 }],
      combine,
      false,
    )
    const initialCombined = getInitialCombined(initialRaw)

    // Create a new combine function reference to trigger re-combine
    // but with the same nested array content
    const combine2 = vi.fn((_results: Array<QueryObserverResult>) => ({
      nested: ['a', 'b', 'c'], // Same content, different reference
    }))

    const [newRaw, getNewCombined] = observer.getOptimisticResult(
      [{ queryKey: key1, queryFn: queryFn1 }],
      combine2,
      false,
    )
    const newCombined = getNewCombined(newRaw)

    // With structuralSharing: false, even though the nested array has the same content,
    // the reference should NOT be preserved (no replaceEqualDeep optimization)
    expect(newCombined.nested).toEqual(initialCombined.nested)
    expect(newCombined.nested).not.toBe(initialCombined.nested)
  })

  test('should use structural sharing when structuralSharing is true', () => {
    const key1 = queryKey()
    const queryFn1 = vi.fn().mockReturnValue(1)

    queryClient.setQueryData(key1, 'cached-1')

    // Create a combine function that returns a new object with a nested array
    const combine = vi.fn((_results: Array<QueryObserverResult>) => ({
      nested: ['a', 'b', 'c'],
    }))

    const observer = new QueriesObserver<{
      nested: Array<string>
    }>(queryClient, [{ queryKey: key1, queryFn: queryFn1 }], {
      combine,
      structuralSharing: true,
    })

    const [initialRaw, getInitialCombined] = observer.getOptimisticResult(
      [{ queryKey: key1, queryFn: queryFn1 }],
      combine,
      true,
    )
    const initialCombined = getInitialCombined(initialRaw)

    // Create a new combine function reference to trigger re-combine
    // but with the same nested array content
    const combine2 = vi.fn((_results: Array<QueryObserverResult>) => ({
      nested: ['a', 'b', 'c'], // Same content, different reference
    }))

    const [newRaw, getNewCombined] = observer.getOptimisticResult(
      [{ queryKey: key1, queryFn: queryFn1 }],
      combine2,
      true,
    )
    const newCombined = getNewCombined(newRaw)

    // With structuralSharing: true, replaceEqualDeep should preserve the reference
    // since the nested array has the same content
    expect(newCombined.nested).toEqual(initialCombined.nested)
    expect(newCombined.nested).toBe(initialCombined.nested)
  })

  test('should use custom structuralSharing function when provided', () => {
    const combine = vi.fn((results: Array<QueryObserverResult>) => ({
      count: results.length,
      data: results.map((r) => r.data),
    }))

    const customStructuralSharing = vi.fn(
      (_oldData: unknown, newData: unknown) => {
        // Custom logic: always return the new data but with a marker
        return { ...(newData as object), customShared: true }
      },
    )

    const key1 = queryKey()
    const queryFn1 = vi.fn().mockReturnValue(1)

    queryClient.setQueryData(key1, 'cached-1')

    const observer = new QueriesObserver<{
      count: number
      data: Array<unknown>
      customShared?: boolean
    }>(queryClient, [{ queryKey: key1, queryFn: queryFn1 }], {
      combine,
      structuralSharing: customStructuralSharing,
    })

    const [initialRaw, getInitialCombined] = observer.getOptimisticResult(
      [{ queryKey: key1, queryFn: queryFn1 }],
      combine,
      customStructuralSharing,
    )
    const initialCombined = getInitialCombined(initialRaw)

    expect(initialCombined.count).toBe(1)
    expect(initialCombined.customShared).toBe(true)
    expect(customStructuralSharing).toHaveBeenCalledTimes(1)
  })

  test('should pass old and new data to custom structuralSharing function', () => {
    const combine = vi.fn((results: Array<QueryObserverResult>) => ({
      count: results.length,
      data: results.map((r) => r.data),
    }))

    const customStructuralSharing = vi.fn(
      (_oldData: unknown, newData: unknown) => {
        // Return new data with reference to old data for testing
        return newData
      },
    )

    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = vi.fn().mockReturnValue(1)
    const queryFn2 = vi.fn().mockReturnValue(2)

    queryClient.setQueryData(key1, 'cached-1')

    const observer = new QueriesObserver<{
      count: number
      data: Array<unknown>
    }>(queryClient, [{ queryKey: key1, queryFn: queryFn1 }], {
      combine,
      structuralSharing: customStructuralSharing,
    })

    // First call
    const [initialRaw, getInitialCombined] = observer.getOptimisticResult(
      [{ queryKey: key1, queryFn: queryFn1 }],
      combine,
      customStructuralSharing,
    )
    const initialCombined = getInitialCombined(initialRaw)

    expect(initialCombined.count).toBe(1)

    // Second call with different queries - should trigger combine again
    const [newRaw, getNewCombined] = observer.getOptimisticResult(
      [
        { queryKey: key1, queryFn: queryFn1 },
        { queryKey: key2, queryFn: queryFn2 },
      ],
      combine,
      customStructuralSharing,
    )
    const newCombined = getNewCombined(newRaw)

    expect(newCombined.count).toBe(2)
    // Custom structural sharing function should have been called twice
    expect(customStructuralSharing).toHaveBeenCalledTimes(2)
    // First call should have undefined as oldData (no previous combined result)
    expect(customStructuralSharing).toHaveBeenNthCalledWith(
      1,
      undefined,
      expect.objectContaining({ count: 1 }),
    )
    // Second call should have the previous combined result as oldData
    expect(customStructuralSharing).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ count: 1 }),
      expect.objectContaining({ count: 2 }),
    )
  })

  test('should retain references with custom structuralSharing function', () => {
    // This test verifies that a custom structuralSharing function can retain references
    const existingArray = [1, 2, 3]

    const combine = vi.fn((results: Array<QueryObserverResult>) => ({
      count: results.length,
      data: results.map((r) => r.data),
      existingArray,
    }))

    const customStructuralSharing = vi.fn(
      (oldData: unknown, newData: unknown) => {
        const oldTyped = oldData as
          | { existingArray?: Array<number> }
          | undefined
        const newTyped = newData as { existingArray: Array<number> }
        // Retain the existingArray reference from old data if it deeply equals
        if (
          oldTyped?.existingArray &&
          JSON.stringify(oldTyped.existingArray) ===
            JSON.stringify(newTyped.existingArray)
        ) {
          return { ...newTyped, existingArray: oldTyped.existingArray }
        }
        return newTyped
      },
    )

    const key1 = queryKey()
    const queryFn1 = vi.fn().mockReturnValue(1)

    queryClient.setQueryData(key1, 'cached-1')

    const observer = new QueriesObserver<{
      count: number
      data: Array<unknown>
      existingArray: Array<number>
    }>(queryClient, [{ queryKey: key1, queryFn: queryFn1 }], {
      combine,
      structuralSharing: customStructuralSharing,
    })

    const [initialRaw, getInitialCombined] = observer.getOptimisticResult(
      [{ queryKey: key1, queryFn: queryFn1 }],
      combine,
      customStructuralSharing,
    )
    const initialCombined = getInitialCombined(initialRaw)
    const initialArrayRef = initialCombined.existingArray

    // Trigger a re-combine by changing the combine function reference
    const combine2 = vi.fn((results: Array<QueryObserverResult>) => ({
      count: results.length,
      data: results.map((r) => r.data),
      existingArray, // Same array content
    }))

    const [newRaw, getNewCombined] = observer.getOptimisticResult(
      [{ queryKey: key1, queryFn: queryFn1 }],
      combine2,
      customStructuralSharing,
    )
    const newCombined = getNewCombined(newRaw)

    // The existingArray reference should be retained from the old data
    expect(newCombined.existingArray).toBe(initialArrayRef)
  })
})
