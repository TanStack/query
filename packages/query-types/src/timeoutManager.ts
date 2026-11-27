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
    /**
     * Schedules `callback` to run once after `delay` milliseconds, like the global `setTimeout`.
     */
    readonly setTimeout: (callback: TimeoutCallback, delay: number) => TTimerId
    /**
     * Cancels a timeout scheduled with `setTimeout`.
     */
    readonly clearTimeout: (timeoutId: TTimerId | undefined) => void

    /**
     * Schedules `callback` to run every `delay` milliseconds, like the global `setInterval`.
     */
    readonly setInterval: (callback: TimeoutCallback, delay: number) => TTimerId
    /**
     * Cancels an interval scheduled with `setInterval`.
     */
    readonly clearInterval: (intervalId: TTimerId | undefined) => void
  }

export type SystemTimerId = ReturnType<typeof setTimeout>
