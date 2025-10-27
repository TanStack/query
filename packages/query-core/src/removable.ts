import { isServer, isValidTimeout } from './utils'

/**
 * Base class for objects that can be garbage collected.
 *
 * Instead of scheduling individual timeouts, this class
 * marks objects as eligible for GC with a timestamp.
 * The GCManager periodically scans and removes eligible items.
 */
export abstract class Removable {
  /**
   * Garbage collection time in milliseconds.
   * When different gcTime values are specified, the longest one is used.
   */
  gcTime!: number

  /**
   * Timestamp when this item becomes eligible for garbage collection.
   * null means the item is active and should not be collected.
   */
  gcEligibleAt: number | null = null

  /**
   * Clean up resources when destroyed
   */
  destroy(): void {
    this.clearGcMark()
  }

  /**
   * Mark this item as eligible for garbage collection.
   * Sets gcEligibleAt to the current time plus gcTime.
   *
   * Called when:
   * - Last observer unsubscribes
   * - Fetch completes (queries)
   * - Item is constructed with no observers
   */
  protected markForGc(): void {
    // Only mark if gcTime is valid (not Infinity, not negative)
    if (isValidTimeout(this.gcTime)) {
      this.gcEligibleAt = Date.now() + this.gcTime
    } else {
      // If gcTime is Infinity or invalid, never mark for GC
      this.gcEligibleAt = null
    }
  }

  /**
   * Clear the GC mark, making this item ineligible for collection.
   *
   * Called when:
   * - An observer subscribes
   * - Item becomes active again
   */
  protected clearGcMark(): void {
    this.gcEligibleAt = null
  }

  /**
   * Check if this item is eligible for garbage collection.
   *
   * An item is eligible if:
   * 1. It has been marked (gcEligibleAt is not null)
   * 2. Current time has passed the eligible time
   *
   * @returns true if eligible for GC
   */
  isEligibleForGc(): boolean {
    if (this.gcEligibleAt === null) {
      return false
    }
    const now = Date.now()
    const isElapsed = now >= this.gcEligibleAt
    return isElapsed
  }

  /**
   * Get time remaining until eligible for GC.
   *
   * @returns milliseconds until eligible, or null if not marked
   */
  getTimeUntilGc(): number | null {
    if (this.gcEligibleAt === null) {
      return null
    }
    const remaining = this.gcEligibleAt - Date.now()
    return Math.max(0, remaining)
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
  abstract optionalRemove(): void
}
