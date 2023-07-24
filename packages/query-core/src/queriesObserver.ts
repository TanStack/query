import { notifyManager } from './notifyManager'
import { QueryObserver } from './queryObserver'
import { Subscribable } from './subscribable'
import { replaceEqualDeep } from './utils'
import type {
  DefaultedQueryObserverOptions,
  QueryObserverOptions,
  QueryObserverResult,
} from './types'
import type { QueryClient } from './queryClient'
import type { NotifyOptions } from './queryObserver'

function difference<T>(array1: T[], array2: T[]): T[] {
  return array1.filter((x) => !array2.includes(x))
}

function replaceAt<T>(array: T[], index: number, value: T): T[] {
  const copy = array.slice(0)
  copy[index] = value
  return copy
}

type QueriesObserverListener = (result: QueryObserverResult[]) => void

export interface QueriesObserverOptions<
  TCombinedResult = QueryObserverResult[],
> {
  combine?: (result: QueryObserverResult[]) => TCombinedResult
}

export class QueriesObserver<
  TCombinedResult = QueryObserverResult[],
> extends Subscribable<QueriesObserverListener> {
  #client: QueryClient
  #result!: QueryObserverResult[]
  #queries: QueryObserverOptions[]
  #observers: QueryObserver[]
  #options?: QueriesObserverOptions<TCombinedResult>
  #combinedResult!: TCombinedResult

  constructor(
    client: QueryClient,
    queries: QueryObserverOptions[],
    options?: QueriesObserverOptions<TCombinedResult>,
  ) {
    super()

    this.#client = client
    this.#queries = []
    this.#observers = []

    this.#setResult([])
    this.setQueries(queries, options)
  }

  #setResult(value: QueryObserverResult[]) {
    this.#result = value
    this.#combinedResult = this.#combineResult(value)
  }

  protected onSubscribe(): void {
    if (this.listeners.size === 1) {
      this.#observers.forEach((observer) => {
        observer.subscribe((result) => {
          this.#onUpdate(observer, result)
        })
      })
    }
  }

  protected onUnsubscribe(): void {
    if (!this.listeners.size) {
      this.destroy()
    }
  }

  destroy(): void {
    this.listeners = new Set()
    this.#observers.forEach((observer) => {
      observer.destroy()
    })
  }

  setQueries(
    queries: QueryObserverOptions[],
    options?: QueriesObserverOptions<TCombinedResult>,
    notifyOptions?: NotifyOptions,
  ): void {
    this.#queries = queries
    this.#options = options

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
      this.#setResult(newResult)

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

  getCurrentResult(): TCombinedResult {
    return this.#combinedResult
  }

  getQueries() {
    return this.#observers.map((observer) => observer.getCurrentQuery())
  }

  getObservers() {
    return this.#observers
  }

  getOptimisticResult(
    queries: QueryObserverOptions[],
  ): [
    rawResult: QueryObserverResult[],
    combineResult: (r?: QueryObserverResult[]) => TCombinedResult,
    trackResult: () => QueryObserverResult[],
  ] {
    const matches = this.#findMatchingObservers(queries)
    const result = matches.map((match) =>
      match.observer.getOptimisticResult(match.defaultedQueryOptions),
    )

    return [
      result,
      (r?: QueryObserverResult[]) => {
        return this.#combineResult(r ?? result)
      },
      () => {
        return matches.map((match, index) => {
          const observerResult = result[index]!
          return !match.defaultedQueryOptions.notifyOnChangeProps
            ? match.observer.trackResult(observerResult)
            : observerResult
        })
      },
    ]
  }

  #combineResult(input: QueryObserverResult[]): TCombinedResult {
    const combine = this.#options?.combine
    if (combine) {
      return replaceEqualDeep(this.#combinedResult, combine(input))
    }
    return input as any
  }

  #findMatchingObservers(
    queries: QueryObserverOptions[],
  ): QueryObserverMatch[] {
    const prevObservers = this.#observers
    const prevObserversMap = new Map(
      prevObservers.map((observer) => [observer.options.queryHash, observer]),
    )

    const defaultedQueryOptions = queries.map((options) =>
      this.#client.defaultQueryOptions(options),
    )

    const matchingObservers: QueryObserverMatch[] =
      defaultedQueryOptions.flatMap((defaultedOptions) => {
        const match = prevObserversMap.get(defaultedOptions.queryHash)
        if (match != null) {
          return [{ defaultedQueryOptions: defaultedOptions, observer: match }]
        }
        return []
      })

    const matchedQueryHashes = new Set(
      matchingObservers.map((match) => match.defaultedQueryOptions.queryHash),
    )
    const unmatchedQueries = defaultedQueryOptions.filter(
      (defaultedOptions) => !matchedQueryHashes.has(defaultedOptions.queryHash),
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
      this.#setResult(replaceAt(this.#result, index, result))
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
