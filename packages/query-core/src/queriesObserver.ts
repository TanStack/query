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

function difference<T>(array1: Array<T>, array2: Array<T>): Array<T> {
  return array1.filter((x) => !array2.includes(x))
}

function replaceAt<T>(array: Array<T>, index: number, value: T): Array<T> {
  const copy = array.slice(0)
  copy[index] = value
  return copy
}

type QueriesObserverListener = (result: Array<QueryObserverResult>) => void

type CombineFn<TCombinedResult> = (
  result: Array<QueryObserverResult>,
) => TCombinedResult

export interface QueriesObserverOptions<
  TCombinedResult = Array<QueryObserverResult>,
> {
  combine?: CombineFn<TCombinedResult>
}

export class QueriesObserver<
  TCombinedResult = Array<QueryObserverResult>,
> extends Subscribable<QueriesObserverListener> {
  #client: QueryClient
  #result!: Array<QueryObserverResult>
  #queries: Array<QueryObserverOptions>
  #observers: Array<QueryObserver>
  #combinedResult?: TCombinedResult
  #lastCombine?: CombineFn<TCombinedResult>
  #lastResult?: Array<QueryObserverResult>

  constructor(
    client: QueryClient,
    queries: Array<QueryObserverOptions<any, any, any, any, any>>,
    _options?: QueriesObserverOptions<TCombinedResult>,
  ) {
    super()

    this.#client = client
    this.#queries = []
    this.#observers = []
    this.#result = []

    this.setQueries(queries)
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
    queries: Array<QueryObserverOptions>,
    _options?: QueriesObserverOptions<TCombinedResult>,
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

  getCurrentResult(): Array<QueryObserverResult> {
    return this.#result
  }

  getQueries() {
    return this.#observers.map((observer) => observer.getCurrentQuery())
  }

  getObservers() {
    return this.#observers
  }

  getOptimisticResult(
    queries: Array<QueryObserverOptions>,
    combine: CombineFn<TCombinedResult> | undefined,
  ): [
    rawResult: Array<QueryObserverResult>,
    combineResult: (r?: Array<QueryObserverResult>) => TCombinedResult,
    trackResult: () => Array<QueryObserverResult>,
  ] {
    const matches = this.#findMatchingObservers(queries)
    const result = matches.map((match) =>
      match.observer.getOptimisticResult(match.defaultedQueryOptions),
    )

    return [
      result,
      (r?: Array<QueryObserverResult>) => {
        return this.#combineResult(r ?? result, combine)
      },
      () => {
        return matches.map((match, index) => {
          const observerResult = result[index]!
          return !match.defaultedQueryOptions.notifyOnChangeProps
            ? match.observer.trackResult(observerResult, (accessedProp) => {
                // track property on all observers to ensure proper (synchronized) tracking (#7000)
                matches.forEach((m) => {
                  m.observer.trackProp(accessedProp)
                })
              })
            : observerResult
        })
      },
    ]
  }

  #combineResult(
    input: Array<QueryObserverResult>,
    combine: CombineFn<TCombinedResult> | undefined,
  ): TCombinedResult {
    if (combine) {
      if (
        !this.#combinedResult ||
        this.#result !== this.#lastResult ||
        combine !== this.#lastCombine
      ) {
        this.#lastCombine = combine
        this.#lastResult = this.#result
        this.#combinedResult = replaceEqualDeep(
          this.#combinedResult,
          combine(input),
        )
      }

      return this.#combinedResult
    }
    return input as any
  }

  #findMatchingObservers(
    queries: Array<QueryObserverOptions>,
  ): Array<QueryObserverMatch> {
    const prevObservers = this.#observers
    const prevObserversMap = new Map(
      prevObservers.map((observer) => [observer.options.queryHash, observer]),
    )

    const defaultedQueryOptions = queries.map((options) =>
      this.#client.defaultQueryOptions(options),
    )

    const matchingObservers: Array<QueryObserverMatch> =
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

    const newOrReusedObservers: Array<QueryObserverMatch> =
      unmatchedQueries.map((options) => {
        return {
          defaultedQueryOptions: options,
          observer: getObserver(options),
        }
      })

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
