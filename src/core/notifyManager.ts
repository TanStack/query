import { scheduleMicrotask } from './utils'

// TYPES

type NotifyCallback = () => void

type BatchUpdateFunction = (callback: () => void) => void

// CLASS

export class NotifyManager {
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
        notify()
      })
    }
  }

  flush(): void {
    const queue = this.queue
    this.queue = []
    if (queue.length) {
      scheduleMicrotask(() => {
        const batchedUpdates = getBatchedUpdates()
        batchedUpdates(() => {
          queue.forEach(notify => {
            notify()
          })
        })
      })
    }
  }
}

// GETTERS AND SETTERS

// Default to a dummy "batch" implementation that just runs the callback
let batchedUpdates: BatchUpdateFunction = (callback: () => void) => {
  callback()
}

// Allow injecting another batching function later
export function setBatchedUpdates(fn: BatchUpdateFunction) {
  batchedUpdates = fn
}

// Supply a getter just to skip dealing with ESM bindings
export function getBatchedUpdates(): BatchUpdateFunction {
  return batchedUpdates
}

// SINGLETON

export const notifyManager = new NotifyManager()
