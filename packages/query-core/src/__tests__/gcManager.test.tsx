import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { GCManager } from '../gcManager'
import type { Removable } from '../removable'

/**
 * Creates a mock Removable item for testing
 */
function createMockRemovable(config: {
  gcTime: number
  markedAt?: number
  isEligibleFn?: () => boolean
  shouldRemove?: boolean
}): Removable {
  const markedAt = config.markedAt ?? Date.now()
  const shouldRemove = config.shouldRemove ?? true

  const isEligibleForGcFn = config.isEligibleFn
    ? vi.fn(config.isEligibleFn)
    : vi.fn(() => {
        if (config.gcTime === Infinity) {
          return false
        }
        return Date.now() >= markedAt + config.gcTime
      })

  return {
    isEligibleForGc: isEligibleForGcFn,
    optionalRemove: vi.fn(() => shouldRemove),
    getGcAtTimestamp: () => {
      if (config.gcTime === Infinity) {
        return Infinity
      }
      return markedAt + config.gcTime
    },
  } as unknown as Removable
}

describe('gcManager', () => {
  let gcManager: GCManager

  beforeEach(() => {
    vi.useFakeTimers()
    gcManager = new GCManager()
  })

  afterEach(() => {
    gcManager.clear()
    vi.useRealTimers()
  })

  describe('initialization and configuration', () => {
    test('should not start scanning initially when no items are marked for GC', () => {
      // GC manager should not be scanning initially
      expect(gcManager.isScanning()).toBe(false)
      expect(gcManager.getEligibleItemCount()).toBe(0)
    })

    test('should handle default configuration', () => {
      const defaultGcManager = new GCManager()

      expect(defaultGcManager.isScanning()).toBe(false)
      expect(defaultGcManager.getEligibleItemCount()).toBe(0)

      defaultGcManager.clear()
    })
  })

  describe('basic tracking and scanning', () => {
    test('should start scanning when an item is marked for GC', async () => {
      const item = createMockRemovable({ gcTime: 100 })

      // Track the item - this should start scanning
      gcManager.trackEligibleItem(item)
      await vi.advanceTimersByTimeAsync(0)

      // GC manager should now be scanning and tracking the item
      expect(gcManager.isScanning()).toBe(true)
      expect(gcManager.getEligibleItemCount()).toBe(1)
    })

    test('should stop scanning when all items are garbage collected', async () => {
      const item = createMockRemovable({ gcTime: 10 })

      gcManager.trackEligibleItem(item)
      await vi.advanceTimersByTimeAsync(0)

      expect(gcManager.isScanning()).toBe(true)
      expect(gcManager.getEligibleItemCount()).toBe(1)

      // Advance time past gcTime
      await vi.advanceTimersByTimeAsync(20)

      // Item should be collected and GC should stop
      expect(gcManager.isScanning()).toBe(false)
      expect(gcManager.getEligibleItemCount()).toBe(0)
      expect(item.optionalRemove).toHaveBeenCalled()
    })

    test('should restart scanning when a new item is marked after stopping', async () => {
      const item1 = createMockRemovable({ gcTime: 10 })

      gcManager.trackEligibleItem(item1)
      await vi.advanceTimersByTimeAsync(0)

      expect(gcManager.isScanning()).toBe(true)

      // Wait for first item to be collected
      await vi.advanceTimersByTimeAsync(20)
      expect(gcManager.isScanning()).toBe(false)

      // Create second item
      const item2 = createMockRemovable({ gcTime: 10 })

      gcManager.trackEligibleItem(item2)
      await vi.advanceTimersByTimeAsync(0)

      // GC should restart
      expect(gcManager.isScanning()).toBe(true)
      expect(gcManager.getEligibleItemCount()).toBe(1)
    })
  })

  describe('multiple items with different gc times', () => {
    test('should handle multiple items being marked and collected', async () => {
      const item1 = createMockRemovable({ gcTime: 10 })
      const item2 = createMockRemovable({ gcTime: 20 })
      const item3 = createMockRemovable({ gcTime: 30 })

      gcManager.trackEligibleItem(item1)
      gcManager.trackEligibleItem(item2)
      gcManager.trackEligibleItem(item3)

      await vi.advanceTimersByTimeAsync(0)

      expect(gcManager.isScanning()).toBe(true)
      expect(gcManager.getEligibleItemCount()).toBe(3)

      // First item should be collected
      await vi.advanceTimersByTimeAsync(15)
      expect(gcManager.getEligibleItemCount()).toBe(2)
      expect(gcManager.isScanning()).toBe(true) // Still have 2 items
      expect(item1.optionalRemove).toHaveBeenCalled()

      // Second item should be collected
      await vi.advanceTimersByTimeAsync(10)
      expect(gcManager.getEligibleItemCount()).toBe(1)
      expect(gcManager.isScanning()).toBe(true) // Still have 1 item
      expect(item2.optionalRemove).toHaveBeenCalled()

      // Third item should be collected and GC should stop
      await vi.advanceTimersByTimeAsync(10)
      expect(gcManager.getEligibleItemCount()).toBe(0)
      expect(gcManager.isScanning()).toBe(false)
      expect(item3.optionalRemove).toHaveBeenCalled()
    })

    test('should schedule next scan for the nearest gc time', async () => {
      const item1 = createMockRemovable({ gcTime: 50 })
      const item2 = createMockRemovable({ gcTime: 100 })
      const item3 = createMockRemovable({ gcTime: 150 })

      gcManager.trackEligibleItem(item1)
      gcManager.trackEligibleItem(item2)
      gcManager.trackEligibleItem(item3)

      await vi.advanceTimersByTimeAsync(0)

      expect(gcManager.getEligibleItemCount()).toBe(3)

      // Should collect the first one at 50ms
      await vi.advanceTimersByTimeAsync(55)
      expect(gcManager.getEligibleItemCount()).toBe(2)
      expect(item1.optionalRemove).toHaveBeenCalled()

      // Should still have the other two
      expect(item2.optionalRemove).not.toHaveBeenCalled()
      expect(item3.optionalRemove).not.toHaveBeenCalled()
    })

    test('should handle items added at different times', async () => {
      const item1 = createMockRemovable({ gcTime: 100, markedAt: Date.now() })

      gcManager.trackEligibleItem(item1)
      await vi.advanceTimersByTimeAsync(0)
      expect(gcManager.getEligibleItemCount()).toBe(1)

      // Advance time but not enough to collect
      await vi.advanceTimersByTimeAsync(50)

      // Add second item
      const item2 = createMockRemovable({
        gcTime: 30,
        markedAt: Date.now(),
      })

      gcManager.trackEligibleItem(item2)
      await vi.advanceTimersByTimeAsync(0)
      expect(gcManager.getEligibleItemCount()).toBe(2)

      // Second item should be collected first (30ms from its mark time)
      await vi.advanceTimersByTimeAsync(35)
      expect(gcManager.getEligibleItemCount()).toBe(1)
      expect(item2.optionalRemove).toHaveBeenCalled()
      expect(item1.optionalRemove).not.toHaveBeenCalled()

      // First item should be collected next
      await vi.advanceTimersByTimeAsync(20)
      expect(gcManager.getEligibleItemCount()).toBe(0)
      expect(item1.optionalRemove).toHaveBeenCalled()
    })
  })

  describe('tracking and un-tracking', () => {
    test('should un-track item when it is no longer eligible', async () => {
      const item = createMockRemovable({ gcTime: 100 })

      gcManager.trackEligibleItem(item)
      await vi.advanceTimersByTimeAsync(0)

      expect(gcManager.isScanning()).toBe(true)
      expect(gcManager.getEligibleItemCount()).toBe(1)

      // Untrack the item
      gcManager.untrackEligibleItem(item)

      expect(gcManager.getEligibleItemCount()).toBe(0)
    })

    test('should not track same item twice', async () => {
      const item = createMockRemovable({ gcTime: 100 })

      gcManager.trackEligibleItem(item)
      await vi.advanceTimersByTimeAsync(0)

      expect(gcManager.getEligibleItemCount()).toBe(1)

      // Try to track again - should not increase count
      gcManager.trackEligibleItem(item)

      expect(gcManager.getEligibleItemCount()).toBe(1)
    })

    test('should handle un-tracking non-existent item', () => {
      const mockItem = createMockRemovable({ gcTime: 100 })

      // Untrack without tracking first - should not throw
      expect(() => {
        gcManager.untrackEligibleItem(mockItem)
      }).not.toThrow()

      expect(gcManager.getEligibleItemCount()).toBe(0)
    })

    test('should stop scanning when un-tracking last item while scanning', async () => {
      const item = createMockRemovable({ gcTime: 100 })

      gcManager.trackEligibleItem(item)
      await vi.advanceTimersByTimeAsync(0)

      expect(gcManager.isScanning()).toBe(true)
      expect(gcManager.getEligibleItemCount()).toBe(1)

      // Untrack the item
      gcManager.untrackEligibleItem(item)

      expect(gcManager.getEligibleItemCount()).toBe(0)
      expect(gcManager.isScanning()).toBe(false)
    })

    test('should reschedule scan when un-tracking item but others remain', async () => {
      const item1 = createMockRemovable({ gcTime: 100 })
      const item2 = createMockRemovable({ gcTime: 200 })

      gcManager.trackEligibleItem(item1)
      gcManager.trackEligibleItem(item2)

      await vi.advanceTimersByTimeAsync(0)

      expect(gcManager.getEligibleItemCount()).toBe(2)
      expect(gcManager.isScanning()).toBe(true)

      // Untrack first item
      gcManager.untrackEligibleItem(item1)

      expect(gcManager.getEligibleItemCount()).toBe(1)
      expect(gcManager.isScanning()).toBe(true)
    })

    test('should stop scanning and clear timers when un-tracking eligible item', async () => {
      const gcTime = 100
      const item = createMockRemovable({
        gcTime,
        isEligibleFn: () => false, // Not eligible yet, to prevent immediate removal
      })

      // Track the item - this should schedule a scan
      gcManager.trackEligibleItem(item)

      // Wait for microtask to complete so the scan timeout is scheduled
      await vi.advanceTimersByTimeAsync(0)

      // Verify item is tracked and scanning is active
      expect(gcManager.getEligibleItemCount()).toBe(1)
      expect(gcManager.isScanning()).toBe(true)

      // Un-track the item - this should stop scanning and clear timers
      gcManager.untrackEligibleItem(item)

      // Verify scanning stopped immediately after un-tracking
      expect(gcManager.isScanning()).toBe(false)
      expect(gcManager.getEligibleItemCount()).toBe(0)

      // Verify timers are cleared by advancing time significantly past the original gcTime
      await vi.advanceTimersByTimeAsync(gcTime + 100)

      // Verify the scan callback never fired (isEligibleForGc was never called)
      // This proves the scheduled timeout was cleared
      expect(item.isEligibleForGc).not.toHaveBeenCalled()
      expect(item.optionalRemove).not.toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    test('should handle items with infinite gcTime', async () => {
      const item = createMockRemovable({ gcTime: Infinity })

      gcManager.trackEligibleItem(item)
      await vi.advanceTimersByTimeAsync(0)

      // Item with infinite gcTime should not be tracked (returns Infinity from getGcAtTimestamp)
      // But actually, it will be tracked, just won't schedule a scan
      expect(gcManager.getEligibleItemCount()).toBe(1)
      expect(gcManager.isScanning()).toBe(false)

      // Item should still exist after a long time
      await vi.advanceTimersByTimeAsync(100000)
      expect(gcManager.getEligibleItemCount()).toBe(1)
    })

    test('should handle items with zero gcTime', async () => {
      const item = createMockRemovable({ gcTime: 0 })

      gcManager.trackEligibleItem(item)

      // With gcTime 0, the item is collected almost immediately
      await vi.advanceTimersByTimeAsync(0)

      // The item should be eligible and scanning should have started
      // But it might already be collected by the time we check
      expect(gcManager.isScanning()).toBe(false)
      expect(gcManager.getEligibleItemCount()).toBe(0)
      expect(item.optionalRemove).toHaveBeenCalled()
    })

    test('should handle very large gcTime values', async () => {
      // Use a large but reasonable value (1 day in ms)
      const largeGcTime = 24 * 60 * 60 * 1000
      const item = createMockRemovable({ gcTime: largeGcTime })

      gcManager.trackEligibleItem(item)
      await vi.advanceTimersByTimeAsync(0)

      expect(gcManager.isScanning()).toBe(true)
      expect(gcManager.getEligibleItemCount()).toBe(1)

      // Item should not be collected after a reasonable time
      await vi.advanceTimersByTimeAsync(1000)
      expect(gcManager.getEligibleItemCount()).toBe(1)
      expect(item.optionalRemove).not.toHaveBeenCalled()
    })

    test('should not run continuously when application is idle', async () => {
      // Start with no items
      expect(gcManager.isScanning()).toBe(false)

      // Advance time - GC should not start on its own
      await vi.advanceTimersByTimeAsync(10000)
      expect(gcManager.isScanning()).toBe(false)

      // Add an item
      const item = createMockRemovable({ gcTime: 10 })
      gcManager.trackEligibleItem(item)

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
      const item = createMockRemovable({ gcTime: 1 })

      gcManager.trackEligibleItem(item)
      await vi.advanceTimersByTimeAsync(0)

      expect(gcManager.isScanning()).toBe(true)
      expect(gcManager.getEligibleItemCount()).toBe(1)

      // Should be collected very quickly
      await vi.advanceTimersByTimeAsync(5)
      expect(gcManager.getEligibleItemCount()).toBe(0)
      expect(item.optionalRemove).toHaveBeenCalled()
    })

    test('should handle mix of finite and infinite gcTime items', async () => {
      const item1 = createMockRemovable({ gcTime: Infinity })
      const item2 = createMockRemovable({ gcTime: 50 })

      gcManager.trackEligibleItem(item1)
      gcManager.trackEligibleItem(item2)

      await vi.advanceTimersByTimeAsync(0)

      // Should schedule based on the item with finite time
      expect(gcManager.isScanning()).toBe(true)
      expect(gcManager.getEligibleItemCount()).toBe(2)

      // Collect the finite one
      await vi.advanceTimersByTimeAsync(60)
      expect(gcManager.getEligibleItemCount()).toBe(1)
      expect(item2.optionalRemove).toHaveBeenCalled()
      expect(item1.optionalRemove).not.toHaveBeenCalled()
    })

    test('should not schedule scan when all items have Infinity gcTime', async () => {
      const item1 = createMockRemovable({ gcTime: Infinity })
      const item2 = createMockRemovable({ gcTime: Infinity })

      gcManager.trackEligibleItem(item1)
      gcManager.trackEligibleItem(item2)

      await vi.advanceTimersByTimeAsync(0)

      // Should not schedule scan when all items have Infinity
      expect(gcManager.isScanning()).toBe(false)
      expect(gcManager.getEligibleItemCount()).toBe(2)
    })
  })

  describe('error handling', () => {
    test('should continue scanning other items when one throws during isEligibleForGc', async () => {
      const item1 = createMockRemovable({ gcTime: 10 })
      const item2 = createMockRemovable({ gcTime: 10 })

      // Mock first item to throw
      item1.isEligibleForGc = vi.fn(() => {
        throw new Error('Test error')
      })

      gcManager.trackEligibleItem(item1)
      gcManager.trackEligibleItem(item2)

      await vi.advanceTimersByTimeAsync(0)

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      await vi.advanceTimersByTimeAsync(15)

      // Second item should still be collected despite first one throwing
      expect(gcManager.getEligibleItemCount()).toBe(1)
      expect(item2.optionalRemove).toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    test('should continue scanning other items when one throws during optionalRemove', async () => {
      const item1 = createMockRemovable({
        gcTime: 10,
        shouldRemove: true,
      })
      const item2 = createMockRemovable({ gcTime: 10 })

      // Mock first item to throw
      item1.optionalRemove = vi.fn(() => {
        throw new Error('Test error')
      })

      gcManager.trackEligibleItem(item1)
      gcManager.trackEligibleItem(item2)

      await vi.advanceTimersByTimeAsync(0)

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      await vi.advanceTimersByTimeAsync(15)

      // Second item should still be collected despite first one throwing
      expect(gcManager.getEligibleItemCount()).toBe(1)
      expect(item2.optionalRemove).toHaveBeenCalled()
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    test('should not log errors in production', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const item = createMockRemovable({ gcTime: 10 })

      // Mock item to throw
      item.isEligibleForGc = vi.fn(() => {
        throw new Error('Test error')
      })

      gcManager.trackEligibleItem(item)
      await vi.advanceTimersByTimeAsync(0)

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
      const item = createMockRemovable({ gcTime: 100 })

      gcManager.trackEligibleItem(item)
      await vi.advanceTimersByTimeAsync(0)

      expect(gcManager.isScanning()).toBe(true)

      // Stop scanning manually
      gcManager.stopScanning()

      expect(gcManager.isScanning()).toBe(false)

      // Item should not be collected even after gcTime passes
      await vi.advanceTimersByTimeAsync(150)
      expect(gcManager.getEligibleItemCount()).toBe(1)
      expect(item.optionalRemove).not.toHaveBeenCalled()
    })

    test('should be safe to call stopScanning multiple times', () => {
      expect(() => {
        gcManager.stopScanning()
        gcManager.stopScanning()
        gcManager.stopScanning()
      }).not.toThrow()

      expect(gcManager.isScanning()).toBe(false)
    })

    test('should be safe to call stopScanning when not scanning', () => {
      expect(gcManager.isScanning()).toBe(false)
      expect(() => {
        gcManager.stopScanning()
      }).not.toThrow()
      expect(gcManager.isScanning()).toBe(false)
    })
  })

  describe('clear', () => {
    test('should clear all eligible items and stop scanning', async () => {
      const item1 = createMockRemovable({ gcTime: 100 })
      const item2 = createMockRemovable({ gcTime: 100 })

      gcManager.trackEligibleItem(item1)
      gcManager.trackEligibleItem(item2)

      await vi.advanceTimersByTimeAsync(0)

      expect(gcManager.getEligibleItemCount()).toBe(2)
      expect(gcManager.isScanning()).toBe(true)

      // Clear everything
      gcManager.clear()

      expect(gcManager.getEligibleItemCount()).toBe(0)
      expect(gcManager.isScanning()).toBe(false)
    })

    test('should be safe to call clear when not scanning', () => {
      expect(() => {
        gcManager.clear()
      }).not.toThrow()

      expect(gcManager.getEligibleItemCount()).toBe(0)
      expect(gcManager.isScanning()).toBe(false)
    })

    test('should be safe to call clear multiple times', () => {
      expect(() => {
        gcManager.clear()
        gcManager.clear()
        gcManager.clear()
      }).not.toThrow()

      expect(gcManager.getEligibleItemCount()).toBe(0)
      expect(gcManager.isScanning()).toBe(false)
    })
  })

  describe('scheduling behavior', () => {
    test('should not double-schedule when a schedule is already queued (microtask guard)', async () => {
      const item1 = createMockRemovable({ gcTime: 100 })
      const item2 = createMockRemovable({ gcTime: 50 })
      // Schedule first item
      gcManager.trackEligibleItem(item1)
      // Add second item before the microtask runs; second scheduleScan should be a no-op
      gcManager.trackEligibleItem(item2)
      await vi.advanceTimersByTimeAsync(0)
      expect(gcManager.getEligibleItemCount()).toBe(2)
      expect(gcManager.isScanning()).toBe(true)
    })

    test('should cancel previous timeout when rescheduling', async () => {
      const item1 = createMockRemovable({ gcTime: 100 })
      const item2 = createMockRemovable({ gcTime: 20 })

      gcManager.trackEligibleItem(item1)
      await vi.advanceTimersByTimeAsync(0)

      expect(gcManager.isScanning()).toBe(true)

      // Add item with shorter time
      gcManager.trackEligibleItem(item2)
      await vi.advanceTimersByTimeAsync(0)

      expect(gcManager.getEligibleItemCount()).toBe(2)

      // Should collect the shorter one first
      await vi.advanceTimersByTimeAsync(25)

      expect(item2.optionalRemove).toHaveBeenCalled()
      expect(item1.optionalRemove).not.toHaveBeenCalled()
    })

    test('should handle stopScanning called before schedule completes', async () => {
      const item = createMockRemovable({ gcTime: 100 })

      gcManager.trackEligibleItem(item)

      // Don't wait for microtask scheduling to complete
      // Immediately stop scanning - this tests the #isScheduledScan flag behavior
      gcManager.stopScanning()

      await vi.advanceTimersByTimeAsync(0)

      // After microtask, scanning should still be stopped
      expect(gcManager.isScanning()).toBe(false)

      // Item should not be collected
      await vi.advanceTimersByTimeAsync(150)
      expect(gcManager.getEligibleItemCount()).toBe(1)
      expect(item.optionalRemove).not.toHaveBeenCalled()
    })
  })

  describe('integration scenarios', () => {
    test('should handle rapid track/un-track cycles', async () => {
      const item = createMockRemovable({ gcTime: 50 })

      // Rapid cycles
      for (let i = 0; i < 10; i++) {
        gcManager.trackEligibleItem(item)
        await vi.advanceTimersByTimeAsync(0)
        gcManager.untrackEligibleItem(item)
        await vi.advanceTimersByTimeAsync(0)
      }

      // Make sure we have something to track
      gcManager.trackEligibleItem(item)
      await vi.advanceTimersByTimeAsync(0)

      expect(gcManager.getEligibleItemCount()).toBe(1)
      expect(gcManager.isScanning()).toBe(true)

      await vi.advanceTimersByTimeAsync(60)

      expect(gcManager.getEligibleItemCount()).toBe(0)
      expect(item.optionalRemove).toHaveBeenCalled()
    })

    test('should handle many items being added simultaneously', async () => {
      const items = []

      // Create many items
      for (let i = 0; i < 50; i++) {
        const item = createMockRemovable({ gcTime: 100 + i * 10 })
        items.push(item)
        gcManager.trackEligibleItem(item)
      }

      await vi.advanceTimersByTimeAsync(0)

      expect(gcManager.getEligibleItemCount()).toBe(50)
      expect(gcManager.isScanning()).toBe(true)

      // Collect all
      await vi.advanceTimersByTimeAsync(800)

      expect(gcManager.getEligibleItemCount()).toBe(0)
      expect(gcManager.isScanning()).toBe(false)

      // Verify all items were attempted to be removed
      items.forEach((item) => {
        expect(item.optionalRemove).toHaveBeenCalled()
      })
    })

    test('should handle items that fail to be removed', async () => {
      const item = createMockRemovable({ gcTime: 10, shouldRemove: false })

      gcManager.trackEligibleItem(item)
      await vi.advanceTimersByTimeAsync(0)

      await vi.advanceTimersByTimeAsync(15)

      // Item should still be tracked since it wasn't removed
      expect(gcManager.getEligibleItemCount()).toBe(1)
      expect(gcManager.isScanning()).toBe(true)
      expect(item.optionalRemove).toHaveBeenCalled()

      // Create a new item that can be removed (since we can't change the mock function easily)
      const newItem = createMockRemovable({ gcTime: 10, shouldRemove: true })
      gcManager.untrackEligibleItem(item)
      gcManager.trackEligibleItem(newItem)
      await vi.advanceTimersByTimeAsync(0)

      await vi.advanceTimersByTimeAsync(15)

      expect(gcManager.getEligibleItemCount()).toBe(0)
      expect(newItem.optionalRemove).toHaveBeenCalled()
    })

    test('should handle items becoming ineligible during scan', async () => {
      const item = createMockRemovable({
        gcTime: 10,
        isEligibleFn: () => false, // Never eligible
      })

      gcManager.trackEligibleItem(item)
      await vi.advanceTimersByTimeAsync(0)

      await vi.advanceTimersByTimeAsync(15)

      // Item should still exist since it's not eligible
      expect(gcManager.getEligibleItemCount()).toBe(1)
      expect(item.optionalRemove).not.toHaveBeenCalled()

      // Now make it eligible by creating a new item
      const newItem = createMockRemovable({
        gcTime: 10,
        isEligibleFn: () => true,
      })
      gcManager.untrackEligibleItem(item)
      gcManager.trackEligibleItem(newItem)
      await vi.advanceTimersByTimeAsync(0)

      await vi.advanceTimersByTimeAsync(15)

      expect(gcManager.getEligibleItemCount()).toBe(0)
      expect(newItem.optionalRemove).toHaveBeenCalled()
    })
  })
})
