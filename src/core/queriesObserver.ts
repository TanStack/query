import { difference, getQueryKeyHashFn, replaceAt } from './utils'
import { notifyManager } from './notifyManager'
import type { QueryObserverOptions, QueryObserverResult } from './types'
import type { QueryClient } from './queryClient'
import { QueryObserver } from './queryObserver'
import { Subscribable } from './subscribable'

type QueriesObserverListener<TData, TError> = (
  result: QueryObserverResult<TData, TError>[]
) => void

export class QueriesObserver<TData, TError> extends Subscribable<
  QueriesObserverListener<TData, TError>
> {
  private client: QueryClient
  private result: QueryObserverResult<TData, TError>[]
  private queries: QueryObserverOptions<TData, TError>[]
  private observers: QueryObserver<TData, TError>[]
  private Observer: typeof QueryObserver

  constructor(
    client: QueryClient,
    queries?: QueryObserverOptions<TData, TError>[],
    Observer: typeof QueryObserver = QueryObserver
  ) {
    super()
    this.Observer = Observer
    this.client = client
    this.queries = queries || []
    this.result = []
    this.observers = []

    // Subscribe to queries
    this.updateObservers()
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

  setQueries(queries: QueryObserverOptions<TData, TError>[]): void {
    this.queries = queries
    this.updateObservers()
  }

  getCurrentResult(): QueryObserverResult<TData, TError>[] {
    return this.result
  }

  private updateObservers(): void {
    let hasIndexChange = false

    const prevObservers = this.observers
    const newObservers = this.queries.map((options, i) => {
      let observer: QueryObserver<TData, TError> | undefined = prevObservers[i]

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

      return new this.Observer(this.client, defaultedOptions)
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

  private onUpdate(
    observer: QueryObserver<TData, TError>,
    result: QueryObserverResult<TData, TError>
  ): void {
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
