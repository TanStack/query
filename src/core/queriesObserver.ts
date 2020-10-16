import { difference, getQueryKeyHashFn, replaceAt } from './utils'
import { notifyManager } from './notifyManager'
import type { QueryObserverOptions, QueryObserverResult } from './types'
import type { QueryClient } from './queryClient'
import { QueryObserver } from './queryObserver'

type QueriesObserverListener = (result: QueryObserverResult[]) => void

export class QueriesObserver {
  private client: QueryClient
  private result: QueryObserverResult[]
  private queries: QueryObserverOptions[]
  private observers: QueryObserver[]
  private listeners: QueriesObserverListener[]

  constructor(client: QueryClient, queries?: QueryObserverOptions[]) {
    this.client = client
    this.queries = queries || []
    this.result = []
    this.observers = []
    this.listeners = []

    // Subscribe to queries
    this.updateObservers()
  }

  subscribe(listener?: QueriesObserverListener): () => void {
    const callback = listener || (() => undefined)

    this.listeners.push(callback)

    if (this.listeners.length === 1) {
      this.observers.forEach(observer => {
        observer.subscribe(result => {
          this.onUpdate(observer, result)
        })
      })
    }

    return () => {
      this.unsubscribe(callback)
    }
  }

  private unsubscribe(listener: QueriesObserverListener): void {
    this.listeners = this.listeners.filter(x => x !== listener)
    if (!this.listeners.length) {
      this.destroy()
    }
  }

  destroy(): void {
    this.listeners = []
    this.observers.forEach(observer => {
      observer.destroy()
    })
  }

  setQueries(queries: QueryObserverOptions[]): void {
    this.queries = queries
    this.updateObservers()
  }

  getCurrentResult(): QueryObserverResult[] {
    return this.result
  }

  private updateObservers(): void {
    let hasIndexChange = false

    const prevObservers = this.observers
    const newObservers = this.queries.map((options, i) => {
      let observer: QueryObserver | undefined = prevObservers[i]

      const defaultedOptions = this.client.defaultQueryObserverOptions(options)
      const hashFn = getQueryKeyHashFn(defaultedOptions)
      defaultedOptions.queryHash = hashFn(defaultedOptions.queryKey!)

      if (
        !observer ||
        observer.getCurrentQuery().queryHash !== defaultedOptions.queryHash
      ) {
        hasIndexChange = true
        observer = prevObservers.find(
          x => x.getCurrentQuery().queryHash === defaultedOptions.queryHash
        )
      }

      if (observer) {
        observer.setOptions(defaultedOptions)
        return observer
      }

      return new QueryObserver(this.client, defaultedOptions)
    })

    if (prevObservers.length === newObservers.length && !hasIndexChange) {
      return
    }

    this.observers = newObservers
    this.result = newObservers.map(observer => observer.getCurrentResult())

    if (!this.listeners.length) {
      return
    }

    difference(prevObservers, newObservers).forEach(observer => {
      observer.destroy()
    })

    difference(newObservers, prevObservers).forEach(observer => {
      observer.subscribe(result => {
        this.onUpdate(observer, result)
      })
    })

    this.notify()
  }

  private onUpdate(observer: QueryObserver, result: QueryObserverResult): void {
    const index = this.observers.indexOf(observer)
    if (index !== -1) {
      this.result = replaceAt(this.result, index, result)
      this.notify()
    }
  }

  private notify(): void {
    const { result } = this
    notifyManager.batch(() => {
      this.listeners.forEach(listener => {
        notifyManager.schedule(() => {
          listener(result)
        })
      })
    })
  }
}
