import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { QueryClient, QueryObserver } from '..'
import { executeMutation } from './utils'

describe('gcManager', () => {
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

  test('should not start scanning initially when no queries are marked for GC', () => {
    const gcManager = queryClient.getGcManager()

    // GC manager should not be scanning initially
    expect(gcManager.isScanning()).toBe(false)
    expect(gcManager.getEligibleItemCount()).toBe(0)
  })

  test('should start scanning when a query is marked for GC', async () => {
    const gcManager = queryClient.getGcManager()
    const key = queryKey()

    // Create and immediately unsubscribe from a query
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: () => 'data',
      gcTime: 100,
    })

    const unsubscribe = observer.subscribe(() => undefined)

    // Query exists and GC should not be running yet (query is active)
    expect(queryClient.getQueryCache().find({ queryKey: key })).toBeDefined()
    expect(gcManager.getEligibleItemCount()).toBe(0)

    // Unsubscribe - this should mark the query for GC
    unsubscribe()
    await vi.advanceTimersByTimeAsync(0)

    // GC manager should now be scanning and tracking the query
    expect(gcManager.isScanning()).toBe(true)
    expect(gcManager.getEligibleItemCount()).toBe(1)
  })

  test('should stop scanning when all queries are garbage collected', async () => {
    const gcManager = queryClient.getGcManager()
    const key = queryKey()

    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: () => 'data',
      gcTime: 10,
    })

    const unsubscribe = observer.subscribe(() => undefined)
    await vi.advanceTimersByTimeAsync(0)

    // Unsubscribe and wait for GC
    unsubscribe()
    await vi.advanceTimersByTimeAsync(0)
    expect(gcManager.isScanning()).toBe(true)
    expect(gcManager.getEligibleItemCount()).toBe(1)

    // Advance time past gcTime
    await vi.advanceTimersByTimeAsync(20)

    // Query should be collected and GC should stop
    expect(queryClient.getQueryCache().find({ queryKey: key })).toBeUndefined()
    expect(gcManager.isScanning()).toBe(false)
    expect(gcManager.getEligibleItemCount()).toBe(0)
  })

  test('should restart scanning when a new query is marked after stopping', async () => {
    const gcManager = queryClient.getGcManager()
    const key1 = queryKey()
    const key2 = queryKey()

    // First query
    const observer1 = new QueryObserver(queryClient, {
      queryKey: key1,
      queryFn: () => 'data1',
      gcTime: 10,
    })

    const unsubscribe1 = observer1.subscribe(() => undefined)
    unsubscribe1()

    await vi.advanceTimersByTimeAsync(0)

    expect(gcManager.isScanning()).toBe(true)

    // Wait for first query to be collected
    await vi.advanceTimersByTimeAsync(20)
    expect(gcManager.isScanning()).toBe(false)

    // Create second query
    const observer2 = new QueryObserver(queryClient, {
      queryKey: key2,
      queryFn: () => 'data2',
      gcTime: 10,
    })

    const unsubscribe2 = observer2.subscribe(() => undefined)
    unsubscribe2()

    await vi.advanceTimersByTimeAsync(0)

    // GC should restart
    expect(gcManager.isScanning()).toBe(true)
    expect(gcManager.getEligibleItemCount()).toBe(1)
  })

  test('should handle multiple queries being marked and collected', async () => {
    const gcManager = queryClient.getGcManager()
    const key1 = queryKey()
    const key2 = queryKey()
    const key3 = queryKey()

    // Create multiple queries
    const observer1 = new QueryObserver(queryClient, {
      queryKey: key1,
      queryFn: () => 'data1',
      gcTime: 10,
    })
    const observer2 = new QueryObserver(queryClient, {
      queryKey: key2,
      queryFn: () => 'data2',
      gcTime: 20,
    })
    const observer3 = new QueryObserver(queryClient, {
      queryKey: key3,
      queryFn: () => 'data3',
      gcTime: 30,
    })

    const unsubscribe1 = observer1.subscribe(() => undefined)
    const unsubscribe2 = observer2.subscribe(() => undefined)
    const unsubscribe3 = observer3.subscribe(() => undefined)

    await vi.advanceTimersByTimeAsync(0)

    // Unsubscribe from all
    unsubscribe1()
    unsubscribe2()
    unsubscribe3()

    await vi.advanceTimersByTimeAsync(0)

    expect(gcManager.isScanning()).toBe(true)
    expect(gcManager.getEligibleItemCount()).toBe(3)

    // First query should be collected
    await vi.advanceTimersByTimeAsync(15)
    expect(queryClient.getQueryCache().find({ queryKey: key1 })).toBeUndefined()
    expect(gcManager.getEligibleItemCount()).toBe(2)
    expect(gcManager.isScanning()).toBe(true) // Still have 2 queries

    // Second query should be collected
    await vi.advanceTimersByTimeAsync(10)
    expect(queryClient.getQueryCache().find({ queryKey: key2 })).toBeUndefined()
    expect(gcManager.getEligibleItemCount()).toBe(1)
    expect(gcManager.isScanning()).toBe(true) // Still have 1 query

    // Third query should be collected and GC should stop
    await vi.advanceTimersByTimeAsync(10)
    expect(queryClient.getQueryCache().find({ queryKey: key3 })).toBeUndefined()
    expect(gcManager.getEligibleItemCount()).toBe(0)
    expect(gcManager.isScanning()).toBe(false)
  })

  test('should untrack query when it becomes active again', async () => {
    const gcManager = queryClient.getGcManager()
    const key = queryKey()

    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: () => 'data',
      gcTime: 100,
    })

    const unsubscribe1 = observer.subscribe(() => undefined)
    await vi.advanceTimersByTimeAsync(0)
    unsubscribe1()

    await vi.advanceTimersByTimeAsync(0)

    expect(gcManager.isScanning()).toBe(true)
    expect(gcManager.getEligibleItemCount()).toBe(1)

    // Resubscribe - should untrack the query
    const unsubscribe2 = observer.subscribe(() => undefined)

    expect(gcManager.getEligibleItemCount()).toBe(0)
    // Note: isScanning might still be true temporarily until next scan cycle
    // The key thing is that the item is untracked

    unsubscribe2()
  })

  test('should handle queries with infinite gcTime', async () => {
    const gcManager = queryClient.getGcManager()
    const key = queryKey()

    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: () => 'data',
      gcTime: Infinity,
    })

    const unsubscribe = observer.subscribe(() => undefined)
    unsubscribe()

    // Query with infinite gcTime should not be tracked
    expect(gcManager.getEligibleItemCount()).toBe(0)
    expect(gcManager.isScanning()).toBe(false)

    // Query should still exist after a long time
    await vi.advanceTimersByTimeAsync(100000)
    expect(queryClient.getQueryCache().find({ queryKey: key })).toBeDefined()
  })

  test('should not run continuously when application is idle', async () => {
    const gcManager = queryClient.getGcManager()

    // Start with no queries
    expect(gcManager.isScanning()).toBe(false)

    // Advance time - GC should not start on its own
    await vi.advanceTimersByTimeAsync(10000)
    expect(gcManager.isScanning()).toBe(false)

    // Add and remove a query
    const key = queryKey()
    const observer = new QueryObserver(queryClient, {
      queryKey: key,
      queryFn: () => 'data',
      gcTime: 10,
    })
    const unsubscribe = observer.subscribe(() => undefined)
    unsubscribe()

    await vi.advanceTimersByTimeAsync(0)

    // GC should start
    expect(gcManager.isScanning()).toBe(true)

    // Wait for collection
    await vi.advanceTimersByTimeAsync(20)

    // GC should stop after collection
    expect(gcManager.isScanning()).toBe(false)

    // Advance time again - GC should remain stopped
    await vi.advanceTimersByTimeAsync(10000)
    expect(gcManager.isScanning()).toBe(false)
  })

  test('should work with mutations as well', async () => {
    const gcManager = queryClient.getGcManager()

    // Trigger a mutation
    executeMutation(
      queryClient,
      {
        mutationFn: () => sleep(5).then(() => 'result'),
        gcTime: 10,
      },
      undefined,
    )

    await vi.advanceTimersByTimeAsync(5)

    // Mutation should be tracked for GC
    expect(gcManager.isScanning()).toBe(true)
    expect(gcManager.getEligibleItemCount()).toBe(1)

    // Wait for GC
    await vi.advanceTimersByTimeAsync(15)

    // Mutation should be collected and GC should stop
    expect(queryClient.getMutationCache().getAll()).toHaveLength(0)
    expect(gcManager.isScanning()).toBe(false)
    expect(gcManager.getEligibleItemCount()).toBe(0)
  })
})
