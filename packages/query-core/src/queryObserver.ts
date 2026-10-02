import { focusManager } from './focusManager'
import { isServer as isServerEnvironment } from './environmentManager'
import { notifyManager } from './notifyManager'
import { fetchState } from './query'
import { Subscribable } from './subscribable'
import {
  isValidTimeout,
  noop,
  replaceData,
  resolveQueryValue,
  shallowEqualObjects,
  timeUntilStale,
} from './utils'
import { timeoutManager } from './timeoutManager'
import type { ManagedTimerId } from './timeoutManager'
import type { FetchOptions, Query, QueryState } from './query'
import type { QueryClient } from './queryClient'
import type {
  DefaultError,
  DefaultedQueryObserverOptions,
  PlaceholderDataFunction,
  QueryKey,
  QueryObserverBaseResult,
  QueryObserverOptions,
  QueryObserverResult,
  RefetchOptions,
} from './types'

type QueryObserverListener<TData, TError> = (
  result: QueryObserverResult<TData, TError>,
) => void

interface ObserverFetchOptions extends FetchOptions {
  throwOnError?: boolean
}

/** A cached view of an observer for one set of render options. */
export interface QueryObserverResultReader<TResult> {
  /** Read the result, retaining its reference while all fields are unchanged. */
  getSnapshot: () => TResult
  /** Apply this reader's options and reusable computation state after commit. */
  commit: () => void
}

/** @internal */
export interface QueryObserverResultContext<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey,
> {
  options?: QueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >
  selectFn?: (data: TQueryData) => TData
  selectData?: TQueryData
  selectResult?: TData
  selectError: TError | null
  selectErrorUpdatedAt?: number
  placeholder?: {
    options: QueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    >
    previousQuery:
      Query<TQueryFnData, TError, TQueryData, TQueryKey> | undefined
    previousData: TQueryData | undefined
    data: TData | undefined
  }
}

/**
 * A `QueryObserver` watches a single query in the `QueryCache` and computes a
 * `QueryObserverResult` from its state, recomputing and notifying subscribers
 * whenever the underlying query (or the observer's options) changes. It is
 * the primitive that framework adapters (e.g. `useQuery`) build their hooks
 * on top of, but it can also be used directly to observe and switch between
 * queries outside of any framework.
 *
 * @example
 * ```ts
 * const observer = new QueryObserver(queryClient, {
 *   queryKey: ['posts'],
 *   queryFn: fetchPosts,
 * })
 *
 * const unsubscribe = observer.subscribe((result) => {
 *   console.log(result.data)
 * })
 * ```
 */
export class QueryObserver<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends Subscribable<QueryObserverListener<TData, TError>> {
  #client: QueryClient
  #currentQuery: Query<TQueryFnData, TError, TQueryData, TQueryKey> = undefined!
  #currentQueryInitialState: QueryState<TQueryData, TError> = undefined!
  #currentResult: QueryObserverResult<TData, TError> = undefined!
  #resultContext: QueryObserverResultContext<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  > = { selectError: null }
  // This property keeps track of the last query with defined data.
  // It will be used to pass the previous data and query to the placeholder function between renders.
  #lastQueryWithDefinedData?: Query<TQueryFnData, TError, TQueryData, TQueryKey>
  #staleTimeoutId?: ManagedTimerId
  #refetchIntervalId?: ManagedTimerId
  #currentRefetchInterval?: number | false
  #trackedProps = new Set<keyof QueryObserverResult>()

  constructor(
    client: QueryClient,
    public options: QueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    >,
  ) {
    super()

    this.#client = client

    this.bindMethods()
    this.setOptions(options)
  }

  protected bindMethods(): void {
    this.refetch = this.refetch.bind(this)
  }

  protected onSubscribe(): void {
    if (this.listeners.size === 1) {
      this.#currentQuery.addObserver(this)

      if (shouldFetchOnMount(this.#currentQuery, this.options)) {
        this.#executeFetch()
      } else {
        this.updateResult()
      }

      this.#updateTimers()
    }
  }

  protected onUnsubscribe(): void {
    if (!this.hasListeners()) {
      this.destroy()
    }
  }

  /**
   * Returns whether the observed query is currently stale and configured
   * (via the `refetchOnReconnect` option) to refetch when the network
   * reconnects.
   */
  shouldFetchOnReconnect(): boolean {
    return shouldFetchOn(
      this.#currentQuery,
      this.options,
      this.options.refetchOnReconnect,
    )
  }

  /**
   * Returns whether the observed query is currently stale and configured
   * (via the `refetchOnWindowFocus` option) to refetch when the window
   * regains focus.
   */
  shouldFetchOnWindowFocus(): boolean {
    return shouldFetchOn(
      this.#currentQuery,
      this.options,
      this.options.refetchOnWindowFocus,
    )
  }

  /**
   * Stops observing the current query: clears all listeners, cancels the
   * stale and refetch-interval timers, and removes this observer from the
   * query it was observing.
   */
  destroy(): void {
    this.listeners = new Set()
    this.#clearStaleTimeout()
    this.#clearRefetchInterval()
    this.#currentQuery.removeObserver(this)
  }

  /**
   * Updates the observer's options. This will re-resolve the query being
   * observed (switching to a different query if the `queryKey` changed),
   * trigger a fetch if the new options require one and the observer has
   * subscribers, recompute the current result, and reschedule the stale and
   * refetch-interval timers as needed.
   *
   * @example
   * ```ts
   * observer.setOptions({ queryKey: ['posts', 1], queryFn: () => fetchPost(1) })
   * // later: switch to a different query, reusing the same observer
   * observer.setOptions({ queryKey: ['posts', 2], queryFn: () => fetchPost(2) })
   * ```
   */
  setOptions(
    options: QueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    >,
  ): void {
    const prevOptions = this.options
    const prevQuery = this.#currentQuery

    this.options = this.#client.defaultQueryOptions(options)

    if (
      this.options.enabled !== undefined &&
      typeof this.options.enabled !== 'boolean' &&
      typeof this.options.enabled !== 'function' &&
      typeof resolveQueryValue(this.options.enabled, this.#currentQuery) !==
        'boolean'
    ) {
      throw new Error(
        'Expected enabled to be a boolean or a callback that returns a boolean',
      )
    }

    this.#updateQuery()
    this.#currentQuery.setOptions(this.options)

    if (
      prevOptions._defaulted &&
      !shallowEqualObjects(this.options, prevOptions)
    ) {
      this.#client.getQueryCache().notify({
        type: 'observerOptionsUpdated',
        query: this.#currentQuery,
        observer: this,
      })
    }

    const mounted = this.hasListeners()

    // Fetch if there are subscribers
    if (
      mounted &&
      shouldFetchOptionally(
        this.#currentQuery,
        prevQuery,
        this.options,
        prevOptions,
      )
    ) {
      this.#executeFetch()
    }

    // Update result
    this.updateResult()

    // Update stale interval if needed
    if (
      mounted &&
      (this.#currentQuery !== prevQuery ||
        resolveQueryValue(this.options.enabled, this.#currentQuery) !==
          resolveQueryValue(prevOptions.enabled, this.#currentQuery) ||
        resolveQueryValue(this.options.staleTime, this.#currentQuery) !==
          resolveQueryValue(prevOptions.staleTime, this.#currentQuery))
    ) {
      this.#updateStaleTimeout()
    }

    const nextRefetchInterval = this.#computeRefetchInterval()

    // Update refetch interval if needed
    if (
      mounted &&
      (this.#currentQuery !== prevQuery ||
        resolveQueryValue(this.options.enabled, this.#currentQuery) !==
          resolveQueryValue(prevOptions.enabled, this.#currentQuery) ||
        nextRefetchInterval !== this.#currentRefetchInterval)
    ) {
      this.#updateRefetchInterval(nextRefetchInterval)
    }
  }

  /**
   * Computes the result the observer would produce for the given (already-defaulted) options
   * right now, building the underlying `Query` if it doesn't exist yet, without waiting for a
   * subscription callback. Uses a separate result reader, so reading does not change the
   * observer's committed result, options, or selection state.
   * @deprecated Use `createResultReader(options).getSnapshot()` instead.
   */
  getOptimisticResult(
    options: DefaultedQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    >,
  ): QueryObserverResult<TData, TError> {
    return this.createResultReader(options).getSnapshot()
  }

  /**
   * Creates a result reader that captures the supplied query options.
   * Reads cache the complete result locally and retain its reference while its
   * fields are unchanged. They do not update this observer's committed result,
   * options, or selection state. Missing queries are built in the query cache.
   * Call `commit` after the render commits to apply the options and reuse the
   * reader's computation. An abandoned reader needs no cleanup.
   */
  createResultReader(
    options: DefaultedQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    >,
  ): QueryObserverResultReader<QueryObserverResult<TData, TError>> {
    options = { ...options }
    const context = { ...this.#resultContext }
    let result = this.#currentResult

    const getSnapshot = () => {
      const query = this.#client.getQueryCache().build(this.#client, options)
      const committed = this.#resultContext

      // A query update may already have selected this data. Copy its memo,
      // without sharing the mutable computation context with this reader.
      if (
        query.state.data !== undefined &&
        committed.selectData === query.state.data &&
        committed.selectFn === options.select &&
        committed.options?.structuralSharing === options.structuralSharing
      ) {
        context.selectFn = committed.selectFn
        context.selectData = committed.selectData
        context.selectResult = committed.selectResult
        context.selectError = committed.selectError
        context.selectErrorUpdatedAt = committed.selectErrorUpdatedAt
      }

      const nextResult = this.createResult(query, options, context, result)
      if (!shallowEqualObjects(nextResult, result)) {
        result = nextResult
      }
      context.options = options
      return result
    }

    return {
      getSnapshot,
      commit: () => {
        // Recheck the source before adopting a render's memo: the cache may
        // have changed between the render and the options effect.
        getSnapshot()
        // Reuse the computation while retaining the stored result for
        // updateResult's comparison and subscriber notifications.
        this.#resultContext = { ...context }
        this.setOptions(options)
      },
    }
  }

  /**
   * Returns the most recently computed `QueryObserverResult` for the
   * observed query. This is a point-in-time read; to be notified of updates
   * as they happen, subscribe to the observer instead (its inherited
   * `subscribe` method).
   *
   * @example
   * ```ts
   * const result = observer.getCurrentResult()
   * console.log(result.status, result.data)
   * ```
   */
  getCurrentResult(): QueryObserverResult<TData, TError> {
    return this.#currentResult
  }

  /**
   * Wraps a `QueryObserverResult` in a `Proxy` that records which properties are read, via
   * {@link QueryObserver#trackProp} (and an optional `onPropTracked` callback). Used by framework
   * adapters when `notifyOnChangeProps` is not set, to implement its default "only re-render on
   * properties you actually read" behavior.
   */
  trackResult(
    result: QueryObserverResult<TData, TError>,
    onPropTracked?: (key: keyof QueryObserverResult) => void,
  ): QueryObserverResult<TData, TError> {
    return new Proxy(result, {
      get: (target, key) => {
        this.trackProp(key as keyof QueryObserverResult)
        onPropTracked?.(key as keyof QueryObserverResult)
        return Reflect.get(target, key)
      },
    })
  }

  /**
   * Records that the given `QueryObserverResult` property was read, so a subsequent update only
   * notifies this observer if a tracked property actually changed. Normally called indirectly via
   * {@link QueryObserver#trackResult}'s proxy; exposed directly for adapters that track property
   * access themselves (e.g. through their own reactivity system) instead of via the proxy.
   */
  trackProp(key: keyof QueryObserverResult) {
    this.#trackedProps.add(key)
  }

  /**
   * Returns the `Query` instance this observer is currently observing.
   */
  getCurrentQuery(): Query<TQueryFnData, TError, TQueryData, TQueryKey> {
    return this.#currentQuery
  }

  /**
   * Refetches the observed query and returns a promise that resolves with
   * the resulting `QueryObserverResult`.
   *
   * @example
   * ```ts
   * const result = await observer.refetch({ cancelRefetch: false })
   * console.log(result.data)
   * ```
   */
  refetch({ ...options }: RefetchOptions = {}): Promise<
    QueryObserverResult<TData, TError>
  > {
    return this.fetch({
      ...options,
    })
  }

  /**
   * Fetches a query defined by the given options without affecting this
   * observer's own tracked query or result, and returns a promise that
   * resolves with the `QueryObserverResult` for that fetch. This is useful
   * for prefetching data that another observer (e.g. a query about to be
   * navigated to) will need, ahead of time.
   *
   * @example
   * ```ts
   * const result = await observer.fetchOptimistic({
   *   queryKey: ['posts', 2],
   *   queryFn: () => fetchPost(2),
   * })
   * console.log(result.data)
   * ```
   */
  fetchOptimistic(
    options: QueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    >,
  ): Promise<QueryObserverResult<TData, TError>> {
    const defaultedOptions = this.#client.defaultQueryOptions(options)

    const query = this.#client
      .getQueryCache()
      .build(this.#client, defaultedOptions)

    let unsubscribe = () => {}
    let resolveEarly:
      ((result: QueryObserverResult<TData, TError>) => void) | undefined

    const cachePromise = new Promise<QueryObserverResult<TData, TError>>(
      (resolve) => {
        resolveEarly = resolve
        unsubscribe = this.#client.getQueryCache().subscribe((event) => {
          if (
            event.type === 'updated' &&
            event.query.queryHash === query.queryHash &&
            query.state.data !== undefined
          ) {
            unsubscribe()
            resolve(this.createResult(query, defaultedOptions))
          }
        })
      },
    )

    return Promise.race([
      query
        .fetch()
        .then(() => {
          const result = this.createResult(query, defaultedOptions)
          // Settle the subscriber promise so both branches always settle.
          // This value is ignored by Promise.race since the fetch branch already won.
          resolveEarly?.(result)
          return result
        })
        .finally(() => {
          unsubscribe()
        }),
      cachePromise,
    ])
  }

  protected fetch(
    fetchOptions: ObserverFetchOptions,
  ): Promise<QueryObserverResult<TData, TError>> {
    return this.#executeFetch({
      ...fetchOptions,
      cancelRefetch: fetchOptions.cancelRefetch ?? true,
    }).then(() => {
      this.updateResult()
      return this.#currentResult
    })
  }

  #executeFetch(
    fetchOptions?: Omit<ObserverFetchOptions, 'initialPromise'>,
  ): Promise<TQueryData | undefined> {
    // Make sure we reference the latest query as the current one might have been removed
    this.#updateQuery()

    // Fetch
    let promise: Promise<TQueryData | undefined> = this.#currentQuery.fetch(
      this.options,
      fetchOptions,
    )

    if (!fetchOptions?.throwOnError) {
      promise = promise.catch(noop)
    }

    return promise
  }

  #shouldScheduleTimer(timeout: unknown): timeout is number {
    return (
      !isServerEnvironment() &&
      resolveQueryValue(this.options.enabled, this.#currentQuery) !== false &&
      isValidTimeout(timeout)
    )
  }

  #updateStaleTimeout(): void {
    this.#clearStaleTimeout()
    const staleTime = resolveQueryValue(
      this.options.staleTime,
      this.#currentQuery,
    )

    if (this.#currentResult.isStale || !this.#shouldScheduleTimer(staleTime)) {
      return
    }

    const time = timeUntilStale(this.#currentResult.dataUpdatedAt, staleTime)

    // The timeout is sometimes triggered 1 ms before the stale time expiration.
    // To mitigate this issue we always add 1 ms to the timeout.
    const timeout = time + 1

    this.#staleTimeoutId = timeoutManager.setTimeout(() => {
      if (!this.#currentResult.isStale) {
        this.updateResult()
      }
    }, timeout)
  }

  #computeRefetchInterval() {
    return (
      resolveQueryValue(this.options.refetchInterval, this.#currentQuery) ??
      false
    )
  }

  #updateRefetchInterval(nextInterval: number | false): void {
    this.#clearRefetchInterval()

    this.#currentRefetchInterval = nextInterval

    if (
      this.#currentRefetchInterval === 0 ||
      !this.#shouldScheduleTimer(this.#currentRefetchInterval)
    ) {
      return
    }

    this.#refetchIntervalId = timeoutManager.setInterval(() => {
      if (
        this.options.refetchIntervalInBackground ||
        focusManager.isFocused()
      ) {
        this.#executeFetch()
      }
    }, this.#currentRefetchInterval)
  }

  #updateTimers(): void {
    this.#updateStaleTimeout()
    this.#updateRefetchInterval(this.#computeRefetchInterval())
  }

  #clearStaleTimeout(): void {
    if (this.#staleTimeoutId !== undefined) {
      timeoutManager.clearTimeout(this.#staleTimeoutId)
      this.#staleTimeoutId = undefined
    }
  }

  #clearRefetchInterval(): void {
    if (this.#refetchIntervalId !== undefined) {
      timeoutManager.clearInterval(this.#refetchIntervalId)
      this.#refetchIntervalId = undefined
    }
  }

  protected createResult(
    query: Query<TQueryFnData, TError, TQueryData, TQueryKey>,
    options: QueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    >,
    context = this.#resultContext,
    prevResult = this.#currentResult as
      QueryObserverResult<TData, TError> | undefined,
  ): QueryObserverResult<TData, TError> {
    const prevQuery = this.#currentQuery
    const prevOptions = this.options
    const queryChange = query !== prevQuery
    const queryInitialState = queryChange
      ? query.state
      : this.#currentQueryInitialState

    const { state } = query
    let newState = { ...state }
    let isPlaceholderData = false
    let data: TData | undefined

    // Optimistically set result in fetching state if needed
    if (options._optimisticResults) {
      const mounted = this.hasListeners()

      const fetchOnMount = !mounted && shouldFetchOnMount(query, options)

      const fetchOptionally =
        mounted && shouldFetchOptionally(query, prevQuery, options, prevOptions)

      if (fetchOnMount || fetchOptionally) {
        newState = {
          ...newState,
          ...fetchState(state.data, query.options),
        }
      }
      if (options._optimisticResults === 'isRestoring') {
        newState.fetchStatus = 'idle'
      }
    }

    let { error, errorUpdatedAt, status } = newState

    // Per default, use query data
    data = newState.data as unknown as TData

    // Cache the unselected placeholder, including when selection throws. The
    // result's isPlaceholderData flag is false after a selection error, so it
    // cannot serve as the memo's validity check.
    if (
      options.placeholderData !== undefined &&
      data === undefined &&
      status === 'pending'
    ) {
      const previousQuery = this.#lastQueryWithDefinedData
      const previousData = previousQuery?.state.data
      const placeholder = context.placeholder

      if (
        placeholder &&
        placeholder.options.placeholderData === options.placeholderData &&
        placeholder.options.structuralSharing === options.structuralSharing &&
        placeholder.previousQuery === previousQuery &&
        placeholder.previousData === previousData
      ) {
        data = placeholder.data
      } else {
        const placeholderData =
          typeof options.placeholderData === 'function'
            ? (
                options.placeholderData as unknown as PlaceholderDataFunction<TQueryData>
              )(previousData, previousQuery as any)
            : options.placeholderData

        data =
          placeholderData === undefined
            ? undefined
            : (replaceData(
                prevResult?.data,
                placeholderData as unknown,
                options,
              ) as TData)
        context.placeholder =
          data === undefined
            ? undefined
            : { options, previousQuery, previousData, data }
      }

      if (data !== undefined) {
        status = 'success'
        isPlaceholderData = true
      }
    } else {
      context.placeholder = undefined
    }

    // Select data if needed
    // this also runs placeholderData through the select function
    if (options.select && data !== undefined) {
      // Memoize select result
      if (
        prevResult &&
        data === context.selectData &&
        options.select === context.selectFn
      ) {
        data = context.selectResult
      } else {
        try {
          context.selectFn = options.select
          context.selectData = data as unknown as TQueryData
          data = options.select(data as any)
          data = replaceData(prevResult?.data, data, options)
          context.selectResult = data
          context.selectError = null
          context.selectErrorUpdatedAt = undefined
        } catch (selectError) {
          context.selectError = selectError as TError
          context.selectErrorUpdatedAt = Date.now()
        }
      }
    } else if (data === undefined) {
      // a stored select error belongs to previously selected data; once that
      // data is gone (query switch or reset), it must not leak into this result
      context.selectError = null
      context.selectErrorUpdatedAt = undefined
      context.selectData = undefined
    }

    if (context.selectError) {
      error = context.selectError
      data = context.selectResult
      errorUpdatedAt = context.selectErrorUpdatedAt ?? Date.now()
      status = 'error'
      isPlaceholderData = false
    }

    const isFetching = newState.fetchStatus === 'fetching'
    const isPending = status === 'pending'
    const isError = status === 'error'

    const isLoading = isPending && isFetching
    const hasData = data !== undefined

    const result: QueryObserverBaseResult<TData, TError> = {
      status,
      fetchStatus: newState.fetchStatus,
      isPending,
      isSuccess: status === 'success',
      isError,
      isInitialLoading: isLoading,
      isLoading,
      data,
      dataUpdatedAt: newState.dataUpdatedAt,
      error,
      errorUpdatedAt,
      failureCount: newState.fetchFailureCount,
      failureReason: newState.fetchFailureReason,
      errorUpdateCount: newState.errorUpdateCount,
      isFetched: query.isFetched(),
      isFetchedAfterMount:
        newState.dataUpdateCount > queryInitialState.dataUpdateCount ||
        newState.errorUpdateCount > queryInitialState.errorUpdateCount,
      isFetching,
      isRefetching: isFetching && !isPending,
      isLoadingError: isError && !hasData,
      isPaused: newState.fetchStatus === 'paused',
      isPlaceholderData,
      isRefetchError: isError && hasData,
      isStale: isStale(query, options),
      refetch: this.refetch,
      isEnabled: resolveQueryValue(options.enabled, query) !== false,
    }

    const nextResult = result as QueryObserverResult<TData, TError>

    return nextResult
  }

  /**
   * Recomputes and stores the current result from the current query/options, notifying listeners
   * if it changed. Framework adapters call this right after subscribing to make sure no query
   * update was missed in the gap between creating the observer and subscribing to it.
   */
  updateResult(): void {
    const prevResult = this.#currentResult as
      QueryObserverResult<TData, TError> | undefined

    const nextResult = this.createResult(this.#currentQuery, this.options)

    this.#resultContext.options = this.options

    if (this.#currentQuery.state.data !== undefined) {
      this.#lastQueryWithDefinedData = this.#currentQuery
    }

    // Only notify and update result if something has changed
    if (shallowEqualObjects(nextResult, prevResult)) {
      return
    }

    this.#currentResult = nextResult

    const shouldNotifyListeners = (): boolean => {
      if (!prevResult) {
        return true
      }

      const { notifyOnChangeProps } = this.options
      const notifyOnChangePropsValue =
        typeof notifyOnChangeProps === 'function'
          ? notifyOnChangeProps()
          : notifyOnChangeProps

      if (
        notifyOnChangePropsValue === 'all' ||
        (!notifyOnChangePropsValue && !this.#trackedProps.size)
      ) {
        return true
      }

      const includedProps = new Set(
        notifyOnChangePropsValue ?? this.#trackedProps,
      )

      if (this.options.throwOnError) {
        includedProps.add('error')
      }

      return Object.keys(this.#currentResult).some((key) => {
        const typedKey = key as keyof QueryObserverResult
        const changed = this.#currentResult[typedKey] !== prevResult[typedKey]

        return changed && includedProps.has(typedKey)
      })
    }

    const notifyListeners = shouldNotifyListeners()

    notifyManager.batch(() => {
      // First, trigger the listeners
      if (notifyListeners) {
        this.listeners.forEach((listener) => {
          listener(this.#currentResult)
        })
      }

      // Then the cache listeners
      this.#client.getQueryCache().notify({
        query: this.#currentQuery,
        type: 'observerResultsUpdated',
      })
    })
  }

  #updateQuery(): void {
    const query = this.#client.getQueryCache().build(this.#client, this.options)

    if (query === this.#currentQuery) {
      return
    }

    const prevQuery = this.#currentQuery as
      Query<TQueryFnData, TError, TQueryData, TQueryKey> | undefined
    this.#currentQuery = query
    this.#currentQueryInitialState = query.state

    if (this.hasListeners()) {
      prevQuery?.removeObserver(this)
      query.addObserver(this)
    }
  }

  /** @internal */
  onQueryUpdate(): void {
    this.updateResult()

    if (this.hasListeners()) {
      this.#updateTimers()
    }
  }
}

function shouldLoadOnMount(
  query: Query<any, any, any, any>,
  options: QueryObserverOptions<any, any, any, any>,
): boolean {
  return (
    resolveQueryValue(options.enabled, query) !== false &&
    query.state.data === undefined &&
    !(
      query.state.status === 'error' &&
      resolveQueryValue(options.retryOnMount, query) === false
    )
  )
}

function shouldFetchOnMount(
  query: Query<any, any, any, any>,
  options: QueryObserverOptions<any, any, any, any, any>,
): boolean {
  return (
    shouldLoadOnMount(query, options) ||
    (query.state.data !== undefined &&
      shouldFetchOn(query, options, options.refetchOnMount))
  )
}

function shouldFetchOn(
  query: Query<any, any, any, any>,
  options: QueryObserverOptions<any, any, any, any, any>,
  field: (typeof options)['refetchOnMount'] &
    (typeof options)['refetchOnWindowFocus'] &
    (typeof options)['refetchOnReconnect'],
) {
  if (
    resolveQueryValue(options.enabled, query) !== false &&
    resolveQueryValue(options.staleTime, query) !== 'static'
  ) {
    const value = resolveQueryValue(field, query)

    return value === 'always' || (value !== false && isStale(query, options))
  }
  return false
}

function shouldFetchOptionally(
  query: Query<any, any, any, any>,
  prevQuery: Query<any, any, any, any>,
  options: QueryObserverOptions<any, any, any, any, any>,
  prevOptions: QueryObserverOptions<any, any, any, any, any>,
): boolean {
  return (
    (query !== prevQuery ||
      resolveQueryValue(prevOptions.enabled, query) === false) &&
    (!options.suspense || query.state.status !== 'error') &&
    isStale(query, options)
  )
}

function isStale(
  query: Query<any, any, any, any>,
  options: QueryObserverOptions<any, any, any, any, any>,
): boolean {
  return (
    resolveQueryValue(options.enabled, query) !== false &&
    query.isStaleByTime(resolveQueryValue(options.staleTime, query))
  )
}
