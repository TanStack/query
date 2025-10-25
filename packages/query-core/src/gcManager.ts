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
 * Manages periodic garbage collection across all caches.
 *
 * Instead of each query/mutation having its own timeout,
 * the GCManager runs a single interval that scans all
 * registered caches for items eligible for removal.
 *
 * @example
 * ```typescript
 * // Register a cache for GC
 * gcManager.registerCache(queryCache)
 *
 * // Start scanning
 * gcManager.startScanning()
 *
 * // Change scan interval
 * gcManager.setScanInterval(60000) // 1 minute
 *
 * // Stop scanning
 * gcManager.stopScanning()
 * ```
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
   * Stop periodic scanning. Safe to call multiple times.
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
   * Check if scanning is active
   */
  isScanning(): boolean {
    return this.#isScanning
  }

  /**
   * Track an item that has been marked for garbage collection.
   * Automatically starts scanning if not already running.
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
   * Automatically stops scanning if no items remain eligible.
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
