import { difference, replaceAt } from './utils'
import { notifyManager } from './notifyManager'
import type {
  QueryObserverOptions,
  QueryObserverResult,
  DefaultedQueryObserverOptions,
} from './types'
import type { QueryClient } from './queryClient'
import { NotifyOptions, QueryObserver } from './queryObserver'
import { Subscribable } from './subscribable'

type QueriesObserverListener = (result: QueryObserverResult[]) => void

export class QueriesObserver extends Subscribable<QueriesObserverListener> {
  private client: QueryClient
  private result: QueryObserverResult[]
  private queries: QueryObserverOptions[]
  private observers: QueryObserver[]
  private observersMap: Record<string, QueryObserver>

  constructor(client: QueryClient, queries?: QueryObserverOptions[]) {
    super()

    this.client = client
    this.queries = []
    this.result = []
    this.observers = []
    this.observersMap = {}

    if (queries) {
      this.setQueries(queries)
    }
  }

  protected onSubscribe(): void {
    if (this.listeners.length === 1) {
      this.observers.forEach((observer) => {
        observer.subscribe((result) => {
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
    this.observers.forEach((observer) => {
      observer.destroy()
    })
  }

  setQueries(
    queries: QueryObserverOptions[],
    notifyOptions?: NotifyOptions,
  ): void {
    this.queries = queries

    notifyManager.batch(() => {
      const prevObservers = this.observers

      const newObserverMatches = this.findMatchingObservers(this.queries)

      // set options for the new observers to notify of changes
      newObserverMatches.forEach((match) =>
        match.observer.setOptions(match.defaultedQueryOptions, notifyOptions),
      )

      const newObservers = newObserverMatches.map((match) => match.observer)
      const newObserversMap = Object.fromEntries(
        newObservers.map((observer) => [observer.options.queryHash, observer]),
      )
      const newResult = newObservers.map((observer) =>
        observer.getCurrentResult(),
      )

      const hasIndexChange = newObservers.some(
        (observer, index) => observer !== prevObservers[index],
      )
      if (prevObservers.length === newObservers.length && !hasIndexChange) {
        return
      }

      this.observers = newObservers
      this.observersMap = newObserversMap
      this.result = newResult

      if (!this.hasListeners()) {
        return
      }

      difference(prevObservers, newObservers).forEach((observer) => {
        observer.destroy()
      })

      difference(newObservers, prevObservers).forEach((observer) => {
        observer.subscribe((result) => {
          this.onUpdate(observer, result)
        })
      })

      this.notify()
    })
  }

  getCurrentResult(): QueryObserverResult[] {
    return this.result
  }

  getOptimisticResult(queries: QueryObserverOptions[]): QueryObserverResult[] {
    return this.findMatchingObservers(queries).map((match) =>
      match.observer.getOptimisticResult(match.defaultedQueryOptions),
    )
  }

  private findMatchingObservers(
    queries: QueryObserverOptions[],
  ): QueryObserverMatch[] {
    const prevObservers = this.observers
    const defaultedQueryOptions = queries.map((options) =>
      this.client.defaultQueryOptions(options),
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

    const unmatchedObservers = prevObservers.filter(
      (prevObserver) =>
        !matchingObservers.some((match) => match.observer === prevObserver),
    )

    const getObserver = (options: QueryObserverOptions): QueryObserver => {
      const defaultedOptions = this.client.defaultQueryOptions(options)
      const currentObserver = this.observersMap[defaultedOptions.queryHash!]
      return currentObserver ?? new QueryObserver(this.client, defaultedOptions)
    }

    const newOrReusedObservers: QueryObserverMatch[] = unmatchedQueries.map(
      (options, index) => {
        if (options.keepPreviousData) {
          // return previous data from one of the observers that no longer match
          const previouslyUsedObserver = unmatchedObservers[index]
          if (previouslyUsedObserver !== undefined) {
            return {
              defaultedQueryOptions: options,
              observer: previouslyUsedObserver,
            }
          }
        }
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

  private onUpdate(observer: QueryObserver, result: QueryObserverResult): void {
    const index = this.observers.indexOf(observer)
    if (index !== -1) {
      this.result = replaceAt(this.result, index, result)
      this.notify()
    }
  }

  private notify(): void {
    notifyManager.batch(() => {
      this.listeners.forEach((listener) => {
        listener(this.result)
      })
    })
  }
}

type QueryObserverMatch = {
  defaultedQueryOptions: DefaultedQueryObserverOptions
  observer: QueryObserver
}
