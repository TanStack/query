import { notifyManager } from './notifyManager'
import type {
  QueryObserverOptions,
  QueryObserverResult,
  DefaultedQueryObserverOptions,
} from './types'
import type { QueryClient } from './queryClient'
import type { NotifyOptions } from './queryObserver'
import { QueryObserver } from './queryObserver'
import { Subscribable } from './subscribable'

function difference<T>(array1: T[], array2: T[]): T[] {
  return array1.filter((x) => array2.indexOf(x) === -1)
}

function replaceAt<T>(array: T[], index: number, value: T): T[] {
  const copy = array.slice(0)
  copy[index] = value
  return copy
}

type QueriesObserverListener = (result: QueryObserverResult[]) => void

export class QueriesObserver extends Subscribable<QueriesObserverListener> {
  #client: QueryClient
  #result: QueryObserverResult[]
  #queries: QueryObserverOptions[]
  #observers: QueryObserver[]

  constructor(client: QueryClient, queries?: QueryObserverOptions[]) {
    super()

    this.#client = client
    this.#queries = []
    this.#result = []
    this.#observers = []

    if (queries) {
      this.setQueries(queries)
    }
  }

  protected onSubscribe(): void {
    if (this.listeners.length === 1) {
      this.#observers.forEach((observer) => {
        observer.subscribe((result) => {
          this.#onUpdate(observer, result)
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
    this.#observers.forEach((observer) => {
      observer.destroy()
    })
  }

  setQueries(
    queries: QueryObserverOptions[],
    notifyOptions?: NotifyOptions,
  ): void {
    this.#queries = queries

    notifyManager.batch(() => {
      const prevObservers = this.#observers

      const newObserverMatches = this.#findMatchingObservers(this.#queries)

      // set options for the new observers to notify of changes
      newObserverMatches.forEach((match) =>
        match.observer.setOptions(match.defaultedQueryOptions, notifyOptions),
      )

      const newObservers = newObserverMatches.map((match) => match.observer)
      const newResult = newObservers.map((observer) =>
        observer.getCurrentResult(),
      )

      const hasIndexChange = newObservers.some(
        (observer, index) => observer !== prevObservers[index],
      )
      if (prevObservers.length === newObservers.length && !hasIndexChange) {
        return
      }

      this.#observers = newObservers
      this.#result = newResult

      if (!this.hasListeners()) {
        return
      }

      difference(prevObservers, newObservers).forEach((observer) => {
        observer.destroy()
      })

      difference(newObservers, prevObservers).forEach((observer) => {
        observer.subscribe((result) => {
          this.#onUpdate(observer, result)
        })
      })

      this.#notify()
    })
  }

  getCurrentResult(): QueryObserverResult[] {
    return this.#result
  }

  getQueries() {
    return this.#observers.map((observer) => observer.getCurrentQuery())
  }

  getObservers() {
    return this.#observers
  }

  getOptimisticResult(queries: QueryObserverOptions[]): QueryObserverResult[] {
    return this.#findMatchingObservers(queries).map((match) =>
      match.observer.getOptimisticResult(match.defaultedQueryOptions),
    )
  }

  #findMatchingObservers(
    queries: QueryObserverOptions[],
  ): QueryObserverMatch[] {
    const prevObservers = this.#observers
    const defaultedQueryOptions = queries.map((options) =>
      this.#client.defaultQueryOptions(options),
    )

    const matchingObservers: QueryObserverMatch[] =
      defaultedQueryOptions.flatMap((defaultedOptions) => {
        const match = prevObservers.find(
          (observer) =>
            observer.options.queryHash === defaultedOptions.queryHash,
        )
        if (match != null) {
          return [{ defaultedQueryOptions: defaultedOptions, observer: match }]
        }
        return []
      })

    const matchedQueryHashes = matchingObservers.map(
      (match) => match.defaultedQueryOptions.queryHash,
    )
    const unmatchedQueries = defaultedQueryOptions.filter(
      (defaultedOptions) =>
        !matchedQueryHashes.includes(defaultedOptions.queryHash),
    )

    const getObserver = (options: QueryObserverOptions): QueryObserver => {
      const defaultedOptions = this.#client.defaultQueryOptions(options)
      const currentObserver = this.#observers.find(
        (o) => o.options.queryHash === defaultedOptions.queryHash,
      )
      return (
        currentObserver ?? new QueryObserver(this.#client, defaultedOptions)
      )
    }

    const newOrReusedObservers: QueryObserverMatch[] = unmatchedQueries.map(
      (options) => {
        return {
          defaultedQueryOptions: options,
          observer: getObserver(options),
        }
      },
    )

    const sortMatchesByOrderOfQueries = (
      a: QueryObserverMatch,
      b: QueryObserverMatch,
    ): number =>
      defaultedQueryOptions.indexOf(a.defaultedQueryOptions) -
      defaultedQueryOptions.indexOf(b.defaultedQueryOptions)

    return matchingObservers
      .concat(newOrReusedObservers)
      .sort(sortMatchesByOrderOfQueries)
  }

  #onUpdate(observer: QueryObserver, result: QueryObserverResult): void {
    const index = this.#observers.indexOf(observer)
    if (index !== -1) {
      this.#result = replaceAt(this.#result, index, result)
      this.#notify()
    }
  }

  #notify(): void {
    notifyManager.batch(() => {
      this.listeners.forEach((listener) => {
        listener(this.#result)
      })
    })
  }
}

type QueryObserverMatch = {
  defaultedQueryOptions: DefaultedQueryObserverOptions
  observer: QueryObserver
}
