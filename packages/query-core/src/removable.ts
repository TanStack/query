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

  protected scheduleGc(): void {
    this.clearGcTimeout()

    if (isValidTimeout(this.gcTime)) {
      this.#gcTimeout = timeoutManager.setTimeout(() => {
        this.optionalRemove()
      }, this.gcTime)
    }
  }

  protected updateGcTime(newGcTime: number | undefined): void {
    // Default to 5 minutes (Infinity for server-side) if no gcTime is set
    this.gcTime = Math.max(
      this.gcTime || 0,
      newGcTime ?? (isServerEnvironment() ? Infinity : 5 * 60 * 1000),
    )
  }

  protected clearGcTimeout() {
    if (this.#gcTimeout !== undefined) {
      timeoutManager.clearTimeout(this.#gcTimeout)
      this.#gcTimeout = undefined
    }
  }

  protected abstract optionalRemove(): void
}
