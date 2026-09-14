import { notifyManager } from './notifyManager'
import { QueryObserver } from './queryObserver'
import { Subscribable } from './subscribable'
import { replaceEqualDeep, shallowEqualObjects } from './utils'
import type {
  DefaultedQueryObserverOptions,
  QueryObserverOptions,
  QueryObserverResult,
} from './types'
import type { QueryClient } from './queryClient'

function difference<T>(array1: Array<T>, array2: Array<T>): Array<T> {
  const excludeSet = new Set(array2)
  return array1.filter((x) => !excludeSet.has(x))
}

type QueriesObserverListener = (result: Array<QueryObserverResult>) => void

type CombineFn<TCombinedResult> = (
  result: Array<QueryObserverResult>,
) => TCombinedResult

export interface QueriesObserverOptions<
  TCombinedResult = Array<QueryObserverResult>,
> {
  /**
   * A function that combines the array of `QueryObserverResult`s (one per
   * observed query) into a single value. The combined value is memoized and
   * only recomputed when one of the underlying results, the query hashes, or
   * the `combine` function itself changes.
   *
   * Defaults to returning the array of `QueryObserverResult`s unchanged.
   */
  combine?: CombineFn<TCombinedResult>
}

/**
 * A `QueriesObserver` watches an array of queries at once, exposing them as
 * a single array of `QueryObserverResult`s (or, when a `combine` option is
 * given, as a combined value derived from that array). It manages one
 * internal `QueryObserver` per query, and is the primitive that framework
 * adapters (e.g. `useQueries`) build their hooks on top of.
 *
 * @example
 * ```ts
 * const observer = new QueriesObserver(queryClient, [
 *   { queryKey: ['post', 1], queryFn: fetchPost },
 *   { queryKey: ['post', 2], queryFn: fetchPost },
 * ])
 *
 * const unsubscribe = observer.subscribe((result) => {
 *   console.log(result)
 * })
 * ```
 */
export class QueriesObserver<
  TCombinedResult = Array<QueryObserverResult>,
> extends Subscribable<QueriesObserverListener> {
  #client: QueryClient
  #result!: Array<QueryObserverResult>
  #queries: Array<QueryObserverOptions>
  #options?: QueriesObserverOptions<TCombinedResult>
  #observers: Array<QueryObserver>
  #combinedResult!: TCombinedResult
  #lastCombine?: CombineFn<TCombinedResult>
  #lastResult?: Array<QueryObserverResult>
  #lastQueryHashes?: Array<string>
  #observerMatches: Array<QueryObserverMatch> = []

  constructor(
    client: QueryClient,
    queries: Array<QueryObserverOptions<any, any, any, any, any>>,
    options?: QueriesObserverOptions<TCombinedResult>,
  ) {
    super()

    this.#client = client
    this.#options = options
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

  /**
   * Stops observing all queries: clears all listeners and destroys every
   * underlying `QueryObserver` this observer manages.
   */
  destroy(): void {
    this.listeners = new Set()
    this.#observers.forEach((observer) => {
      observer.destroy()
    })
  }

  /**
   * Replaces the set of queries being observed. Existing `QueryObserver`s
   * are reused for queries that match an already-observed query hash;
   * observers for queries that are no longer present are destroyed, and new
   * observers are created and subscribed to for newly added queries.
   *
   * @example
   * ```ts
   * observer.setQueries([
   *   { queryKey: ['post', 1], queryFn: fetchPost },
   *   { queryKey: ['post', 3], queryFn: fetchPost },
   * ])
   * ```
   */
  setQueries(
    queries: Array<QueryObserverOptions>,
    options?: QueriesObserverOptions<TCombinedResult>,
  ): void {
    this.#queries = queries
    this.#options = options

    if (process.env.NODE_ENV !== 'production') {
      const queryHashes = queries.map(
        (query) => this.#client.defaultQueryOptions(query).queryHash,
      )
      if (new Set(queryHashes).size !== queryHashes.length) {
        console.warn(
          '[QueriesObserver]: Duplicate Queries found. This might result in unexpected behavior.',
        )
      }
    }

    notifyManager.batch(() => {
      const prevObservers = this.#observers

      const newObserverMatches = this.#findMatchingObservers(this.#queries)

      // set options for the new observers to notify of changes
      newObserverMatches.forEach((match) =>
        match.observer.setOptions(match.defaultedQueryOptions),
      )

      const newObservers = newObserverMatches.map((match) => match.observer)
      const newResult = newObservers.map((observer) =>
        observer.getCurrentResult(),
      )

      const hasLengthChange = prevObservers.length !== newObservers.length
      const hasIndexChange = newObservers.some(
        (observer, index) => observer !== prevObservers[index],
      )
      const hasStructuralChange = hasLengthChange || hasIndexChange

      const hasResultChange = hasStructuralChange
        ? true
        : newResult.some((result, index) => {
            const prev = this.#result[index]
            return !prev || !shallowEqualObjects(result, prev)
          })

      if (!hasStructuralChange && !hasResultChange) return

      if (hasStructuralChange) {
        this.#observerMatches = newObserverMatches
        this.#observers = newObservers
      }

      this.#result = newResult

      if (!this.hasListeners()) return

      if (hasStructuralChange) {
        difference(prevObservers, newObservers).forEach((observer) => {
          observer.destroy()
        })
        difference(newObservers, prevObservers).forEach((observer) => {
          observer.subscribe((result) => {
            this.#onUpdate(observer, result)
          })
        })
      }

      this.#notify()
    })
  }

  /**
   * Returns the most recently computed array of `QueryObserverResult`s, one
   * per observed query, in the same order as the queries passed to the
   * constructor or `setQueries`.
   *
   * @example
   * ```ts
   * const results = observer.getCurrentResult()
   * const data = results.map((result) => result.data)
   * ```
   */
  getCurrentResult(): Array<QueryObserverResult> {
    return this.#result
  }

  /**
   * Returns the underlying `Query` instances currently being observed, in
   * the same order as the queries passed to the constructor or `setQueries`.
   */
  getQueries() {
    return this.#observers.map((observer) => observer.getCurrentQuery())
  }

  /**
   * Returns the underlying `QueryObserver` instances this observer manages,
   * in the same order as the queries passed to the constructor or
   * `setQueries`.
   */
  getObservers() {
    return this.#observers
  }

  /**
   * The `QueriesObserver` counterpart of {@link QueryObserver#getOptimisticResult} — computes
   * the result for the given (already-defaulted) queries right now, synchronously. Called by
   * framework adapters (e.g. `useQueries`) ahead of subscribing, returning a tuple of the raw
   * per-query results, a function to compute the combined result from them, and a function to
   * wrap the results for property-access tracking.
   */
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
    const queryHashes = matches.map(
      (match) => match.defaultedQueryOptions.queryHash,
    )

    return [
      result,
      (r?: Array<QueryObserverResult>) => {
        return this.#combineResult(r ?? result, combine, queryHashes)
      },
      () => {
        return this.#trackResult(result, matches)
      },
    ]
  }

  #trackResult(
    result: Array<QueryObserverResult>,
    matches: Array<QueryObserverMatch>,
  ) {
    const trackedProps = new Set<keyof QueryObserverResult>()

    return matches.map((match, index) => {
      const observerResult = result[index]!
      return !match.defaultedQueryOptions.notifyOnChangeProps
        ? match.observer.trackResult(observerResult, (accessedProp) => {
            // track property on all observers to ensure proper (synchronized) tracking (#7000)
            if (!trackedProps.has(accessedProp)) {
              trackedProps.add(accessedProp)
              matches.forEach((m) => {
                m.observer.trackProp(accessedProp)
              })
            }
          })
        : observerResult
    })
  }

  #combineResult(
    input: Array<QueryObserverResult>,
    combine: CombineFn<TCombinedResult> | undefined,
    queryHashes?: Array<string>,
  ): TCombinedResult {
    if (combine) {
      const lastHashes = this.#lastQueryHashes
      const queryHashesChanged =
        queryHashes !== undefined &&
        lastHashes !== undefined &&
        (lastHashes.length !== queryHashes.length ||
          queryHashes.some((hash, i) => hash !== lastHashes[i]))

      if (
        this.#result !== this.#lastResult ||
        queryHashesChanged ||
        combine !== this.#lastCombine
      ) {
        this.#lastCombine = combine
        this.#lastResult = this.#result

        if (queryHashes !== undefined) {
          this.#lastQueryHashes = queryHashes
        }
        this.#combinedResult = replaceEqualDeep(
          this.#combinedResult,
          combine(input),
        )
      }

      return this.#combinedResult
    }
    return input as any
  }

  #shouldSkipCombine(): boolean {
    return (
      !this.#options?.combine ||
      this.#observers.some((observer, index) => {
        return (
          observer.options.suspense && this.#result[index]?.data === undefined
        )
      })
    )
  }

  #findMatchingObservers(
    queries: Array<QueryObserverOptions>,
  ): Array<QueryObserverMatch> {
    const prevObserversMap = new Map<string, Array<QueryObserver>>()

    this.#observers.forEach((observer) => {
      const key = observer.options.queryHash
      if (!key) return

      const previousObservers = prevObserversMap.get(key)

      if (previousObservers) {
        previousObservers.push(observer)
      } else {
        prevObserversMap.set(key, [observer])
      }
    })

    const observers: Array<QueryObserverMatch> = []

    queries.forEach((options) => {
      const defaultedOptions = this.#client.defaultQueryOptions(options)
      const match = prevObserversMap.get(defaultedOptions.queryHash)?.shift()
      const observer =
        match ?? new QueryObserver(this.#client, defaultedOptions)

      observers.push({
        defaultedQueryOptions: defaultedOptions,
        observer,
      })
    })

    return observers
  }

  #onUpdate(observer: QueryObserver, result: QueryObserverResult): void {
    const index = this.#observers.indexOf(observer)
    if (index !== -1) {
      this.#result = this.#result.slice()
      this.#result[index] = result
      this.#notify()
    }
  }

  #notify(): void {
    if (this.hasListeners()) {
      const shouldSkipCombine = this.#shouldSkipCombine()
      const previousResult = this.#combinedResult
      const newResult = shouldSkipCombine
        ? previousResult
        : this.#combineResult(
            this.#trackResult(this.#result, this.#observerMatches),
            this.#options?.combine,
          )

      if (shouldSkipCombine || previousResult !== newResult) {
        notifyManager.batch(() => {
          this.listeners.forEach((listener) => {
            listener(this.#result)
          })
        })
      }
    }
  }
}

type QueryObserverMatch = {
  defaultedQueryOptions: DefaultedQueryObserverOptions
  observer: QueryObserver
}
