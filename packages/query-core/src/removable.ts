import { isServer as isServerEnvironment } from './environmentManager'
import { timeoutManager } from './timeoutManager'
import { isValidTimeout } from './utils'
import type { ManagedTimerId } from './timeoutManager'

/**
 * The base class for cache entries that are garbage collected once nothing is using them —
 * `Query` and `Mutation` both extend it. The `gcTime` option controls how long an unused entry is
 * kept.
 */
export abstract class Removable {
  #gcTimeout?: ManagedTimerId
  #gcAt = 0

  /**
   * Clears the pending garbage collection timeout, so the entry is no longer scheduled for removal.
   * A subclass may override this to release what it holds on to as well — `Query` also cancels any
   * in-flight fetch.
   */
  destroy(): void {
    this.clearGcTimeout()
  }

  /**
   * Records that the entry may be removed `gcTime` from now, keeping the latest removal time
   * recorded so far. Without a value, `gcTime` defaults to 5 minutes on the client and `Infinity` on
   * the server. A `NaN` is ignored. Removal times use the monotonic `performance.now()` clock, so
   * changes to the system clock don't move them.
   * @param gcTime - The `gcTime` to record, if any.
   */
  protected updateGcTimestamp(gcTime: number | undefined): void {
    // Default to 5 minutes (Infinity for server-side) if no gcTime is set
    const resolvedGcTime =
      gcTime ?? (isServerEnvironment() ? Infinity : 5 * 60 * 1000)

    // A NaN would stick through every later Math.max and stop gc for good
    if (!Number.isNaN(resolvedGcTime)) {
      this.#gcAt = Math.max(this.#gcAt, performance.now() + resolvedGcTime)
    }
  }

  /**
   * Records `gcTime` like `updateGcTimestamp`, then schedules the entry to be removed from its cache
   * at the latest removal time recorded, replacing any timeout scheduled before. Nothing is
   * scheduled if that time is `Infinity`.
   * @param gcTime - The `gcTime` to record, if any.
   */
  protected scheduleGc(gcTime: number | undefined): void {
    this.clearGcTimeout()
    this.updateGcTimestamp(gcTime)

    const timeout = Math.max(0, this.#gcAt - performance.now())

    if (isValidTimeout(timeout)) {
      this.#gcTimeout = timeoutManager.setTimeout(() => {
        this.optionalRemove()
      }, timeout)
    }
  }

  /**
   * Cancels the scheduled removal, if there is one.
   */
  protected clearGcTimeout() {
    if (this.#gcTimeout !== undefined) {
      timeoutManager.clearTimeout(this.#gcTimeout)
      this.#gcTimeout = undefined
    }
  }

  /**
   * Called when the garbage collection timeout fires. Subclasses remove the entry from its cache
   * unless it is still in use, e.g. because it has observers.
   */
  protected abstract optionalRemove(): void
}
