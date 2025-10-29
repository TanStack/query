import { timeoutManager } from './timeoutManager'
import type { Removable } from './removable'
import type { ManagedTimerId } from './timeoutManager'

/**
 * Configuration for the GC manager
 */
export interface GCManagerConfig {
  /**
   * Force disable garbage collection.
   * @default false
   */
  forceDisable?: boolean
}

/**
 * Manages garbage collection across all caches.
 *
 * Instead of each query/mutation having its own timeout,
 * the GCManager schedules a single timeout for when the nearest
 * item becomes eligible for removal. After scanning, it reschedules
 * for the next nearest item.
 */
export class GCManager {
  #isScanning = false
  #forceDisable = false
  #eligibleItems = new Set<Removable>()
  #scheduledScanTimeoutId: ManagedTimerId | null = null
  #isScheduledScan = false

  constructor(config: GCManagerConfig = {}) {
    this.#forceDisable = config.forceDisable ?? false
  }

  #scheduleScan(): void {
    if (this.#forceDisable || this.#isScheduledScan) {
      return
    }

    this.#isScheduledScan = true

    queueMicrotask(() => {
      if (!this.#isScheduledScan) {
        return
      }

      this.#isScheduledScan = false

      let minTimeUntilGc = Infinity

      for (const item of this.#eligibleItems) {
        const timeUntilGc = getTimeUntilGc(item)

        if (timeUntilGc < minTimeUntilGc) {
          minTimeUntilGc = timeUntilGc
        }
      }

      if (minTimeUntilGc === Infinity) {
        return
      }

      if (this.#scheduledScanTimeoutId !== null) {
        timeoutManager.clearTimeout(this.#scheduledScanTimeoutId)
      }

      this.#isScanning = true
      this.#scheduledScanTimeoutId = timeoutManager.setTimeout(() => {
        this.#isScanning = false
        this.#scheduledScanTimeoutId = null

        this.#performScan()

        // If there are still eligible items, schedule the next scan
        if (this.#eligibleItems.size > 0) {
          this.#scheduleScan()
        }
      }, minTimeUntilGc)
    })
  }

  /**
   * Stop scanning by clearing the scheduled timeout. Safe to call multiple times.
   */
  stopScanning(): void {
    this.#isScanning = false
    this.#isScheduledScan = false

    if (this.#scheduledScanTimeoutId === null) {
      return
    }

    timeoutManager.clearTimeout(this.#scheduledScanTimeoutId)

    this.#scheduledScanTimeoutId = null
  }

  /**
   * Check if a scan is scheduled (timeout is pending).
   *
   * @returns true if a timeout is scheduled to perform a scan
   */
  isScanning(): boolean {
    return this.#isScanning
  }

  /**
   * Track an item that has been marked for garbage collection.
   * Schedules a timeout to scan when the item becomes eligible (or reschedules
   * if a timeout is already pending and this item will be ready sooner).
   *
   * @param item - The query or mutation marked for GC
   */
  trackEligibleItem(item: Removable): void {
    if (this.#forceDisable) {
      return
    }

    if (this.#eligibleItems.has(item)) {
      return
    }

    this.#eligibleItems.add(item)

    this.#scheduleScan()
  }

  /**
   * Untrack an item that is no longer eligible for garbage collection.
   * If a timeout is scheduled and no items remain eligible, stops scanning.
   * If a timeout is scheduled and items remain, reschedules for the next nearest item.
   *
   * @param item - The query or mutation no longer eligible for GC
   */
  untrackEligibleItem(item: Removable): void {
    if (this.#forceDisable) {
      return
    }

    if (!this.#eligibleItems.has(item)) {
      return
    }

    this.#eligibleItems.delete(item)

    if (this.isScanning()) {
      if (this.getEligibleItemCount() === 0) {
        this.stopScanning()
      } else {
        this.#scheduleScan()
      }
    }
  }

  /**
   * Get the number of items currently eligible for garbage collection.
   */
  getEligibleItemCount(): number {
    return this.#eligibleItems.size
  }

  #performScan(): void {
    // Iterate through all eligible items and attempt to collect them
    for (const item of this.#eligibleItems) {
      try {
        if (item.isEligibleForGc()) {
          const wasCollected = item.optionalRemove()

          if (wasCollected) {
            this.#eligibleItems.delete(item)
          }
        }
      } catch (error) {
        // Log but don't throw - one cache error shouldn't stop others
        if (process.env.NODE_ENV !== 'production') {
          console.error('[GCManager] Error during garbage collection:', error)
        }
      }
    }
  }

  /**
   * Clear all eligible items and stop any scheduled scans.
   */
  clear(): void {
    this.#eligibleItems.clear()
    this.stopScanning()
  }
}

function getTimeUntilGc(item: Removable): number {
  const gcAt = item.getGcAtTimestamp()
  if (gcAt === null) {
    return Infinity
  }
  return Math.max(0, gcAt - Date.now())
}
