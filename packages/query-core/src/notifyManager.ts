// TYPES

import { systemSetTimeoutZero } from './timeoutManager'

type NotifyCallback = () => void

type NotifyFunction = (callback: () => void) => void

type BatchNotifyFunction = (callback: () => void) => void

type BatchCallsCallback<T extends Array<unknown>> = (...args: T) => void

type ScheduleFunction = (callback: () => void) => void

/**
 * Default scheduling function used by the notify manager.
 * Schedules the callback with the system's `setTimeout(callback, 0)`.
 */
export const defaultScheduler: ScheduleFunction = systemSetTimeoutZero

export function createNotifyManager() {
  let queue: Array<NotifyCallback> = []
  let transactions = 0
  let notifyFn: NotifyFunction = (callback) => {
    callback()
  }
  let batchNotifyFn: BatchNotifyFunction = (callback: () => void) => {
    callback()
  }
  let scheduleFn = defaultScheduler

  const schedule = (callback: NotifyCallback): void => {
    if (transactions) {
      queue.push(callback)
    } else {
      scheduleFn(() => {
        notifyFn(callback)
      })
    }
  }
  const flush = (): void => {
    const originalQueue = queue
    queue = []
    if (originalQueue.length) {
      scheduleFn(() => {
        batchNotifyFn(() => {
          originalQueue.forEach((callback) => {
            notifyFn(callback)
          })
        })
      })
    }
  }

  return {
    /**
     * Batches all updates scheduled inside the passed callback.
     * This is mainly used internally to optimize query client updating.
     * Batches can be nested; the queue is only flushed once the outermost `batch` call finishes.
     * The return value of `callback` is passed through.
     */
    batch: <T>(callback: () => T): T => {
      let result
      transactions++
      try {
        result = callback()
      } finally {
        transactions--
        if (!transactions) {
          flush()
        }
      }
      return result
    },
    /**
     * All calls to the wrapped function will be batched.
     */
    batchCalls: <T extends Array<unknown>>(
      callback: BatchCallsCallback<T>,
    ): BatchCallsCallback<T> => {
      return (...args) => {
        schedule(() => {
          callback(...args)
        })
      }
    },
    /**
     * Schedules a function to be run on the next batch.
     * By default, the batch is run with a `setTimeout`, but this can be configured via `setScheduler`.
     */
    schedule,
    /**
     * Use this method to set a custom notify function.
     * This can be used to for example wrap notifications with `React.act` while running tests.
     */
    setNotifyFunction: (fn: NotifyFunction) => {
      notifyFn = fn
    },
    /**
     * Use this method to set a custom function to batch notifications together into a single tick.
     * Framework adapters use this to plug in their own batching primitive, so that a single query
     * update only triggers one re-render instead of one per subscriber.
     *
     * @example
     * ```ts
     * import { notifyManager } from '@tanstack/query-core'
     * import { batch } from 'solid-js'
     *
     * notifyManager.setBatchNotifyFunction(batch)
     * ```
     */
    setBatchNotifyFunction: (fn: BatchNotifyFunction) => {
      batchNotifyFn = fn
    },
    /**
     * Configures a custom callback that schedules when the next batch runs.
     * The default behavior is `setTimeout(callback, 0)`.
     *
     * @example
     * ```ts
     * import { notifyManager } from '@tanstack/query-core'
     *
     * // Schedule batches in the next microtask
     * notifyManager.setScheduler(queueMicrotask)
     *
     * // Schedule batches before the next frame is rendered
     * notifyManager.setScheduler(requestAnimationFrame)
     *
     * // Schedule batches some time in the future
     * notifyManager.setScheduler((cb) => setTimeout(cb, 10))
     * ```
     */
    setScheduler: (fn: ScheduleFunction) => {
      scheduleFn = fn
    },
  } as const
}

// SINGLETON

/**
 * Handles scheduling and batching callbacks in TanStack Query.
 */
export const notifyManager = createNotifyManager()
