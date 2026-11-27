import { timeoutManager } from '@tanstack/query-core'
import { noop } from './utils'

/**
 * Waits for a throttle delay even when the timeout provider skips scheduling.
 * @param delay - The time to wait, in milliseconds.
 * @returns A promise that resolves once the delay elapses.
 */
function waitForThrottle(delay: number): Promise<void> {
  return new Promise((resolve) => {
    if (timeoutManager.setTimeout(resolve, delay) === undefined) {
      setTimeout(resolve, delay)
    }
  })
}

interface AsyncThrottleOptions {
  interval?: number
  onError?: (error: unknown) => void
}

/**
 * Wraps an async function so it runs at most once per `interval`, never concurrently, and with the
 * arguments of the latest call. Calls made while a run is scheduled only update those arguments.
 * @param func - The async function to throttle.
 * @param options - The `interval` between runs in milliseconds, and `onError`, called when `func`
 * rejects.
 * @returns The throttled function.
 * @throws {Error} If `func` is not a function.
 */
export function asyncThrottle<TArgs extends ReadonlyArray<unknown>>(
  func: (...args: TArgs) => Promise<void>,
  { interval = 1000, onError = noop }: AsyncThrottleOptions = {},
) {
  if (typeof func !== 'function') throw new Error('argument is not function.')

  let nextExecutionTime = 0
  let lastArgs = null
  let isExecuting = false
  let isScheduled = false

  return async (...args: TArgs) => {
    lastArgs = args
    if (isScheduled) return
    isScheduled = true
    while (isExecuting) {
      await waitForThrottle(interval)
    }
    while (Date.now() < nextExecutionTime) {
      await waitForThrottle(nextExecutionTime - Date.now())
    }
    isScheduled = false
    isExecuting = true
    try {
      await func(...lastArgs)
    } catch (error) {
      try {
        onError(error)
      } catch {}
    }
    nextExecutionTime = Date.now() + interval
    isExecuting = false
  }
}
