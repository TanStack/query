// TYPES

type NotifyCallback = () => void

type NotifyFunction = (callback: () => void) => void

type BatchNotifyFunction = (callback: () => void) => void

type BatchCallsCallback<T extends Array<unknown>> = (...args: T) => void

type ScheduleFunction = (callback: () => void) => void

type BatchMethod =
  | { type: 'raf' | 'tick' }
  | { type: 'timer'; timeout?: number }
  | { type: 'custom'; fn: ScheduleFunction }

export function createNotifyManager() {
  let queue: Array<NotifyCallback> = []
  let transactions = 0
  let notifyFn: NotifyFunction = (callback) => {
    callback()
  }
  let batchNotifyFn: BatchNotifyFunction = (callback: () => void) => {
    callback()
  }
  let scheduleFn: ScheduleFunction

  const setBatchMethod = (method: BatchMethod) => {
    if (method.type === 'tick') {
      scheduleFn = queueMicrotask
    } else if (method.type === 'raf') {
      scheduleFn = requestAnimationFrame
    } else if (method.type === 'timer') {
      scheduleFn = (cb) => setTimeout(cb, method.timeout ?? 0)
      // Disable because condition is necessary for typescript to detect method.fn
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    } else if (method.type === 'custom') {
      scheduleFn = method.fn
    }
  }

  setBatchMethod({ type: 'timer', timeout: 0 })

  const batch = <T>(callback: () => T): T => {
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
  }

  const schedule = (callback: NotifyCallback): void => {
    if (transactions) {
      queue.push(callback)
    } else {
      scheduleFn(() => {
        notifyFn(callback)
      })
    }
  }

  /**
   * All calls to the wrapped function will be batched.
   */
  const batchCalls = <T extends Array<unknown>>(
    callback: BatchCallsCallback<T>,
  ): BatchCallsCallback<T> => {
    return (...args) => {
      schedule(() => {
        callback(...args)
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

  /**
   * Use this method to set a custom notify function.
   * This can be used to for example wrap notifications with `React.act` while running tests.
   */
  const setNotifyFunction = (fn: NotifyFunction) => {
    notifyFn = fn
  }

  /**
   * Use this method to set a custom function to batch notifications together into a single tick.
   * By default React Query will use the batch function provided by ReactDOM or React Native.
   */
  const setBatchNotifyFunction = (fn: BatchNotifyFunction) => {
    batchNotifyFn = fn
  }

  return {
    batch,
    batchCalls,
    schedule,
    setNotifyFunction,
    setBatchNotifyFunction,
    setBatchMethod,
  } as const
}

// SINGLETON
export const notifyManager = createNotifyManager()
