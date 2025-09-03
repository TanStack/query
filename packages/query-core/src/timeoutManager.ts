/**
 * Timeout manager does not support passing arguments to the callback.
 * (`void` is the argument type inferred by TypeScript's default typings for `setTimeout(cb, number)`)
 */
export type TimeoutCallback = (_: void) => void

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

/**
 * Backend for timer functions.
 */
export type TimeoutProvider = {
  /** Used in error messages. */
  readonly name: string

  readonly setTimeout: (
    callback: TimeoutCallback,
    delay: number,
  ) => TimeoutProviderId
  readonly clearTimeout: (timeoutId: number | undefined) => void

  readonly setInterval: (
    callback: TimeoutCallback,
    delay: number,
  ) => TimeoutProviderId
  readonly clearInterval: (intervalId: number | undefined) => void
}

export const defaultTimeoutProvider: TimeoutProvider = {
  name: 'default',

  setTimeout: (callback, delay) => setTimeout(callback, delay),
  clearTimeout: (timeoutId) => clearTimeout(timeoutId),

  setInterval: (callback, delay) => setInterval(callback, delay),
  clearInterval: (intervalId) => clearInterval(intervalId),
}

/** Timeout ID returned by {@link TimeoutManager} */
export type ManagedTimerId = number

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
export class TimeoutManager implements Omit<TimeoutProvider, 'name'> {
  #provider: TimeoutProvider = defaultTimeoutProvider
  #providerCalled = false

  setTimeoutProvider(provider: TimeoutProvider): void {
    if (provider === this.#provider) {
      return
    }

    if (process.env.NODE_ENV !== 'production') {
      if (this.#providerCalled) {
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
        console.error(
          `[timeoutManager]: Switching to ${provider.name} provider after calls to ${this.#provider.name} provider might result in unexpected behavior.`,
        )
      }
    }

    this.#provider = provider
    if (process.env.NODE_ENV !== 'production') {
      this.#providerCalled = false
    }
  }

  setTimeout(callback: TimeoutCallback, delay: number): ManagedTimerId {
    if (process.env.NODE_ENV !== 'production') {
      this.#providerCalled = true
    }
    return providerIdToNumber(
      this.#provider,
      this.#provider.setTimeout(callback, delay),
    )
  }

  clearTimeout(timeoutId: ManagedTimerId | undefined): void {
    this.#provider.clearTimeout(timeoutId)
  }

  setInterval(callback: TimeoutCallback, delay: number): ManagedTimerId {
    if (process.env.NODE_ENV !== 'production') {
      this.#providerCalled = true
    }
    return providerIdToNumber(
      this.#provider,
      this.#provider.setInterval(callback, delay),
    )
  }

  clearInterval(intervalId: ManagedTimerId | undefined): void {
    this.#provider.clearInterval(intervalId)
  }
}

export const timeoutManager = new TimeoutManager()

/**
 * In many cases code wants to delay to the next event loop tick; this is not
 * mediated by {@link timeoutManager}.
 *
 * This function is provided to make auditing the `tanstack/query-core` for
 * incorrect use of system `setTimeout` easier.
 */
export function systemSetTimeoutZero(callback: TimeoutCallback): void {
  setTimeout(callback, 0)
}
