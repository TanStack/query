import { systemSetTimeoutZero, timeoutManager } from './timeoutManager'
import type { Removable } from './removable'
import type { ManagedTimerId } from './timeoutManager'

/**
 * Configuration for the GC manager
 */
export interface GCManagerConfig {
  /**
   * How often to scan for garbage collection (in milliseconds)
   * @default 10 (10 milliseconds)
   */
  scanInterval?: number

  /**
   * Minimum allowed scan interval (safety limit)
   * @default 1 (1 millisecond)
   */
  minScanInterval?: number

  /**
   * Maximum allowed scan interval
   * @default 300000 (5 minutes)
   */
  maxScanInterval?: number
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
  #scanInterval: number
  #minScanInterval: number
  #maxScanInterval: number
  #intervalId: ManagedTimerId | null = null
  #isScanning = false
  #isPaused = false
  #isScheduledImmediateScan = false
  #eligibleItems = new Set<Removable>()

  constructor(config: GCManagerConfig = {}) {
    this.#minScanInterval = config.minScanInterval ?? 1
    this.#maxScanInterval = config.maxScanInterval ?? 300000
    this.#scanInterval = this.#validateInterval(config.scanInterval ?? 10)
  }

  /**
   * Set the scan interval. Takes effect on next start/resume.
   *
   * @param ms - Interval in milliseconds
   */
  setScanInterval(ms: number): void {
    this.#scanInterval = this.#validateInterval(ms)

    // Restart scanning if currently active
    if (this.#isScanning && !this.#isPaused) {
      this.stopScanning()
      this.startScanning()
    }
  }

  /**
   * Get the current scan interval
   */
  getScanInterval(): number {
    return this.#scanInterval
  }

  scheduleImmediateScan(): void {
    if (this.#isScheduledImmediateScan) {
      return
    }

    this.#isScheduledImmediateScan = true

    systemSetTimeoutZero(() => {
      if (!this.#isPaused) {
        this.#performScan()
      }
      this.#isScheduledImmediateScan = false
    })
  }

  /**
   * Start periodic scanning. Safe to call multiple times.
   */
  startScanning(): void {
    if (this.#isScanning) {
      return
    }

    this.#isScanning = true
    this.#isPaused = false

    this.#intervalId = timeoutManager.setInterval(() => {
      if (!this.#isPaused) {
        this.#performScan()
      }
    }, this.#scanInterval)
  }

  /**
   * Stop periodic scanning. Safe to call multiple times.
   */
  stopScanning(): void {
    if (!this.#isScanning) {
      return
    }

    this.#isScanning = false
    this.#isPaused = false

    if (this.#intervalId !== null) {
      timeoutManager.clearInterval(this.#intervalId)
      this.#intervalId = null
    }
  }

  /**
   * Pause scanning without stopping it.
   * Useful for tests that need to control when GC occurs.
   */
  pauseScanning(): void {
    this.#isPaused = true
  }

  /**
   * Resume scanning after pause
   */
  resumeScanning(): void {
    this.#isPaused = false
  }

  /**
   * Manually trigger a scan immediately.
   * Useful for tests or forcing immediate cleanup.
   */
  triggerScan(): void {
    this.#performScan()
  }

  /**
   * Check if scanning is active
   */
  isScanning(): boolean {
    return this.#isScanning && !this.#isPaused
  }

  /**
   * Track an item that has been marked for garbage collection.
   * Automatically starts scanning if not already running.
   *
   * @param item - The query or mutation marked for GC
   */
  trackEligibleItem(item: Removable): void {
    this.#eligibleItems.add(item)

    // Start scanning if we have eligible items and aren't already scanning
    if (!this.#isScanning) {
      this.startScanning()
    }
  }

  /**
   * Untrack an item that is no longer eligible for garbage collection.
   * Automatically stops scanning if no items remain eligible.
   *
   * @param item - The query or mutation no longer eligible for GC
   */
  untrackEligibleItem(item: Removable): void {
    this.#eligibleItems.delete(item)

    // Stop scanning if no items are eligible
    if (this.getEligibleItemCount() === 0 && this.#isScanning) {
      this.stopScanning()
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
            this.untrackEligibleItem(item)
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

  #validateInterval(ms: number): number {
    if (typeof ms !== 'number' || !Number.isFinite(ms)) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `[GCManager] Invalid scan interval: ${ms}. Using default 30000ms.`,
        )
      }
      return 30000
    }

    if (ms < this.#minScanInterval) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `[GCManager] Scan interval ${ms}ms is below minimum ${this.#minScanInterval}ms. Using minimum.`,
        )
      }
      return this.#minScanInterval
    }

    if (ms > this.#maxScanInterval) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `[GCManager] Scan interval ${ms}ms exceeds maximum ${this.#maxScanInterval}ms. Using maximum.`,
        )
      }
      return this.#maxScanInterval
    }

    return ms
  }
}
