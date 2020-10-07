import { scheduleMicrotask } from './utils'

// TYPES

type NotifyCallback = () => void

type NotifyFunction = (callback: () => void) => void

type BatchNotifyFunction = (callback: () => void) => void

// GETTERS AND SETTERS

// Default to a dummy "notify" implementation that just runs the callback
let notifyFn: NotifyFunction = (callback: () => void) => {
  callback()
}

// Default to a dummy "batch notify" implementation that just runs the callback
let batchNotifyFn: BatchNotifyFunction = (callback: () => void) => {
  callback()
}

/**
 * Use this function to set a custom notify function.
 * This can be used to for example wrap notifications with `React.act` while running tests.
 */
export function setNotifyFn(fn: NotifyFunction) {
  notifyFn = fn
}

/**
 * Use this function to set a custom function to batch notifications together into a single tick.
 * By default React Query will use the batch function provided by ReactDOM or React Native.
 */
export function setBatchNotifyFn(fn: BatchNotifyFunction) {
  batchNotifyFn = fn
}

// CLASS

class NotifyManager {
  private queue: NotifyCallback[]
  private transactions: number

  constructor() {
    this.queue = []
    this.transactions = 0
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
        notifyFn(callback)
      })
    }
  }

  flush(): void {
    const queue = this.queue
    this.queue = []
    if (queue.length) {
      scheduleMicrotask(() => {
        batchNotifyFn(() => {
          queue.forEach(callback => {
            notifyFn(callback)
          })
        })
      })
    }
  }
}

// SINGLETON

export const notifyManager = new NotifyManager()
