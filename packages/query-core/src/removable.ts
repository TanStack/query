import { timeoutManager } from './timeoutManager'
import { isServer as isServerEnvironment } from './environmentManager'
import { isValidTimeout } from './utils'
import type { ManagedTimerId } from './timeoutManager'

/**
 * The base class for cache entries that are garbage collected once nothing is using them —
 * `Query` and `Mutation` both extend it. `gcTime` controls how long an unused entry is kept.
 */
export abstract class Removable {
  gcTime!: number
  #gcTimeout?: ManagedTimerId

  /**
   * Clears the pending garbage collection timeout, so the entry is no longer scheduled for removal.
   * A subclass may override this to release what it holds on to as well — `Query` also cancels any
   * in-flight fetch.
   */
  destroy(): void {
    this.clearGcTimeout()
  }

  /**
   * Schedules the entry to be removed from its cache after `gcTime`, replacing any timeout scheduled
   * before. Nothing is scheduled if `gcTime` is `Infinity`.
   */
  protected scheduleGc(): void {
    this.clearGcTimeout()

    if (isValidTimeout(this.gcTime)) {
      this.#gcTimeout = timeoutManager.setTimeout(() => {
        this.optionalRemove()
      }, this.gcTime)
    }
  }

  /**
   * Updates `gcTime`, keeping the longest one seen so far. Without a value, it defaults to 5 minutes
   * on the client and `Infinity` on the server.
   * @param newGcTime - The `gcTime` from the latest options, if any.
   */
  protected updateGcTime(newGcTime: number | undefined): void {
    // Default to 5 minutes (Infinity for server-side) if no gcTime is set
    this.gcTime = Math.max(
      this.gcTime || 0,
      newGcTime ?? (isServerEnvironment() ? Infinity : 5 * 60 * 1000),
    )
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
