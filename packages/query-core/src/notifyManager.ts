type BatchCallsCallback<T extends Array<unknown>> = (...args: T) => void

type NotifyCallback = () => void

type NotifyFunction = (callback: () => void) => void

type ScheduleFunction = (callback: () => void) => void

const batchNotify = Symbol()

/**
 * Default scheduling function used by the notify manager.
 * Schedules the callback in a microtask with `queueMicrotask`.
 */
export const defaultScheduler: ScheduleFunction = queueMicrotask

/**
 * Creates a notify manager, which schedules and batches notifications to subscribers. Query uses a
 * single instance of it, exported as {@link notifyManager}.
 * @returns A new notify manager.
 */
export function createNotifyManager() {
  let queue: Array<NotifyCallback> = []
  let transactions = 0
  let notifyFn: NotifyFunction = (callback) => {
    callback()
  }
  let batchNotifyFn: NotifyFunction = notifyFn
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
          originalQueue.forEach((callback) => notifyFn(callback))
        })
      })
    }
  }

  const manager = {
    [batchNotify]: (fn: NotifyFunction) => {
      batchNotifyFn = fn
    },
    /**
     * Batches all updates scheduled inside the passed callback.
     * This is mainly used internally to optimize query client updating.
     * Batches can be nested; the queue is only flushed once the outermost `batch` call finishes.
     * The return value of `callback` is passed through.
     * @param callback - The function to run in the batch.
     * @returns The return value of `callback`.
     */
    batch: <T>(callback: () => T): T => {
      transactions++
      try {
        return callback()
      } finally {
        transactions--
        if (!transactions) {
          flush()
        }
      }
    },
    /**
     * All calls to the wrapped function will be batched.
     * @param callback - The function to wrap.
     * @returns A function that schedules a call to `callback` with the given arguments.
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
     * By default, the batch runs in a microtask. Use `setScheduler` to change when it runs.
     */
    schedule,
    /**
     * Use this method to set a custom notify function.
     * This can be used to for example wrap notifications with `React.act` while running tests.
     * @param fn - Receives each notification callback and must call it.
     */
    setNotifyFunction: (fn: NotifyFunction) => {
      notifyFn = fn
    },
    /**
     * Configures a custom callback that schedules when the next batch runs.
     * The default behavior is `queueMicrotask(callback)`.
     * @param fn - Receives a callback that runs the next batch, and schedules it.
     * @example
     * ```ts
     * import { notifyManager } from '@tanstack/query-core'
     *
     * // Use the v5 timer-based scheduler
     * notifyManager.setScheduler((cb) => setTimeout(cb, 0))
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
  return manager
}

/**
 * Configures the framework batching primitive around each flush of queued notifications.
 * @param manager - The notification manager used by the adapter.
 * @param batch - Runs all queued notifications within one framework update.
 */
export function setBatchNotifyFunction(
  manager: ReturnType<typeof createNotifyManager>,
  batch: NotifyFunction,
): void {
  manager[batchNotify](batch)
}

// SINGLETON

/**
 * Handles scheduling and batching callbacks in TanStack Query.
 */
export const notifyManager = createNotifyManager()
