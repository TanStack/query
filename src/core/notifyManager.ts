import { scheduleMicrotask } from './utils'

// TYPES

type NotifyCallback = () => void

type UpdateFunction = (callback: () => void) => void

type BatchUpdatesFunction = (callback: () => void) => void

// GETTERS AND SETTERS

// Default to a dummy "update" implementation that just runs the callback
let updateFn: UpdateFunction = (callback: () => void) => {
  callback()
}

// Default to a dummy "batch update" implementation that just runs the callback
let batchUpdatesFn: BatchUpdatesFunction = (callback: () => void) => {
  callback()
}

/**
 * Use this function to set a custom update function.
 * This can be used to for example wrap updates with `React.act` while running tests.
 */
export function setUpdateFn(fn: UpdateFunction) {
  updateFn = fn
}

/**
 * Use this function to set a custom batch function to batch updates together into a single render pass.
 * By default React Query will use the batch function provided by ReactDOM or React Native.
 */
export function setBatchUpdatesFn(fn: BatchUpdatesFunction) {
  batchUpdatesFn = fn
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

  schedule(notify: NotifyCallback): void {
    if (this.transactions) {
      this.queue.push(notify)
    } else {
      scheduleMicrotask(() => {
        updateFn(notify)
      })
    }
  }

  flush(): void {
    const queue = this.queue
    this.queue = []
    if (queue.length) {
      scheduleMicrotask(() => {
        batchUpdatesFn(() => {
          queue.forEach(notify => {
            updateFn(notify)
          })
        })
      })
    }
  }
}

// SINGLETON

export const notifyManager = new NotifyManager()
