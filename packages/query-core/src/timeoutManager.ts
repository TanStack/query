/**
 * Wrapping `setTimeout` is awkward from a typing perspective because platform
 * typings may extend the return type of `setTimeout`. For example, NodeJS
 * typings add `NodeJS.Timeout`; but a non-default `timeoutManager` may not be
 * able to return such a type.
 *
 * Still, we can downlevel `NodeJS.Timeout` to `number` as it implements
 * Symbol.toPrimitive.
 */
export type TimeoutProviderId = number | { [Symbol.toPrimitive]: () => number }

export type TimeoutProvider = {
  setTimeout: (callback: () => void, delay: number) => TimeoutProviderId
  clearTimeout: (timeoutId: number | undefined) => void
}

const defaultTimeoutProvider: TimeoutProvider = {
  setTimeout: (callback, delay) => setTimeout(callback, delay),
  clearTimeout: (timeoutId) => clearTimeout(timeoutId),
}

/**
 * Allows customization of how timeouts are created.
 *
 * @tanstack/query-core makes liberal use of timeouts to implement `staleTime`
 * and `gcTime`. The default TimeoutManager provider uses the platform's global
 * `setTimeout` implementation, which is known to have scalability issues with
 * thousands of timeouts on the event loop.
 *
 * If you hit this limitation, consider providing a custom TimeoutProvider that
 * coalesces timeouts.
 */
export class TimeoutManager implements TimeoutProvider {
  #provider: TimeoutProvider = defaultTimeoutProvider
  #setTimeoutCalls = 0

  setTimeoutProvider(provider: TimeoutProvider): void {
    if (this.#setTimeoutCalls > 0) {
      // After changing providers, `clearTimeout` will not work as expected for
      // timeouts from the previous provider.
      //
      // Since they may allocate the same timeout ID, clearTimeout may cancel an
      // arbitrary different timeout, or unexpected no-op.
      //
      // We could protect against this by mixing the timeout ID bits
      // deterministically with some per-provider bits.
      //
      // We could internally queue `setTimeout` calls to `TimeoutManager` until
      // some API call to set the initial provider.
      console.warn(
        '[timeoutManager]: Provider changed after setTimeout calls were made. This might result in unexpected behavior.',
      )
    }

    this.#provider = provider
  }

  setTimeout(callback: () => void, delay: number): number {
    this.#setTimeoutCalls++
    return Number(this.#provider.setTimeout(callback, delay))
  }

  clearTimeout(timeoutId: number | undefined): void {
    this.#provider.clearTimeout(timeoutId)
  }
}

export const timeoutManager = new TimeoutManager()

// Exporting functions that use `setTimeout` to reduce bundle size impact, since
// method names on objects are usually not minified.

/** A version of `setTimeout` that uses {@link timeoutManager} to set the timeout. */
export function managedSetTimeout(callback: () => void, delay: number): number {
  return timeoutManager.setTimeout(callback, delay)
}

/** A version of `clearTimeout` that uses {@link timeoutManager} to set the timeout. */
export function managedClearTimeout(timeoutId: number | undefined): void {
  timeoutManager.clearTimeout(timeoutId)
}
