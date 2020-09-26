import { difference, hashQueryKey, noop, replaceAt } from './utils'
import { notifyManager } from './notifyManager'
import type { QueryObserverOptions, QueryObserverResult } from './types'
import type { QueryClient } from './queryClient'
import type { QueryObserver } from './queryObserver'

export interface QueriesObserverConfig {
  client: QueryClient
  queries?: QueryObserverOptions[]
}

type QueriesObserverListener = (result: QueryObserverResult[]) => void

export class QueriesObserver {
  private client: QueryClient
  private result: QueryObserverResult[]
  private queries: QueryObserverOptions[]
  private observers: QueryObserver[]
  private listener?: QueriesObserverListener

  constructor(config: QueriesObserverConfig) {
    this.client = config.client
    this.queries = config.queries || []
    this.result = []
    this.observers = []

    // Bind exposed methods
    this.unsubscribe = this.unsubscribe.bind(this)

    // Subscribe to queries
    this.updateObservers()
  }

  subscribe(listener?: QueriesObserverListener): () => void {
    this.listener = listener || noop

    this.observers.forEach(observer => {
      observer.subscribe(result => {
        this.onUpdate(observer, result)
      })
    })

    return this.unsubscribe
  }

  unsubscribe(): void {
    this.listener = undefined
    this.observers.forEach(observer => {
      observer.unsubscribe()
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

      defaultedOptions.queryHash = hashQueryKey(
        defaultedOptions.queryKey!,
        defaultedOptions
      )

      if (
        observer?.getCurrentQuery().queryHash !== defaultedOptions.queryHash
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

      return this.client.watchQuery(defaultedOptions)
    })

    if (prevObservers.length === newObservers.length && !hasIndexChange) {
      return
    }

    this.observers = newObservers
    this.result = newObservers.map(observer => observer.getCurrentResult())

    if (!this.listener) {
      return
    }

    difference(prevObservers, newObservers).forEach(observer => {
      observer.unsubscribe()
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
    const { result, listener } = this
    if (listener) {
      notifyManager.schedule(() => {
        listener(result)
      })
    }
  }
}
