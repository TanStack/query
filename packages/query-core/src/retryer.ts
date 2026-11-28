import { isServer as isServerEnvironment } from './environmentManager'
import { focusManager } from './focusManager'
import { onlineManager } from './onlineManager'
import { noop, sleep } from './utils'
import type { CancelOptions, DefaultError, NetworkMode } from './types'

// TYPES

interface RetryerConfig<TData = unknown, TError = DefaultError> {
  fn: () => TData | Promise<TData>
  initialPromise?: Promise<TData>
  onCancel?: (error: TError) => void
  onFail?: (failureCount: number, error: TError) => void
  onPause?: () => void
  onContinue?: () => void
  retry?: RetryValue<TError>
  retryDelay?: RetryDelayValue<TError>
  networkMode: NetworkMode | undefined
  canRun: () => boolean
}

/**
 * Runs a function with retries, and can pause, continue, or cancel it. Queries and mutations use
 * one for each fetch or execution.
 */
export interface Retryer<TData = unknown> {
  /**
   * The promise that resolves with the data, or rejects once retries are exhausted or it is
   * cancelled.
   */
  promise: Promise<TData>
  /**
   * Cancels the run, rejecting `promise` with a `CancelledError`.
   */
  cancel: (cancelOptions?: CancelOptions) => void
  /**
   * Resumes a paused run, and returns `promise`.
   */
  continue: () => Promise<unknown>
  /**
   * Stops further retries. The current attempt still finishes.
   */
  cancelRetry: () => void
  /**
   * Allows retries again after `cancelRetry`.
   */
  continueRetry: () => void
  /**
   * Returns whether the run can start now, based on the network mode and `canRun`.
   */
  canStart: () => boolean
  /**
   * Starts the run, or waits until it can start, and returns `promise`.
   */
  start: () => Promise<TData>
  /**
   * Returns whether `promise` is still pending, resolved, or rejected.
   */
  status: () => 'pending' | 'resolved' | 'rejected'
}

type RetryerStatus = 'pending' | 'resolved' | 'rejected'

/** @inline */
export type RetryValue<TError> = boolean | number | ShouldRetryFunction<TError>

/** @inline */
type ShouldRetryFunction<TError = DefaultError> = (
  failureCount: number,
  error: TError,
) => boolean

/** @inline */
export type RetryDelayValue<TError> = number | RetryDelayFunction<TError>

/** @inline */
type RetryDelayFunction<TError = DefaultError> = (
  failureCount: number,
  error: TError,
) => number

/**
 * Applies exponential backoff with jitter. The base delay starts at 1 second
 * and doubles for each retry, up to 30 seconds.
 * @param failureCount - The number of previous failures. Starts at 0 for the first retry.
 * @returns A random delay from 80% to 100% of the base delay, in milliseconds.
 */
function defaultRetryDelay(failureCount: number) {
  const baseDelay = Math.min(1000 * 2 ** failureCount, 30000)
  const maxJitter = baseDelay * 0.2
  return baseDelay - Math.floor(Math.random() * (maxJitter + 1))
}

/**
 * Checks whether a fetch can run for the given network mode.
 * @param networkMode - The `networkMode` option. Defaults to `'online'`.
 * @returns `true` if the network mode is not `'online'`, or if it is and the client is online.
 */
export function canFetch(networkMode: NetworkMode | undefined): boolean {
  return (networkMode ?? 'online') === 'online'
    ? onlineManager.isOnline()
    : true
}

/**
 * The error thrown by a `Retryer` (and surfaced to `query.promise`/`mutation`) when a fetch is cancelled, e.g. via
 * `query.cancel()`. `revert`, if `true`, tells the caller to restore the state the query was in before the fetch
 * started instead of surfacing the error. `silent`, if `true`, tells the caller to suppress this error and instead
 * resolve with the promise of the fetch that triggered the cancellation.
 * @example
 * ```ts
 * query.cancel()
 *
 * try {
 *   await query.promise
 * } catch (error) {
 *   if (error instanceof CancelledError) {
 *     // the fetch was cancelled, e.g. via `query.cancel()`
 *   }
 * }
 * ```
 */
export class CancelledError extends Error {
  revert?: boolean
  silent?: boolean
  constructor(options?: CancelOptions) {
    super('CancelledError')
    this.revert = options?.revert
    this.silent = options?.silent
  }
}

/**
 * Creates a retryer, which runs a function and retries it on failure according to the `retry` and
 * `retryDelay` options. It pauses while the network mode doesn't allow fetching or `canRun` returns
 * `false`, and can be cancelled. Queries and mutations use it to run their `queryFn` and
 * `mutationFn`.
 * @param config - The function to run, the retry options, and the callbacks for failures, pausing,
 * continuing, and cancellation.
 * @returns The retryer, whose `promise` settles with the result of the function.
 */
export function createRetryer<TData = unknown, TError = DefaultError>(
  config: RetryerConfig<TData, TError>,
): Retryer<TData> {
  let isRetryCancelled = false
  let failureCount = 0
  let continueFn: (() => void) | undefined
  let status: RetryerStatus = 'pending'
  const {
    promise,
    resolve: promiseResolve,
    reject: promiseReject,
  } = Promise.withResolvers<TData>()
  promise.catch(noop)

  const isResolved = () => status !== 'pending'

  const cancel = (cancelOptions?: CancelOptions): void => {
    if (!isResolved()) {
      const error = new CancelledError(cancelOptions) as TError
      settle('rejected', error)

      config.onCancel?.(error)
    }
  }
  const cancelRetry = () => {
    isRetryCancelled = true
  }

  const continueRetry = () => {
    isRetryCancelled = false
  }

  const canContinue = () =>
    focusManager.isFocused() &&
    (config.networkMode === 'always' || onlineManager.isOnline()) &&
    config.canRun()

  const canStart = () => canFetch(config.networkMode) && config.canRun()

  const settle = (next: 'rejected' | 'resolved', value: unknown) => {
    if (isResolved()) return
    continueFn?.()
    status = next
    if (next === 'rejected') promiseReject(value)
    else promiseResolve(value as TData)
  }

  const pause = async (canResume: () => boolean) => {
    const gate = Promise.withResolvers<void>()
    continueFn = () => {
      if (isResolved() || canResume()) gate.resolve()
    }
    config.onPause?.()
    await gate.promise
    continueFn = undefined
    if (!isResolved()) config.onContinue?.()
  }

  // Convert synchronous exceptions to rejected promises, like async query functions.
  const attempt = async () =>
    (failureCount === 0 ? config.initialPromise : undefined) ?? config.fn()

  const run = async () => {
    while (!isResolved()) {
      let data: TData
      try {
        data = await attempt()
      } catch (cause) {
        if (isResolved()) return
        const error = cause as TError
        const retry = config.retry ?? (isServerEnvironment() ? 0 : 3)
        const retryDelay = config.retryDelay ?? defaultRetryDelay
        const delay =
          typeof retryDelay === 'function'
            ? retryDelay(failureCount, error)
            : retryDelay
        const shouldRetry =
          retry === true ||
          (typeof retry === 'number' && failureCount < retry) ||
          (typeof retry === 'function' && retry(failureCount, error))

        if (isRetryCancelled || !shouldRetry) {
          settle('rejected', error)
          return
        }
        failureCount++
        config.onFail?.(failureCount, error)
        await sleep(delay)
        if (!isResolved() && !canContinue()) await pause(canContinue)
        // oxlint-disable-next-line typescript/no-unnecessary-condition -- cancelRetry can run while the delay or pause is pending.
        if (isRetryCancelled) settle('rejected', error)
        continue
      }
      settle('resolved', data)
    }
  }

  return {
    promise,
    status: () => status,
    cancel,
    continue: () => {
      continueFn?.()
      return promise
    },
    cancelRetry,
    continueRetry,
    canStart,
    start: () => {
      // Start loop
      if (canStart()) {
        run()
      } else {
        // Waiting to start (e.g. queued behind a scope) does not depend on focus,
        // only on the same conditions that allow starting in the first place
        pause(canStart).then(run)
      }
      return promise
    },
  }
}
