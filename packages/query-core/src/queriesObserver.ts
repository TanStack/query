/// <reference lib="es2023.array" />
/// <reference lib="es2024.collection" />
import { equalItems } from './equalItems'
import { notifyManager } from './notifyManager'
import { defaultQueryOptions } from './queryClient'
import { QueryObserver } from './queryObserver'
import { Subscribable } from './subscribable'
import {
  replaceEqualDeep,
  shallowEqualObjects,
  shouldThrowError,
} from './utils'
import type { QueryClient } from './queryClient'
import type {
  ObserverOptionsInput,
  QueryObserverResultReader,
} from './queryObserver'
import type {
  DefaultedQueryObserverOptions,
  QueryObserverResult,
} from './types'

type CombineContext<TCombinedResult> = {
  result?: Array<QueryObserverResult>
  combine?: CombineFn<TCombinedResult>
  value?: TCombinedResult
  queryHashes?: Array<string>
}

type CombineFn<TCombinedResult> = (
  result: Array<QueryObserverResult>,
) => TCombinedResult

type QueriesObserverListener = (result: Array<QueryObserverResult>) => void

type CombineReader<T> = (
  results: Array<QueryObserverResult>,
  previous: CombineContext<T>,
  committed: CombineContext<T>,
) => CombineContext<T>

/**
 * Tracks a property on the whole group the first time a result reads it.
 * @param results - The snapshots returned to the consumer or combined by its callback.
 * @param observers - The matching query observers in render order.
 * @param options - The options for this group, which can disable property tracking.
 * @returns The results with tracking enabled where requested.
 */
function trackResults(
  results: Array<QueryObserverResult>,
  observers: Array<QueryObserver>,
  options: Array<DefaultedQueryObserverOptions>,
): Array<QueryObserverResult> {
  const tracked = new Set<keyof QueryObserverResult>()
  return results.map((result, index) =>
    options[index]!.notifyOnChangeProps
      ? result
      : observers[index]!.trackResult(result, (field) => {
          if (!tracked.has(field)) {
            tracked.add(field)
            observers.forEach((observer) => observer.trackProp(field))
          }
        }),
  )
}

/**
 * Shares combinations that match the query keys, snapshots and callback. The
 * returned function captures only this group's options and observers.
 * @param combine - Derives a combined result from the group's tracked snapshots.
 * @param hashes - The ordered query hashes, including duplicates.
 * @param observers - The observers whose property accesses need tracking.
 * @param options - This group's options for each observer.
 * @returns A reader that leaves its input caches untouched.
 */
function createCombineReader<T>(
  combine: CombineFn<T>,
  hashes: Array<string>,
  observers: Array<QueryObserver>,
  options: Array<DefaultedQueryObserverOptions>,
): CombineReader<T> {
  return (results, previous, committed) => {
    const matches = (entry: CombineContext<T>) =>
      entry.combine === combine &&
      equalItems(hashes, entry.queryHashes) &&
      equalItems(results, entry.result, shallowEqualObjects)

    if (matches(committed)) return committed
    if (previous !== committed && matches(previous)) return previous
    return {
      combine,
      queryHashes: hashes,
      result: results,
      value: replaceEqualDeep(
        previous.value,
        combine(trackResults(results, observers, options)),
      ),
    }
  }
}

/**
 * Returns the items of `array1` that are not in `array2`.
 * @param array1 - The items to filter.
 * @param array2 - The items to exclude.
 * @returns A new array with the items of `array1` that are not in `array2`.
 */
function difference<T>(array1: Array<T>, array2: Array<T>): Array<T> {
  const excludeSet = new Set(array2)
  return array1.filter((x) => !excludeSet.has(x))
}

/**
 * A `QueriesObserver` watches an array of queries at once, exposing them as
 * a single array of `QueryObserverResult`s (or, when a `combine` option is
 * given, as a combined value derived from that array). It manages one
 * internal `QueryObserver` per query, and is the primitive that framework
 * adapters (e.g. `useQueries`) build their hooks on top of.
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
  #observers: Array<QueryObserver> = []
  #result: Array<QueryObserverResult> = []
  #combine?: CombineReader<TCombinedResult>
  #memo: CombineContext<TCombinedResult> = {}
  #combinedResult?: TCombinedResult
  #updating = false

  constructor(
    client: QueryClient,
    queries: Array<ObserverOptionsInput<any, any, any, any, any>>,
    _options?: QueriesObserverOptions<TCombinedResult>,
  ) {
    super()
    this.#client = client
    this.setQueries(queries)
  }

  protected override onSubscribe(): void {
    if (this.listeners.size === 1) {
      this.#observers.forEach((observer) => this.#subscribeTo(observer))
    }
  }

  protected override onUnsubscribe(): void {
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
   * @param queries - The options of the queries to observe.
   * @param options - Replaces the observer's options, e.g. its `combine` function.
   * @example
   * ```ts
   * observer.setQueries([
   *   { queryKey: ['post', 1], queryFn: fetchPost },
   *   { queryKey: ['post', 3], queryFn: fetchPost },
   * ])
   * ```
   */
  setQueries(
    queries: Array<ObserverOptionsInput>,
    options?: QueriesObserverOptions<TCombinedResult>,
  ): void {
    this.#prepare(queries, options, false).commit()
  }

  /**
   * Returns the most recently computed array of `QueryObserverResult`s, one
   * per observed query, in the same order as the queries passed to the
   * constructor or `setQueries`.
   * @returns The current results.
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
   * Returns the underlying `QueryObserver` instances this observer manages,
   * in the same order as the queries passed to the constructor or
   * `setQueries`.
   * @returns The managed query observers.
   */
  getObservers() {
    return this.#observers
  }

  /**
   * Creates a reader for the supplied queries and combine function. Reads keep
   * result and combine caches local until commit applies the queries and reuses
   * their computation state. Abandoned readers do not change active observers.
   * @param queries - The options of the queries to read and commit.
   * @param options - The combine function used for this reader.
   * @returns A reader with local snapshot and combine caches.
   */
  createResultReader(
    queries: Array<ObserverOptionsInput<any, any, any, any, any>>,
    options?: QueriesObserverOptions<TCombinedResult>,
  ): QueriesObserverResultReader<TCombinedResult> {
    return this.#prepare(queries, options, true)
  }

  #prepare(
    queries: Array<ObserverOptionsInput<any, any, any, any, any>>,
    options: QueriesObserverOptions<TCombinedResult> | undefined,
    render: boolean,
  ): QueriesObserverResultReader<TCombinedResult> {
    const pool = Map.groupBy(
      this.#observers,
      (observer) => observer.getCurrentQuery().queryHash,
    )
    const defaults = queries.map((query) =>
      defaultQueryOptions(this.#client, query),
    )
    const hashes = defaults.map((query) => query.queryHash)
    const observers = defaults.map((query) => {
      const match = query.queryHash
        ? pool.get(query.queryHash)?.shift()
        : undefined
      return match ?? new QueryObserver(this.#client, query)
    })
    const combine =
      options?.combine &&
      createCombineReader(options.combine, hashes, observers, defaults)
    let memo = this.#memo
    let result = this.#result
    const readers = render
      ? observers.map((observer, index) =>
          observer.createResultReader(defaults[index]!),
        )
      : undefined

    return {
      getSnapshot: () => {
        const next = readers!.map((reader) => reader.getSnapshot())
        if (!equalItems(next, result)) result = next
        return result
      },
      combineResult: (input) => {
        if (!combine)
          return trackResults(input, observers, defaults) as TCombinedResult
        memo = combine(input, memo, this.#memo)
        return memo.value as TCombinedResult
      },
      commit: () =>
        notifyManager.batch(() => {
          if (
            process.env.NODE_ENV !== 'production' &&
            new Set(hashes).size !== hashes.length
          ) {
            console.warn(
              '[QueriesObserver]: Duplicate Queries found. This might result in unexpected behavior.',
            )
          }
          this.#memo = memo
          this.#combine = combine
          // Do not notify with the first new selector and the remaining old ones.
          this.#updating = true
          try {
            observers.forEach((observer, index) => {
              if (readers) readers[index]!.commit()
              else observer.setOptions(defaults[index]!)
            })
          } finally {
            this.#updating = false
          }

          const previous = this.#observers
          if (equalItems(previous, observers)) {
            this.#update()
          } else {
            this.#observers = observers
            this.#update(previous)
          }
          if (
            this.#combine === combine &&
            equalItems(this.#result, memo.result, shallowEqualObjects)
          ) {
            this.#combinedResult = memo.value
          }
        }),
    }
  }

  #subscribeTo(observer: QueryObserver): void {
    // Capturing the previous group here would retain removed queries (#12656).
    observer.subscribe((result) => {
      if (this.#updating) return
      const index = this.#observers.indexOf(observer)
      if (index !== -1)
        this.#update(undefined, this.#result.with(index, result))
    })
  }

  #update(
    previous?: Array<QueryObserver>,
    results = this.#observers.map((observer) => observer.getCurrentResult()),
  ): void {
    if (!previous && equalItems(results, this.#result)) return
    this.#result = results
    if (!this.hasListeners()) return

    if (previous) {
      difference(previous, this.#observers).forEach((observer) =>
        observer.destroy(),
      )
      difference(this.#observers, previous).forEach((observer) =>
        this.#subscribeTo(observer),
      )
    }

    if (
      this.#combine &&
      !this.#observers.some((observer, index) => {
        const result = this.#result[index]!
        return (
          (observer.options.suspense && result.data === undefined) ||
          (result.status === 'error' &&
            result.fetchStatus !== 'fetching' &&
            shouldThrowError(observer.options.throwOnError, [
              result.error,
              observer.getCurrentQuery(),
            ]))
        )
      })
    ) {
      this.#memo = this.#combine(this.#result, this.#memo, this.#memo)
      if (this.#combinedResult === this.#memo.value) return
      this.#combinedResult = this.#memo.value
    }
    notifyManager.batch(() => {
      this.listeners.forEach((listener) => listener(this.#result))
    })
  }
}

/**
 * Options for a `QueriesObserver` that apply to all of its queries at once.
 */
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

/** A cached reader for multiple query results and their combined value. */
export interface QueriesObserverResultReader<
  TCombinedResult,
> extends QueryObserverResultReader<Array<QueryObserverResult>> {
  /** Track result properties and combine the results with this reader's options. */
  combineResult: (result: Array<QueryObserverResult>) => TCombinedResult
}
