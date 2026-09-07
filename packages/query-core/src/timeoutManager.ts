/**
 * {@link TimeoutManager} does not support passing arguments to the callback.
 *
 * `(_: void)` is the argument type inferred by TypeScript's default typings for
 * `setTimeout(cb, number)`.
 * If we don't accept a single void argument, then
 * `new Promise(resolve => timeoutManager.setTimeout(resolve, N))` is a type error.
 */
export type TimeoutCallback = (_: void) => void

/**
 * Wrapping `setTimeout` is awkward from a typing perspective because platform
 * typings may extend the return type of `setTimeout`. For example, NodeJS
 * typings add `NodeJS.Timeout`; but a non-default `timeoutManager` may not be
 * able to return such a type.
 */
export type ManagedTimerId = number | { [Symbol.toPrimitive]: () => number }

/**
 * Backend for timer functions.
 *
 * Timers are performance-sensitive: short-lived timers (delays under a few seconds) tend to be
 * latency-sensitive, while long-lived ones may benefit more from coalescing — batching timers
 * with similar deadlines together — which the default provider (backed by the platform's global
 * `setTimeout`/`setInterval`) does not do. A custom provider can implement coalescing, and can
 * also support delays longer than the ~24-day maximum of the global `setTimeout`.
 */
export type TimeoutProvider<TTimerId extends ManagedTimerId = ManagedTimerId> =
  {
    readonly setTimeout: (callback: TimeoutCallback, delay: number) => TTimerId
    readonly clearTimeout: (timeoutId: TTimerId | undefined) => void

    readonly setInterval: (callback: TimeoutCallback, delay: number) => TTimerId
    readonly clearInterval: (intervalId: TTimerId | undefined) => void
  }

type SystemTimerId = ReturnType<typeof setTimeout>

export const defaultTimeoutProvider: TimeoutProvider = {
  // We need the wrapper function syntax below instead of direct references to
  // global setTimeout etc.
  //
  // BAD: `setTimeout: setTimeout`
  // GOOD: `setTimeout: (cb, delay) => setTimeout(cb, delay)`
  //
  // If we use direct references here, then anything that wants to spy on or
  // replace the global setTimeout (like tests) won't work since we'll already
  // have a hard reference to the original implementation at the time when this
  // file was imported.
  setTimeout: (callback, delay) => setTimeout(callback, delay),
  clearTimeout: (timeoutId) =>
    clearTimeout(timeoutId as SystemTimerId | undefined),

  setInterval: (callback, delay) => setInterval(callback, delay),
  clearInterval: (intervalId) =>
    clearInterval(intervalId as SystemTimerId | undefined),
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
export class TimeoutManager implements Omit<TimeoutProvider, 'name'> {
  // We cannot have TimeoutManager<T> as we must instantiate it with a concrete
  // type at app boot; and if we leave that type, then any new timer provider
  // would need to support the default provider's concrete timer ID, which is
  // infeasible across environments.
  //
  // We settle for type safety for the TimeoutProvider type, and accept that
  // this class is unsafe internally to allow for extension.
  #provider: TimeoutProvider<any> = defaultTimeoutProvider
  #providerCalled = false

  /**
   * `setTimeoutProvider` can be used to set a custom implementation of the
   * `setTimeout`, `clearTimeout`, `setInterval`, `clearInterval` functions,
   * called a `TimeoutProvider`.
   *
   * This may be useful if you notice event loop performance issues with
   * thousands of queries. A custom TimeoutProvider could also support timer
   * delays longer than the global `setTimeout` maximum delay value of about
   * 24 days.
   *
   * It is important to call `setTimeoutProvider` before creating a
   * QueryClient or queries, so that the same provider is used consistently
   * for all timers in the application, since different TimeoutProviders
   * cannot cancel each others' timers.
   *
   * @example
   * ```ts
   * import { timeoutManager, QueryClient } from '@tanstack/query-core'
   * import { CustomTimeoutProvider } from './CustomTimeoutProvider'
   *
   * timeoutManager.setTimeoutProvider(new CustomTimeoutProvider())
   *
   * export const queryClient = new QueryClient()
   * ```
   */
  setTimeoutProvider<TTimerId extends ManagedTimerId>(
    provider: TimeoutProvider<TTimerId>,
  ): void {
    if (process.env.NODE_ENV !== 'production') {
      if (this.#providerCalled && provider !== this.#provider) {
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
          `[timeoutManager]: Switching provider after calls to previous provider might result in unexpected behavior.`,
          { previous: this.#provider, provider },
        )
      }
    }

    this.#provider = provider
    if (process.env.NODE_ENV !== 'production') {
      this.#providerCalled = false
    }
  }

  /**
   * `setTimeout` schedules a callback to run after approximately `delay`
   * milliseconds, like the global `setTimeout` function. The callback can be
   * canceled with `clearTimeout`.
   *
   * It returns a timer ID, which may be a number or an object that can be
   * coerced to a number via `Symbol.toPrimitive`.
   *
   * @example
   * ```ts
   * import { timeoutManager } from '@tanstack/query-core'
   *
   * const timeoutId = timeoutManager.setTimeout(
   *   () => console.log('ran at:', new Date()),
   *   1000,
   * )
   *
   * const timeoutIdNumber: number = Number(timeoutId)
   * ```
   */
  setTimeout(callback: TimeoutCallback, delay: number): ManagedTimerId {
    if (process.env.NODE_ENV !== 'production') {
      this.#providerCalled = true
    }
    return this.#provider.setTimeout(callback, delay)
  }

  /**
   * `clearTimeout` cancels a timeout callback scheduled with `setTimeout`,
   * like the global `clearTimeout` function. It should be called with a
   * timer ID returned by `setTimeout`.
   *
   * @example
   * ```ts
   * import { timeoutManager } from '@tanstack/query-core'
   *
   * const timeoutId = timeoutManager.setTimeout(
   *   () => console.log('ran at:', new Date()),
   *   1000,
   * )
   *
   * timeoutManager.clearTimeout(timeoutId)
   * ```
   */
  clearTimeout(timeoutId: ManagedTimerId | undefined): void {
    this.#provider.clearTimeout(timeoutId)
  }

  /**
   * `setInterval` schedules a callback to be called approximately every
   * `delay` milliseconds, like the global `setInterval` function.
   *
   * Like `setTimeout`, it returns a timer ID, which may be a number or an
   * object that can be coerced to a number via `Symbol.toPrimitive`.
   *
   * @example
   * ```ts
   * import { timeoutManager } from '@tanstack/query-core'
   *
   * const intervalId = timeoutManager.setInterval(
   *   () => console.log('ran at:', new Date()),
   *   1000,
   * )
   * ```
   */
  setInterval(callback: TimeoutCallback, delay: number): ManagedTimerId {
    if (process.env.NODE_ENV !== 'production') {
      this.#providerCalled = true
    }
    return this.#provider.setInterval(callback, delay)
  }

  /**
   * `clearInterval` can be used to cancel an interval, like the global
   * `clearInterval` function. It should be called with an interval ID
   * returned by `setInterval`.
   *
   * @example
   * ```ts
   * import { timeoutManager } from '@tanstack/query-core'
   *
   * const intervalId = timeoutManager.setInterval(
   *   () => console.log('ran at:', new Date()),
   *   1000,
   * )
   *
   * timeoutManager.clearInterval(intervalId)
   * ```
   */
  clearInterval(intervalId: ManagedTimerId | undefined): void {
    this.#provider.clearInterval(intervalId)
  }
}

/**
 * Singleton instance of {@link TimeoutManager}, used throughout TanStack Query to schedule and cancel timers.
 */
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
