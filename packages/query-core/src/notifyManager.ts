type NotifyCallback = () => void
type NotifyFunction = (callback: () => void) => void
type BatchNotifyFunction = (callback: () => void) => void
type BatchCallsCallback<T extends Array<unknown>> = (...args: T) => void
type ScheduleFunction = (callback: () => void) => void

export class NotifyManager {
  #queue: Array<NotifyCallback> = []
  #transactions = 0
  #notifyFn: NotifyFunction = (callback) => {
    callback()
  }
  #batchNotifyFn: BatchNotifyFunction = (callback: () => void) => {
    callback()
  }
  #scheduleFn: ScheduleFunction = (callback) => setTimeout(callback, 0)
  #flush = () => {
    const originalQueue = this.#queue
    this.#queue = []
    if (originalQueue.length) {
      this.#scheduleFn(() => {
        this.#batchNotifyFn(() => {
          originalQueue.forEach((callback) => {
            this.#notifyFn(callback)
          })
        })
      })
    }
  }

  setScheduler = (fn: ScheduleFunction) => {
    this.#scheduleFn = fn
  }

  batch = <T>(callback: () => T): T => {
    let result
    this.#transactions++
    try {
      result = callback()
    } finally {
      this.#transactions--
      if (!this.#transactions) {
        this.#flush()
      }
    }
    return result
  }

  schedule = (callback: NotifyCallback): void => {
    if (this.#transactions) {
      this.#queue.push(callback)
    } else {
      this.#scheduleFn(() => {
        this.#notifyFn(callback)
      })
    }
  }

  /**
   * All calls to the wrapped function will be batched.
   */
  batchCalls = <T extends Array<unknown>>(
    callback: BatchCallsCallback<T>,
  ): BatchCallsCallback<T> => {
    return (...args) => {
      this.schedule(() => {
        callback(...args)
      })
    }
  }

  /**
   * Use this method to set a custom notify function.
   * This can be used to for example wrap notifications with `React.act` while running tests.
   */
  setNotifyFunction = (fn: NotifyFunction) => {
    this.#notifyFn = fn
  }

  /**
   * Use this method to set a custom function to batch notifications together into a single tick.
   * By default React Query will use the batch function provided by ReactDOM or React Native.
   */
  setBatchNotifyFunction = (fn: BatchNotifyFunction) => {
    this.#batchNotifyFn = fn
  }
}

// SINGLETON
export const notifyManager = new NotifyManager()
