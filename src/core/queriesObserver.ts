import { difference, replaceAt } from './utils'
import { notifyManager } from './notifyManager'
import type { QueryObserverOptions, QueryObserverResult } from './types'
import type { QueryClient } from './queryClient'
import { NotifyOptions, QueryObserver } from './queryObserver'
import { Subscribable } from './subscribable'

type QueriesObserverListener = (result: QueryObserverResult[]) => void

export class QueriesObserver extends Subscribable<QueriesObserverListener> {
  private client: QueryClient
  private result: QueryObserverResult[]
  private queries: QueryObserverOptions[]
  private observers: QueryObserver[]

  constructor(client: QueryClient, queries?: QueryObserverOptions[]) {
    super()

    this.client = client
    this.queries = queries || []
    this.result = []
    this.observers = []
    this.setQueries(this.queries)
  }

  protected onSubscribe(): void {
    if (this.listeners.length === 1) {
      this.observers.forEach(observer => {
        observer.subscribe(result => {
          this.onUpdate(observer, result)
        })
      })
    }
  }

  protected onUnsubscribe(): void {
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

  setQueries(
    queries: QueryObserverOptions[],
    notifyOptions?: NotifyOptions
  ): void {
    this.queries = queries
    this.updateObservers(notifyOptions)
  }

  getCurrentResult(): QueryObserverResult[] {
    return this.result
  }

  getOptimisticResult(queries: QueryObserverOptions[]): QueryObserverResult[] {
    return queries.map((options, i) => {
      let observer: QueryObserver | undefined = this.observers[i]

      const defaultedOptions = this.client.defaultQueryObserverOptions(options)

      if (
        !observer ||
        observer.getCurrentQuery().queryHash !== defaultedOptions.queryHash
      ) {
        observer = this.observers.find(
          x => x.getCurrentQuery().queryHash === defaultedOptions.queryHash
        )
      }

      if (!observer) {
        observer = new QueryObserver(this.client, defaultedOptions)
      }

      return observer.getOptimisticResult(defaultedOptions)
    })
  }

  private updateObservers(notifyOptions?: NotifyOptions): void {
    notifyManager.batch(() => {
      let hasIndexChange = false

      const prevObservers = this.observers
      const newObservers = this.queries.map((options, i) => {
        let observer: QueryObserver | undefined = prevObservers[i]

        const defaultedOptions = this.client.defaultQueryObserverOptions(
          options
        )

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
          observer.setOptions(defaultedOptions, notifyOptions)
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
    })
  }

  private onUpdate(observer: QueryObserver, result: QueryObserverResult): void {
    const index = this.observers.indexOf(observer)
    if (index !== -1) {
      this.result = replaceAt(this.result, index, result)
      this.notify()
    }
  }

  private notify(): void {
    notifyManager.batch(() => {
      this.listeners.forEach(listener => {
        listener(this.result)
      })
    })
  }
}
