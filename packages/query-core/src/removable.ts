import { isServer, isValidTimeout } from './utils'
import type { GCManager } from './gcManager'

/**
 * Base class for objects that can be garbage collected.
 *
 * Instead of scheduling individual timeouts, this class
 * marks objects as eligible for GC with a timestamp.
 * The GCManager schedules timeouts to scan and remove eligible items
 * when they become ready for collection.
 */
export abstract class Removable {
  /**
   * Garbage collection time in milliseconds.
   * When different gcTime values are specified, the longest one is used.
   */
  gcTime!: number

  /**
   * Timestamp when this item was marked for garbage collection.
   * null means the item is active and should not be collected.
   */
  gcMarkedAt: number | null = null

  /**
   * Clean up resources when destroyed
   */
  destroy(): void {
    this.clearGcMark()
  }

  /**
   * Mark this item as eligible for garbage collection.
   * Sets gcMarkedAt to the current time.
   *
   * Called when:
   * - Last observer unsubscribes
   * - Fetch completes (queries)
   * - Item is constructed with no observers
   */
  protected markForGc(): void {
    // Only mark if gcTime is valid (not Infinity, not negative)
    if (isValidTimeout(this.gcTime)) {
      this.gcMarkedAt = Date.now()
      this.getGcManager().trackEligibleItem(this)
    } else {
      this.clearGcMark()
    }
  }

  protected abstract getGcManager(): GCManager

  /**
   * Clear the GC mark, making this item ineligible for collection.
   *
   * Called when:
   * - An observer subscribes
   * - Item becomes active again
   */
  protected clearGcMark(): void {
    this.gcMarkedAt = null
    this.getGcManager().untrackEligibleItem(this)
  }

  /**
   * Check if this item is eligible for garbage collection.
   *
   * An item is eligible if:
   * 1. It has been marked (gcMarkedAt is not null)
   * 2. Current time has passed the marked time plus gcTime
   *
   * @returns true if eligible for GC
   */
  isEligibleForGc(): boolean {
    if (this.gcMarkedAt === null) {
      return false
    }
    if (this.gcTime === Infinity) {
      return false
    }

    return Date.now() >= this.gcMarkedAt + this.gcTime
  }

  /**
   * Get the timestamp when this item will be eligible for garbage collection.
   *
   * @returns The timestamp (gcMarkedAt + gcTime), or null if not marked,
   *          or Infinity if gcTime is Infinity
   */
  getGcAtTimestamp(): number | null {
    if (this.gcMarkedAt === null) {
      return null
    }

    if (this.gcTime === Infinity) {
      return Infinity
    }

    return this.gcMarkedAt + this.gcTime
  }

  /**
   * Update the garbage collection time.
   * Uses the maximum of the current gcTime and the new gcTime.
   *
   * Defaults to 5 minutes on client, Infinity on server.
   *
   * @param newGcTime - New garbage collection time in milliseconds
   */
  protected updateGcTime(newGcTime: number | undefined): void {
    // Default to 5 minutes (Infinity for server-side) if no gcTime is set
    this.gcTime = Math.max(
      this.gcTime || 0,
      newGcTime ?? (isServer ? Infinity : 5 * 60 * 1000),
    )
  }

  /**
   * Attempt to remove this item if it meets removal criteria.
   * Subclasses implement the actual removal logic.
   *
   * Typically checks:
   * - No active observers
   * - Not currently fetching/pending
   * - Any other subclass-specific criteria
   */
  abstract optionalRemove(): boolean
}
