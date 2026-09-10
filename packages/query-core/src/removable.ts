import { timeoutManager } from './timeoutManager'
import { isServer as isServerEnvironment } from './environmentManager'
import { isValidTimeout } from './utils'
import type { ManagedTimerId } from './timeoutManager'

/**
 * Abstract base class for garbage collection: `Query` and `Mutation` extend it
 * to remove themselves from their cache after `gcTime` milliseconds of
 * inactivity.
 */
export abstract class Removable {
  /**
   * Time in milliseconds after which an inactive instance is removed by
   * garbage collection. Managed via `updateGcTime`, which only ever raises it.
   */
  gcTime!: number
  #gcTimeout?: ManagedTimerId

  /**
   * `destroy` cancels a scheduled garbage collection, if one is pending.
   * Subclasses can extend it as part of their removal lifecycle — e.g.
   * `Query#destroy` also cancels in-flight fetches.
   */
  destroy(): void {
    this.clearGcTimeout()
  }

  /**
   * `scheduleGc` schedules the instance for removal after `gcTime`
   * milliseconds, replacing any previously scheduled removal. If `gcTime` is
   * not a valid timeout (e.g. `Infinity`), no garbage collection is scheduled.
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
   * `updateGcTime` raises `gcTime` to the given value in milliseconds, keeping
   * the previous value if it was larger. If no value is passed, it defaults to
   * 5 minutes, or `Infinity` on the server, which disables garbage collection.
   */
  protected updateGcTime(newGcTime: number | undefined): void {
    // Default to 5 minutes (Infinity for server-side) if no gcTime is set
    this.gcTime = Math.max(
      this.gcTime || 0,
      newGcTime ?? (isServerEnvironment() ? Infinity : 5 * 60 * 1000),
    )
  }

  /**
   * `clearGcTimeout` cancels a scheduled garbage collection, if one is pending.
   */
  protected clearGcTimeout() {
    if (this.#gcTimeout !== undefined) {
      timeoutManager.clearTimeout(this.#gcTimeout)
      this.#gcTimeout = undefined
    }
  }

  /**
   * Removes the instance from the cache that holds it. Called when a scheduled
   * garbage collection fires; subclasses must implement it.
   */
  protected abstract optionalRemove(): void
}
