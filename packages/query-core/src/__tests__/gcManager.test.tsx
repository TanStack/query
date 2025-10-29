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

  describe('initialization and configuration', () => {
    test('should not start scanning initially when no queries are marked for GC', () => {
      const gcManager = queryClient.getGcManager()

      // GC manager should not be scanning initially
      expect(gcManager.isScanning()).toBe(false)
      expect(gcManager.getEligibleItemCount()).toBe(0)
    })

    test('should handle default configuration', () => {
      const defaultQueryClient = new QueryClient()
      defaultQueryClient.mount()
      const defaultGcManager = defaultQueryClient.getGcManager()

      expect(defaultGcManager.isScanning()).toBe(false)
      expect(defaultGcManager.getEligibleItemCount()).toBe(0)

      defaultQueryClient.clear()
    })
  })

  describe('basic tracking and scanning', () => {
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
      expect(
        queryClient.getQueryCache().find({ queryKey: key }),
      ).toBeUndefined()
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
  })

  describe('multiple items with different gc times', () => {
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
      expect(
        queryClient.getQueryCache().find({ queryKey: key1 }),
      ).toBeUndefined()
      expect(gcManager.getEligibleItemCount()).toBe(2)
      expect(gcManager.isScanning()).toBe(true) // Still have 2 queries

      // Second query should be collected
      await vi.advanceTimersByTimeAsync(10)
      expect(
        queryClient.getQueryCache().find({ queryKey: key2 }),
      ).toBeUndefined()
      expect(gcManager.getEligibleItemCount()).toBe(1)
      expect(gcManager.isScanning()).toBe(true) // Still have 1 query

      // Third query should be collected and GC should stop
      await vi.advanceTimersByTimeAsync(10)
      expect(
        queryClient.getQueryCache().find({ queryKey: key3 }),
      ).toBeUndefined()
      expect(gcManager.getEligibleItemCount()).toBe(0)
      expect(gcManager.isScanning()).toBe(false)
    })

    test('should schedule next scan for the nearest gc time', async () => {
      const gcManager = queryClient.getGcManager()
      const key1 = queryKey()
      const key2 = queryKey()
      const key3 = queryKey()

      // Create queries with different gc times
      const observer1 = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: () => 'data1',
        gcTime: 50,
      })
      const observer2 = new QueryObserver(queryClient, {
        queryKey: key2,
        queryFn: () => 'data2',
        gcTime: 100,
      })
      const observer3 = new QueryObserver(queryClient, {
        queryKey: key3,
        queryFn: () => 'data3',
        gcTime: 150,
      })

      const unsubscribe1 = observer1.subscribe(() => undefined)
      const unsubscribe2 = observer2.subscribe(() => undefined)
      const unsubscribe3 = observer3.subscribe(() => undefined)

      await vi.advanceTimersByTimeAsync(0)

      unsubscribe1()
      unsubscribe2()
      unsubscribe3()

      await vi.advanceTimersByTimeAsync(0)

      expect(gcManager.getEligibleItemCount()).toBe(3)

      // Should collect the first one at 50ms
      await vi.advanceTimersByTimeAsync(55)
      expect(gcManager.getEligibleItemCount()).toBe(2)
      expect(
        queryClient.getQueryCache().find({ queryKey: key1 }),
      ).toBeUndefined()

      // Should still have the other two
      expect(queryClient.getQueryCache().find({ queryKey: key2 })).toBeDefined()
      expect(queryClient.getQueryCache().find({ queryKey: key3 })).toBeDefined()
    })

    test('should handle queries added at different times', async () => {
      const gcManager = queryClient.getGcManager()
      const key1 = queryKey()
      const key2 = queryKey()

      // First query
      const observer1 = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: () => 'data1',
        gcTime: 100,
      })

      const unsubscribe1 = observer1.subscribe(() => undefined)
      unsubscribe1()

      await vi.advanceTimersByTimeAsync(0)
      expect(gcManager.getEligibleItemCount()).toBe(1)

      // Advance time but not enough to collect
      await vi.advanceTimersByTimeAsync(50)

      // Add second query
      const observer2 = new QueryObserver(queryClient, {
        queryKey: key2,
        queryFn: () => 'data2',
        gcTime: 30,
      })

      const unsubscribe2 = observer2.subscribe(() => undefined)
      unsubscribe2()

      await vi.advanceTimersByTimeAsync(0)
      expect(gcManager.getEligibleItemCount()).toBe(2)

      // Second query should be collected first (30ms from its mark time)
      await vi.advanceTimersByTimeAsync(35)
      expect(
        queryClient.getQueryCache().find({ queryKey: key2 }),
      ).toBeUndefined()
      expect(queryClient.getQueryCache().find({ queryKey: key1 })).toBeDefined()
      expect(gcManager.getEligibleItemCount()).toBe(1)

      // First query should be collected next
      await vi.advanceTimersByTimeAsync(20)
      expect(
        queryClient.getQueryCache().find({ queryKey: key1 }),
      ).toBeUndefined()
      expect(gcManager.getEligibleItemCount()).toBe(0)
    })
  })

  describe('tracking and untracking', () => {
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

    test('should not track same item twice', async () => {
      const gcManager = queryClient.getGcManager()
      const key = queryKey()

      const observer = new QueryObserver(queryClient, {
        queryKey: key,
        queryFn: () => 'data',
        gcTime: 100,
      })

      const unsubscribe = observer.subscribe(() => undefined)
      await vi.advanceTimersByTimeAsync(0)

      unsubscribe()
      await vi.advanceTimersByTimeAsync(0)

      const query = queryClient.getQueryCache().find({ queryKey: key })
      expect(gcManager.getEligibleItemCount()).toBe(1)

      // Try to track again - should not increase count
      if (query) {
        gcManager.trackEligibleItem(query)
      }

      expect(gcManager.getEligibleItemCount()).toBe(1)
    })

    test('should handle untracking non-existent item', () => {
      const gcManager = queryClient.getGcManager()

      const mockItem = {
        isEligibleForGc: vi.fn(() => true),
        optionalRemove: vi.fn(() => true),
        getGcAtTimestamp: vi.fn(() => Date.now() + 100),
      }

      // Untrack without tracking first - should not throw
      expect(() => {
        gcManager.untrackEligibleItem(mockItem as any)
      }).not.toThrow()

      expect(gcManager.getEligibleItemCount()).toBe(0)
    })

    test('should stop scanning when untracking last item while scanning', async () => {
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

      // Reactivate the query
      const unsubscribe2 = observer.subscribe(() => undefined)

      expect(gcManager.getEligibleItemCount()).toBe(0)

      unsubscribe2()
    })

    test('should reschedule scan when untracking item but others remain', async () => {
      const gcManager = queryClient.getGcManager()
      const key1 = queryKey()
      const key2 = queryKey()

      const observer1 = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: () => 'data1',
        gcTime: 100,
      })
      const observer2 = new QueryObserver(queryClient, {
        queryKey: key2,
        queryFn: () => 'data2',
        gcTime: 200,
      })

      const unsubscribe1 = observer1.subscribe(() => undefined)
      const unsubscribe2 = observer2.subscribe(() => undefined)

      await vi.advanceTimersByTimeAsync(0)

      unsubscribe1()
      unsubscribe2()

      await vi.advanceTimersByTimeAsync(0)

      expect(gcManager.getEligibleItemCount()).toBe(2)
      expect(gcManager.isScanning()).toBe(true)

      // Reactivate first query
      const unsubscribe1Again = observer1.subscribe(() => undefined)

      expect(gcManager.getEligibleItemCount()).toBe(1)
      expect(gcManager.isScanning()).toBe(true)

      unsubscribe1Again()
    })
  })

  describe('edge cases', () => {
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

    test('should handle queries with zero gcTime', async () => {
      const gcManager = queryClient.getGcManager()
      const key = queryKey()

      const observer = new QueryObserver(queryClient, {
        queryKey: key,
        queryFn: () => 'data',
        gcTime: 0,
      })

      const unsubscribe = observer.subscribe(() => undefined)
      await vi.advanceTimersByTimeAsync(0)

      unsubscribe()

      // With gcTime 0, the item is collected almost immediately
      // Since the scan is scheduled in a microtask and then runs immediately
      await vi.advanceTimersByTimeAsync(0)

      // The query should be eligible and scanning should have started
      // But it might already be collected by the time we check
      expect(gcManager.isScanning()).toBe(false)
      expect(
        queryClient.getQueryCache().find({ queryKey: key }),
      ).toBeUndefined()
      expect(gcManager.getEligibleItemCount()).toBe(0)
    })

    test('should handle very large gcTime values', async () => {
      const gcManager = queryClient.getGcManager()
      const key = queryKey()

      // Use a large but reasonable value (1 day in ms)
      const largeGcTime = 24 * 60 * 60 * 1000

      const observer = new QueryObserver(queryClient, {
        queryKey: key,
        queryFn: () => 'data',
        gcTime: largeGcTime,
      })

      const unsubscribe = observer.subscribe(() => undefined)
      await vi.advanceTimersByTimeAsync(0)

      unsubscribe()
      await vi.advanceTimersByTimeAsync(0)

      expect(gcManager.isScanning()).toBe(true)
      expect(gcManager.getEligibleItemCount()).toBe(1)

      // Query should not be collected after a reasonable time
      await vi.advanceTimersByTimeAsync(1000)
      expect(queryClient.getQueryCache().find({ queryKey: key })).toBeDefined()
      expect(gcManager.getEligibleItemCount()).toBe(1)
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

    test('should handle items with very small gcTime (edge of zero)', async () => {
      const gcManager = queryClient.getGcManager()
      const key = queryKey()

      const observer = new QueryObserver(queryClient, {
        queryKey: key,
        queryFn: () => 'data',
        gcTime: 1,
      })

      const unsubscribe = observer.subscribe(() => undefined)
      await vi.advanceTimersByTimeAsync(0)

      unsubscribe()
      await vi.advanceTimersByTimeAsync(0)

      expect(gcManager.isScanning()).toBe(true)
      expect(gcManager.getEligibleItemCount()).toBe(1)

      // Should be collected very quickly
      await vi.advanceTimersByTimeAsync(5)
      expect(
        queryClient.getQueryCache().find({ queryKey: key }),
      ).toBeUndefined()
      expect(gcManager.getEligibleItemCount()).toBe(0)
    })

    test('should handle mix of finite and infinite gcTime queries', async () => {
      const gcManager = queryClient.getGcManager()
      const key1 = queryKey()
      const key2 = queryKey()

      const observer1 = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: () => 'data1',
        gcTime: Infinity,
      })

      const observer2 = new QueryObserver(queryClient, {
        queryKey: key2,
        queryFn: () => 'data2',
        gcTime: 50,
      })

      const unsubscribe1 = observer1.subscribe(() => undefined)
      const unsubscribe2 = observer2.subscribe(() => undefined)

      await vi.advanceTimersByTimeAsync(0)

      unsubscribe1()
      unsubscribe2()

      await vi.advanceTimersByTimeAsync(0)

      // Should schedule based on the item with finite time
      expect(gcManager.isScanning()).toBe(true)
      expect(gcManager.getEligibleItemCount()).toBe(1) // Only finite one is tracked

      // Collect the finite one
      await vi.advanceTimersByTimeAsync(60)
      expect(
        queryClient.getQueryCache().find({ queryKey: key2 }),
      ).toBeUndefined()
      expect(queryClient.getQueryCache().find({ queryKey: key1 })).toBeDefined()
      expect(gcManager.getEligibleItemCount()).toBe(0)
    })

    test('should not schedule scan when all items have Infinity gcTime', async () => {
      const gcManager = queryClient.getGcManager()
      const key1 = queryKey()
      const key2 = queryKey()

      const observer1 = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: () => 'data1',
        gcTime: Infinity,
      })

      const observer2 = new QueryObserver(queryClient, {
        queryKey: key2,
        queryFn: () => 'data2',
        gcTime: Infinity,
      })

      const unsubscribe1 = observer1.subscribe(() => undefined)
      const unsubscribe2 = observer2.subscribe(() => undefined)

      await vi.advanceTimersByTimeAsync(0)

      unsubscribe1()
      unsubscribe2()

      await vi.advanceTimersByTimeAsync(0)

      // Should not schedule scan when all items have Infinity
      expect(gcManager.isScanning()).toBe(false)
      expect(gcManager.getEligibleItemCount()).toBe(0)

      // Items should still exist
      expect(queryClient.getQueryCache().find({ queryKey: key1 })).toBeDefined()
      expect(queryClient.getQueryCache().find({ queryKey: key2 })).toBeDefined()
    })
  })

  describe('error handling', () => {
    test('should continue scanning other items when one throws during isEligibleForGc', async () => {
      const key1 = queryKey()
      const key2 = queryKey()

      const observer1 = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: () => 'data1',
        gcTime: 10,
      })

      const observer2 = new QueryObserver(queryClient, {
        queryKey: key2,
        queryFn: () => 'data2',
        gcTime: 10,
      })

      const unsubscribe1 = observer1.subscribe(() => undefined)
      const unsubscribe2 = observer2.subscribe(() => undefined)

      await vi.advanceTimersByTimeAsync(0)

      unsubscribe1()
      unsubscribe2()

      await vi.advanceTimersByTimeAsync(0)

      const query1 = queryClient.getQueryCache().find({ queryKey: key1 })
      const originalIsEligible = query1!.isEligibleForGc

      // Mock first query to throw
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      query1!.isEligibleForGc = () => {
        throw new Error('Test error')
      }

      await vi.advanceTimersByTimeAsync(15)

      // Second query should still be collected despite first one throwing
      expect(
        queryClient.getQueryCache().find({ queryKey: key2 }),
      ).toBeUndefined()
      expect(consoleErrorSpy).toHaveBeenCalled()

      // Restore
      query1!.isEligibleForGc = originalIsEligible
      consoleErrorSpy.mockRestore()
    })

    test('should continue scanning other items when one throws during optionalRemove', async () => {
      const key1 = queryKey()
      const key2 = queryKey()

      const observer1 = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: () => 'data1',
        gcTime: 10,
      })

      const observer2 = new QueryObserver(queryClient, {
        queryKey: key2,
        queryFn: () => 'data2',
        gcTime: 10,
      })

      const unsubscribe1 = observer1.subscribe(() => undefined)
      const unsubscribe2 = observer2.subscribe(() => undefined)

      await vi.advanceTimersByTimeAsync(0)

      unsubscribe1()
      unsubscribe2()

      await vi.advanceTimersByTimeAsync(0)

      const query1 = queryClient.getQueryCache().find({ queryKey: key1 })
      const originalRemove = query1!.optionalRemove

      // Mock first query to throw
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      query1!.optionalRemove = () => {
        throw new Error('Test error')
      }

      await vi.advanceTimersByTimeAsync(15)

      // Second query should still be collected despite first one throwing
      expect(
        queryClient.getQueryCache().find({ queryKey: key2 }),
      ).toBeUndefined()
      expect(consoleErrorSpy).toHaveBeenCalled()

      // Restore
      query1!.optionalRemove = originalRemove
      consoleErrorSpy.mockRestore()
    })

    test('should not log errors in production', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const key = queryKey()

      const observer = new QueryObserver(queryClient, {
        queryKey: key,
        queryFn: () => 'data',
        gcTime: 10,
      })

      const unsubscribe = observer.subscribe(() => undefined)
      await vi.advanceTimersByTimeAsync(0)
      unsubscribe()
      await vi.advanceTimersByTimeAsync(0)

      const query = queryClient.getQueryCache().find({ queryKey: key })
      query!.isEligibleForGc = () => {
        throw new Error('Test error')
      }

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      await vi.advanceTimersByTimeAsync(15)

      // Should not log in production
      expect(consoleErrorSpy).not.toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
      process.env.NODE_ENV = originalEnv
    })
  })

  describe('stopScanning', () => {
    test('should stop scanning and clear timeout', async () => {
      const gcManager = queryClient.getGcManager()
      const key = queryKey()

      const observer = new QueryObserver(queryClient, {
        queryKey: key,
        queryFn: () => 'data',
        gcTime: 100,
      })

      const unsubscribe = observer.subscribe(() => undefined)
      await vi.advanceTimersByTimeAsync(0)

      unsubscribe()
      await vi.advanceTimersByTimeAsync(0)

      expect(gcManager.isScanning()).toBe(true)

      // Stop scanning manually
      gcManager.stopScanning()

      expect(gcManager.isScanning()).toBe(false)

      // Query should not be collected even after gcTime passes
      await vi.advanceTimersByTimeAsync(150)
      expect(queryClient.getQueryCache().find({ queryKey: key })).toBeDefined()
    })

    test('should be safe to call stopScanning multiple times', () => {
      const gcManager = queryClient.getGcManager()

      expect(() => {
        gcManager.stopScanning()
        gcManager.stopScanning()
        gcManager.stopScanning()
      }).not.toThrow()

      expect(gcManager.isScanning()).toBe(false)
    })

    test('should be safe to call stopScanning when not scanning', () => {
      const gcManager = queryClient.getGcManager()

      expect(gcManager.isScanning()).toBe(false)
      expect(() => {
        gcManager.stopScanning()
      }).not.toThrow()
      expect(gcManager.isScanning()).toBe(false)
    })
  })

  describe('clear', () => {
    test('should clear all eligible items and stop scanning', async () => {
      const gcManager = queryClient.getGcManager()
      const key1 = queryKey()
      const key2 = queryKey()

      const observer1 = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: () => 'data1',
        gcTime: 100,
      })
      const observer2 = new QueryObserver(queryClient, {
        queryKey: key2,
        queryFn: () => 'data2',
        gcTime: 100,
      })

      const unsubscribe1 = observer1.subscribe(() => undefined)
      const unsubscribe2 = observer2.subscribe(() => undefined)

      await vi.advanceTimersByTimeAsync(0)

      unsubscribe1()
      unsubscribe2()

      await vi.advanceTimersByTimeAsync(0)

      expect(gcManager.getEligibleItemCount()).toBe(2)
      expect(gcManager.isScanning()).toBe(true)

      // Clear everything
      gcManager.clear()

      expect(gcManager.getEligibleItemCount()).toBe(0)
      expect(gcManager.isScanning()).toBe(false)
    })

    test('should be safe to call clear when not scanning', () => {
      const gcManager = queryClient.getGcManager()

      expect(() => {
        gcManager.clear()
      }).not.toThrow()

      expect(gcManager.getEligibleItemCount()).toBe(0)
      expect(gcManager.isScanning()).toBe(false)
    })

    test('should be safe to call clear multiple times', async () => {
      const gcManager = queryClient.getGcManager()

      expect(() => {
        gcManager.clear()
        gcManager.clear()
        gcManager.clear()
      }).not.toThrow()

      expect(gcManager.getEligibleItemCount()).toBe(0)
      expect(gcManager.isScanning()).toBe(false)
    })
  })

  describe('mutations', () => {
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

    test('should handle multiple mutations', async () => {
      const gcManager = queryClient.getGcManager()

      // Trigger multiple mutations
      executeMutation(
        queryClient,
        {
          mutationFn: () => sleep(5).then(() => 'result1'),
          gcTime: 10,
        },
        undefined,
      )

      executeMutation(
        queryClient,
        {
          mutationFn: () => sleep(5).then(() => 'result2'),
          gcTime: 20,
        },
        undefined,
      )

      await vi.advanceTimersByTimeAsync(5)

      expect(gcManager.getEligibleItemCount()).toBe(2)
      expect(gcManager.isScanning()).toBe(true)

      // First mutation should be collected
      await vi.advanceTimersByTimeAsync(10)
      expect(gcManager.getEligibleItemCount()).toBe(1)

      // Second mutation should be collected
      await vi.advanceTimersByTimeAsync(15)
      expect(gcManager.getEligibleItemCount()).toBe(0)
      expect(queryClient.getMutationCache().getAll()).toHaveLength(0)
    })

    test('should handle mix of queries and mutations', async () => {
      const gcManager = queryClient.getGcManager()
      const key = queryKey()

      // Create a query
      const observer = new QueryObserver(queryClient, {
        queryKey: key,
        queryFn: () => 'data',
        gcTime: 20,
      })

      const unsubscribe = observer.subscribe(() => undefined)
      await vi.advanceTimersByTimeAsync(0)

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

      unsubscribe()
      await vi.advanceTimersByTimeAsync(0)

      expect(gcManager.getEligibleItemCount()).toBe(2)
      expect(gcManager.isScanning()).toBe(true)

      // Mutation should be collected first
      await vi.advanceTimersByTimeAsync(10)
      expect(gcManager.getEligibleItemCount()).toBe(1)
      expect(queryClient.getMutationCache().getAll()).toHaveLength(0)

      // Query should still exist
      expect(queryClient.getQueryCache().find({ queryKey: key })).toBeDefined()

      // Query should be collected next
      await vi.advanceTimersByTimeAsync(15)
      expect(gcManager.getEligibleItemCount()).toBe(0)
      expect(
        queryClient.getQueryCache().find({ queryKey: key }),
      ).toBeUndefined()
    })
  })

  describe('scheduling behavior', () => {
    test('should not schedule scan if already scheduled', async () => {
      const gcManager = queryClient.getGcManager()
      const key1 = queryKey()
      const key2 = queryKey()

      const observer1 = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: () => 'data1',
        gcTime: 100,
      })

      const unsubscribe1 = observer1.subscribe(() => undefined)
      unsubscribe1()

      await vi.advanceTimersByTimeAsync(0)

      expect(gcManager.isScanning()).toBe(true)
      expect(gcManager.getEligibleItemCount()).toBe(1)

      // Try to add another query before microtask completes
      const observer2 = new QueryObserver(queryClient, {
        queryKey: key2,
        queryFn: () => 'data2',
        gcTime: 50,
      })

      const unsubscribe2 = observer2.subscribe(() => undefined)
      unsubscribe2()

      // Should not crash or cause issues
      await vi.advanceTimersByTimeAsync(0)

      expect(gcManager.getEligibleItemCount()).toBe(2)
      expect(gcManager.isScanning()).toBe(true)
    })

    test('should cancel previous timeout when rescheduling', async () => {
      const gcManager = queryClient.getGcManager()
      const key1 = queryKey()
      const key2 = queryKey()

      const observer1 = new QueryObserver(queryClient, {
        queryKey: key1,
        queryFn: () => 'data1',
        gcTime: 100,
      })

      const unsubscribe1 = observer1.subscribe(() => undefined)
      unsubscribe1()

      await vi.advanceTimersByTimeAsync(0)

      expect(gcManager.isScanning()).toBe(true)

      // Add query with shorter time
      const observer2 = new QueryObserver(queryClient, {
        queryKey: key2,
        queryFn: () => 'data2',
        gcTime: 20,
      })

      const unsubscribe2 = observer2.subscribe(() => undefined)
      unsubscribe2()

      await vi.advanceTimersByTimeAsync(0)

      expect(gcManager.getEligibleItemCount()).toBe(2)

      // Should collect the shorter one first
      await vi.advanceTimersByTimeAsync(25)

      expect(
        queryClient.getQueryCache().find({ queryKey: key2 }),
      ).toBeUndefined()
      expect(queryClient.getQueryCache().find({ queryKey: key1 })).toBeDefined()
    })

    test('should handle stopScanning called before schedule completes', async () => {
      const gcManager = queryClient.getGcManager()
      const key = queryKey()

      const observer = new QueryObserver(queryClient, {
        queryKey: key,
        queryFn: () => 'data',
        gcTime: 100,
      })

      const unsubscribe = observer.subscribe(() => undefined)
      await vi.advanceTimersByTimeAsync(0)
      unsubscribe()

      // Don't wait for microtask scheduling to complete
      // Immediately stop scanning - this tests the #isScheduledScan flag behavior
      gcManager.stopScanning()

      await vi.advanceTimersByTimeAsync(0)

      // After microtask, scanning should still be stopped
      expect(gcManager.isScanning()).toBe(false)

      // Query should not be collected
      await vi.advanceTimersByTimeAsync(150)
      expect(queryClient.getQueryCache().find({ queryKey: key })).toBeDefined()
    })
  })

  describe('integration scenarios', () => {
    test('should handle rapid subscribe/unsubscribe cycles', async () => {
      const gcManager = queryClient.getGcManager()
      const key = queryKey()

      const observer = new QueryObserver(queryClient, {
        queryKey: key,
        queryFn: () => 'data',
        gcTime: 50,
      })

      // Rapid cycles
      for (let i = 0; i < 10; i++) {
        const unsubscribe = observer.subscribe(() => undefined)
        await vi.advanceTimersByTimeAsync(0)
        unsubscribe()
        await vi.advanceTimersByTimeAsync(0)
      }

      // Should still work correctly
      expect(gcManager.getEligibleItemCount()).toBe(1)
      expect(gcManager.isScanning()).toBe(true)

      await vi.advanceTimersByTimeAsync(60)

      expect(
        queryClient.getQueryCache().find({ queryKey: key }),
      ).toBeUndefined()
      expect(gcManager.getEligibleItemCount()).toBe(0)
    })

    test('should handle many items being added simultaneously', async () => {
      const gcManager = queryClient.getGcManager()
      const observers = []

      // Create many queries
      for (let i = 0; i < 50; i++) {
        const observer = new QueryObserver(queryClient, {
          queryKey: queryKey(),
          queryFn: () => `data${i}`,
          gcTime: 100 + i * 10,
        })
        observers.push(observer)
      }

      // Subscribe and unsubscribe from all
      for (const observer of observers) {
        const unsubscribe = observer.subscribe(() => undefined)
        await vi.advanceTimersByTimeAsync(0)
        unsubscribe()
      }

      await vi.advanceTimersByTimeAsync(0)

      expect(gcManager.getEligibleItemCount()).toBe(50)
      expect(gcManager.isScanning()).toBe(true)

      // Collect all
      await vi.advanceTimersByTimeAsync(800)

      expect(gcManager.getEligibleItemCount()).toBe(0)
      expect(gcManager.isScanning()).toBe(false)
    })

    test('should handle client remount scenarios', async () => {
      const gcManager = queryClient.getGcManager()
      const key = queryKey()

      const observer = new QueryObserver(queryClient, {
        queryKey: key,
        queryFn: () => 'data',
        gcTime: 50,
      })

      const unsubscribe = observer.subscribe(() => undefined)
      unsubscribe()

      await vi.advanceTimersByTimeAsync(0)

      expect(gcManager.isScanning()).toBe(true)

      // Clear (simulating unmount)
      queryClient.clear()

      expect(gcManager.getEligibleItemCount()).toBe(0)
      expect(gcManager.isScanning()).toBe(false)
    })

    test('should handle queries that fail to be removed', async () => {
      const gcManager = queryClient.getGcManager()
      const key = queryKey()

      const observer = new QueryObserver(queryClient, {
        queryKey: key,
        queryFn: () => 'data',
        gcTime: 10,
      })

      const unsubscribe = observer.subscribe(() => undefined)
      await vi.advanceTimersByTimeAsync(0)

      unsubscribe()
      await vi.advanceTimersByTimeAsync(0)

      const query = queryClient.getQueryCache().find({ queryKey: key })

      // Mock optionalRemove to return false (item not removed)
      const originalRemove = query!.optionalRemove
      query!.optionalRemove = vi.fn(() => false)

      await vi.advanceTimersByTimeAsync(15)

      // Query should still be tracked since it wasn't removed
      expect(queryClient.getQueryCache().find({ queryKey: key })).toBeDefined()
      expect(gcManager.getEligibleItemCount()).toBe(1)
      expect(gcManager.isScanning()).toBe(true)

      // Restore and let it collect
      query!.optionalRemove = originalRemove
      await vi.advanceTimersByTimeAsync(15)

      expect(
        queryClient.getQueryCache().find({ queryKey: key }),
      ).toBeUndefined()
      expect(gcManager.getEligibleItemCount()).toBe(0)
    })

    test('should handle items becoming ineligible during scan', async () => {
      const gcManager = queryClient.getGcManager()
      const key = queryKey()

      const observer = new QueryObserver(queryClient, {
        queryKey: key,
        queryFn: () => 'data',
        gcTime: 10,
      })

      const unsubscribe = observer.subscribe(() => undefined)
      await vi.advanceTimersByTimeAsync(0)

      unsubscribe()
      await vi.advanceTimersByTimeAsync(0)

      const query = queryClient.getQueryCache().find({ queryKey: key })

      // Mock isEligibleForGc to return false
      const originalIsEligible = query!.isEligibleForGc
      query!.isEligibleForGc = vi.fn(() => false)

      await vi.advanceTimersByTimeAsync(15)

      // Query should still exist since it's not eligible
      expect(queryClient.getQueryCache().find({ queryKey: key })).toBeDefined()
      expect(gcManager.getEligibleItemCount()).toBe(1)

      // Restore and let it collect
      query!.isEligibleForGc = originalIsEligible
      await vi.advanceTimersByTimeAsync(15)

      expect(
        queryClient.getQueryCache().find({ queryKey: key }),
      ).toBeUndefined()
      expect(gcManager.getEligibleItemCount()).toBe(0)
    })
  })
})
