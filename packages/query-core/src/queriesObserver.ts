/// <reference lib="es2024.collection" />
/// <reference lib="es2023.array" />
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

type ObserverGroup = {
  observers: Array<QueryObserver>
  options: Array<DefaultedQueryObserverOptions>
}

/**
 * Returns the key used to match an already observed query.
 * @param observer - An observer from the committed list.
 * @returns The current query hash.
 */
function observerHash(observer: QueryObserver): string {
  return observer.getCurrentQuery().queryHash
}

/**
 * Tests the values, keys and combiner captured by an earlier computation.
 * @param context - The earlier result.
 * @param combine - The current combining function.
 * @param result - The current snapshots.
 * @param hashes - The query hashes in the current list.
 * @returns Whether the earlier combination can be reused.
 */
function matchesCombined<TResult>(
  context: CombineContext<TResult>,
  combine: CombineFn<TResult> | undefined,
  result: Array<QueryObserverResult>,
  hashes: Array<string>,
) {
  return (
    context.combine === combine &&
    equalItems(result, context.result, shallowEqualObjects) &&
    equalItems(hashes, context.queryHashes)
  )
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
  #result: Array<QueryObserverResult>
  #options?: QueriesObserverOptions<TCombinedResult>
  #observers: Array<QueryObserver>
  #combinedResult?: TCombinedResult
  #combineContext: CombineContext<TCombinedResult> = {}
  #updatingQueries = false

  constructor(
    client: QueryClient,
    queries: Array<ObserverOptionsInput<any, any, any, any, any>>,
    options?: QueriesObserverOptions<TCombinedResult>,
  ) {
    super()

    this.#client = client
    this.#options = options
    this.#observers = []
    this.#result = []

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
    this.#setQueries(this.#findMatchingObservers(queries), options)
  }

  #setQueries(
    { observers: newObservers, options: queryOptions }: ObserverGroup,
    options?: QueriesObserverOptions<TCombinedResult>,
    readers?: Array<QueryObserverResultReader<QueryObserverResult>>,
  ): void {
    this.#options = options

    if (process.env.NODE_ENV !== 'production') {
      const queryHashes = queryOptions.map((query) => query.queryHash)
      if (new Set(queryHashes).size !== queryHashes.length) {
        console.warn(
          '[QueriesObserver]: Duplicate Queries found. This might result in unexpected behavior.',
        )
      }
    }

    notifyManager.batch(() => {
      const prevObservers = this.#observers

      // Apply all options before combining or notifying with the new results.
      this.#updatingQueries = true
      try {
        if (readers) {
          readers.forEach((reader) => reader.commit())
        } else {
          newObservers.forEach((observer, index) =>
            observer.setOptions(queryOptions[index]!),
          )
        }
      } finally {
        this.#updatingQueries = false
      }

      const newResult = newObservers.map((observer) =>
        observer.getCurrentResult(),
      )

      const hasStructuralChange = !equalItems(newObservers, prevObservers)

      if (
        !hasStructuralChange &&
        equalItems(newResult, this.#result, shallowEqualObjects)
      )
        return

      if (hasStructuralChange) {
        this.#observers = newObservers
      }

      this.#result = newResult

      if (!this.hasListeners()) return

      if (hasStructuralChange) {
        difference(prevObservers, newObservers).forEach((observer) => {
          observer.destroy()
        })
        difference(newObservers, prevObservers).forEach((observer) =>
          this.#subscribeTo(observer),
        )
      }

      this.#notify()
    })
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
    const group = this.#findMatchingObservers(queries)
    const readers = group.observers.map((observer, index) =>
      observer.createResultReader(group.options[index]!),
    )
    const queryHashes = group.options.map((query) => query.queryHash)
    const combine = options?.combine
    const context = { ...this.#combineContext }
    let result = this.#result

    const getSnapshot = () => {
      const nextResult = readers.map((reader) => reader.getSnapshot())
      if (!equalItems(nextResult, result)) {
        result = nextResult
      }
      return result
    }

    return {
      getSnapshot,
      combineResult: (input) => {
        // Notifications may have already combined these results.
        const committed = this.#combineContext
        if (matchesCombined(committed, combine, input, queryHashes)) {
          Object.assign(context, committed)
        }
        return this.#combineResult(
          this.#trackResult(input, group.observers, group.options),
          combine,
          queryHashes,
          context,
          input,
        )
      },
      commit: () => {
        this.#combineContext = { ...context }
        this.#setQueries(group, options, readers)
        if (
          this.#options?.combine === combine &&
          equalItems(this.#result, context.result, shallowEqualObjects)
        ) {
          this.#combinedResult = context.value
        }
      },
    }
  }

  #trackResult(
    result: Array<QueryObserverResult>,
    observers = this.#observers,
    options?: Array<DefaultedQueryObserverOptions>,
  ) {
    const trackedProps = new Set<keyof QueryObserverResult>()

    return observers.map((observer, index) => {
      const observerResult = result[index]!
      return !(options?.[index] ?? observer.options).notifyOnChangeProps
        ? observer.trackResult(observerResult, (accessedProp) => {
            // track property on all observers to ensure proper (synchronized) tracking (#7000)
            if (!trackedProps.has(accessedProp)) {
              trackedProps.add(accessedProp)
              observers.forEach((item) => {
                item.trackProp(accessedProp)
              })
            }
          })
        : observerResult
    })
  }

  #combineResult(
    input: Array<QueryObserverResult>,
    combine: CombineFn<TCombinedResult> | undefined,
    queryHashes: Array<string>,
    context = this.#combineContext,
    result = this.#result,
  ): TCombinedResult {
    if (combine) {
      if (!matchesCombined(context, combine, result, queryHashes)) {
        context.value = replaceEqualDeep(context.value, combine(input))
        context.combine = combine
        context.result = result
        context.queryHashes = queryHashes
      }

      return context.value as TCombinedResult
    }
    return input as any
  }

  #shouldSkipCombine(): boolean {
    return (
      !this.#options?.combine ||
      this.#observers.some((observer, index) => {
        const result = this.#result[index]
        const rule = observer.options.throwOnError
        return (
          (observer.options.suspense && result?.data === undefined) ||
          (result?.status === 'error' &&
            result.fetchStatus !== 'fetching' &&
            shouldThrowError(rule, [result.error, observer.getCurrentQuery()]))
        )
      })
    )
  }

  #findMatchingObservers(queries: Array<ObserverOptionsInput>): ObserverGroup {
    const prevObserversMap = Map.groupBy(this.#observers, observerHash)

    const options = queries.map((query) =>
      defaultQueryOptions(this.#client, query),
    )
    const observers = options.map((option) => {
      const match = option.queryHash
        ? prevObserversMap.get(option.queryHash)?.shift()
        : undefined
      return match ?? new QueryObserver(this.#client, option)
    })
    return { observers, options }
  }

  #subscribeTo(observer: QueryObserver): void {
    // Create the listener here, not in `setQueries`: a listener created there
    // keeps the previous observers, and their queries, alive (#12656)
    observer.subscribe((result) => {
      if (this.#updatingQueries) return
      const index = this.#observers.indexOf(observer)
      if (index !== -1) {
        this.#result = this.#result.with(index, result)
        this.#notify()
      }
    })
  }

  #notify(): void {
    if (!this.hasListeners()) return
    if (!this.#shouldSkipCombine()) {
      const value = this.#combineResult(
        this.#trackResult(this.#result),
        this.#options?.combine,
        this.#observers.map(observerHash),
      )
      if (this.#combinedResult === value) return
      this.#combinedResult = value
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
