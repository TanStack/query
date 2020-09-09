import { getBatchedUpdates, scheduleMicrotask } from './utils'

// TYPES

type NotifyCallback = () => void

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

// SINGLETON

export const notifyManager = new NotifyManager()
