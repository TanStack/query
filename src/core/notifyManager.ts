import { scheduleMicrotask } from './utils'

// TYPES

type NotifyCallback = () => void

type NotifyFunction = (callback: () => void) => void

type BatchNotifyFunction = (callback: () => void) => void

// CLASS

class NotifyManager {
  private queue: NotifyCallback[]
  private transactions: number
  private notifyFn: NotifyFunction
  private batchNotifyFn: BatchNotifyFunction

  constructor() {
    this.queue = []
    this.transactions = 0

    this.notifyFn = (callback: () => void) => {
      callback()
    }

    this.batchNotifyFn = (callback: () => void) => {
      callback()
    }
  }

  batch<T>(callback: () => T): T {
    this.transactions++
    const result = callback()
    this.transactions--
    if (!this.transactions) {
      this.flush()
    }
    return result
  }

  schedule(callback: NotifyCallback): void {
    if (this.transactions) {
      this.queue.push(callback)
    } else {
      scheduleMicrotask(() => {
        this.notifyFn(callback)
      })
    }
  }

  /**
   * All calls to the wrapped function will be batched.
   */
  batchCalls<T extends Function>(callback: T): T {
    return ((...args: any[]) => {
      this.schedule(() => {
        callback(...args)
      })
    }) as any
  }

  flush(): void {
    const queue = this.queue
    this.queue = []
    if (queue.length) {
      scheduleMicrotask(() => {
        this.batchNotifyFn(() => {
          queue.forEach(callback => {
            this.notifyFn(callback)
          })
        })
      })
    }
  }

  /**
   * Use this method to set a custom notify function.
   * This can be used to for example wrap notifications with `React.act` while running tests.
   */
  setNotifyFunction(fn: NotifyFunction) {
    this.notifyFn = fn
  }

  /**
   * Use this method to set a custom function to batch notifications together into a single tick.
   * By default React Query will use the batch function provided by ReactDOM or React Native.
   */
  setBatchNotifyFunction(fn: BatchNotifyFunction) {
    this.batchNotifyFn = fn
  }
}

// SINGLETON

export const notifyManager = new NotifyManager()
