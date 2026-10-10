import {
  ensureQueryFn,
  noop,
  replaceData,
  resolveQueryValue,
  skipToken,
  timeUntilStale,
} from './utils'
import { notifyManager } from './notifyManager'
import { CancelledError, canFetch, createRetryer } from './retryer'
import { Removable } from './removable'
import { infiniteQueryBehavior } from './infiniteQueryBehavior'
import type { QueryCache } from './queryCache'
import type { QueryClient } from './queryClient'
import type {
  CancelOptions,
  DefaultError,
  FetchStatus,
  InitialDataFunction,
  OmitKeyof,
  QueryFunctionContext,
  QueryKey,
  QueryMeta,
  QueryOptions,
  QueryStatus,
  SetDataOptions,
  StaleTime,
} from './types'
import type { QueryObserver } from './queryObserver'
import type { Retryer } from './retryer'

// TYPES

interface QueryConfig<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey = QueryKey,
> {
  client: QueryClient
  queryKey: TQueryKey
  queryHash: string
  options?: QueryOptions<TQueryFnData, TError, TData, TQueryKey>
  defaultOptions?: QueryOptions<TQueryFnData, TError, TData, TQueryKey>
  state?: QueryState<TData, TError>
}

/**
 * The raw state stored on a `Query` instance. This is the underlying state
 * that observer results (e.g. `QueryObserverResult`) are derived from.
 */
export interface QueryState<TData = unknown, TError = DefaultError> {
  /**
   * The last successfully resolved data for the query.
   */
  data: TData | undefined
  /**
   * The number of times the query has successfully resolved.
   */
  dataUpdateCount: number
  /**
   * The timestamp for when the query most recently returned the `status` as `"success"`.
   */
  dataUpdatedAt: number
  /**
   * The error object for the query, if the last attempt resulted in an error.
   * - Defaults to `null`.
   */
  error: TError | null
  /**
   * The sum of all errors, incremented every time the query resolves with an error.
   */
  errorUpdateCount: number
  /**
   * The timestamp for when the query most recently returned the `status` as `"error"`.
   */
  errorUpdatedAt: number
  /**
   * The failure count for the current fetch.
   * - Incremented every time the fetch fails.
   * - Reset to `0` when the fetch succeeds.
   */
  fetchFailureCount: number
  /**
   * The reason the current fetch failed, as reported by the retryer.
   * - Reset to `null` when the fetch succeeds.
   */
  fetchFailureReason: TError | null
  /**
   * Metadata passed to the currently in-flight (or most recent) fetch, e.g. the
   * `fetchMore` direction for infinite queries.
   */
  fetchMeta: FetchMeta | null
  /**
   * Whether the query has been marked as invalidated via `invalidate()`.
   * - Reset to `false` whenever the query resolves successfully.
   */
  isInvalidated: boolean
  /**
   * The status of the query.
   * - `pending` if there's no cached data and no attempt was finished yet.
   * - `error` if the last attempt resulted in an error.
   * - `success` if the query has data.
   */
  status: QueryStatus
  /**
   * The fetch status of the query.
   * - `fetching`: the `queryFn` is currently executing.
   * - `paused`: a fetch wanted to run but has been paused (see network mode).
   * - `idle`: the query is not fetching.
   */
  fetchStatus: FetchStatus
}

/**
 * The context passed to a {@link QueryBehavior}'s `onFetch`, which can replace `fetchFn` to change
 * how the query fetches (e.g. to fetch pages for an infinite query).
 */
export interface FetchContext<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey = QueryKey,
> {
  /**
   * The function that runs the fetch. By default it calls `queryFn`; `onFetch` can replace it.
   */
  fetchFn: () => unknown | Promise<unknown>
  /**
   * The options of this fetch.
   */
  fetchOptions?: FetchOptions
  /**
   * The `AbortSignal` that aborts when the fetch is cancelled.
   */
  signal: AbortSignal
  /**
   * The options of the query.
   */
  options: QueryOptions<TQueryFnData, TError, TData, any>
  /**
   * The `QueryClient` the query belongs to.
   */
  client: QueryClient
  /**
   * The key of the query.
   */
  queryKey: TQueryKey
  /**
   * The state of the query when the fetch starts.
   */
  state: QueryState<TData, TError>
}

/**
 * Customizes how a query fetches, e.g. the behavior that fetches the pages of an infinite query.
 */
export interface QueryBehavior<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> {
  /**
   * Called before each fetch of the query, e.g. to replace `fetchFn` in the context.
   */
  onFetch: (
    context: FetchContext<TQueryFnData, TError, TData, TQueryKey>,
    query: Query,
  ) => void
}

/**
 * The direction an infinite query fetches in: `'forward'` for the next page, `'backward'` for the
 * previous one.
 */
export type FetchDirection = 'forward' | 'backward'

/**
 * Metadata for a fetch, e.g. the direction when an infinite query fetches more pages.
 */
export interface FetchMeta {
  /**
   * Set when an infinite query fetches another page, with the direction to fetch in.
   */
  fetchMore?: { direction: FetchDirection }
}

/**
 * Options for a single fetch of a query.
 */
export interface FetchOptions<TData = unknown> {
  /**
   * If `true`, an in-flight fetch is cancelled before starting a new one, when the query already
   * has data. Otherwise, the in-flight fetch is reused.
   */
  cancelRefetch?: boolean
  /**
   * Metadata of the fetch, stored in the query's `fetchMeta` state.
   */
  meta?: FetchMeta
  /**
   * A promise to use for the first attempt instead of calling `fetchFn`, e.g. a pending promise
   * restored by `hydrate`.
   */
  initialPromise?: Promise<TData>
}

interface FailedAction<TError> {
  type: 'failed'
  failureCount: number
  error: TError
}

interface FetchAction {
  type: 'fetch'
  meta?: FetchMeta
}

interface SuccessAction<TData> {
  data: TData | undefined
  type: 'success'
  dataUpdatedAt?: number
  manual?: boolean
}

interface ErrorAction<TError> {
  type: 'error'
  error: TError
}

interface InvalidateAction {
  type: 'invalidate'
}

interface PauseAction {
  type: 'pause'
}

interface ContinueAction {
  type: 'continue'
}

interface SetStateAction<TData, TError> {
  type: 'setState'
  state: Partial<QueryState<TData, TError>>
}

/**
 * The actions a query dispatches to update its state, e.g. when it starts fetching, fails, or
 * succeeds.
 */
export type Action<TData, TError> =
  | ContinueAction
  | ErrorAction<TError>
  | FailedAction<TError>
  | FetchAction
  | InvalidateAction
  | PauseAction
  | SetStateAction<TData, TError>
  | SuccessAction<TData>

// CLASS

/**
 * Represents a single cached query. A `Query` holds the query's key, options,
 * state (data/error/status), and the observers currently subscribed to it.
 *
 * Instances are created and managed internally by `QueryCache`; application
 * code typically interacts with queries indirectly through `QueryClient` or
 * a framework hook like `useQuery`. Direct access to a `Query` instance is
 * possible via `queryCache.find()`/`findAll()` for inspecting cache state.
 * @example
 * ```ts
 * const queryCache = queryClient.getQueryCache()
 * const query = queryCache.find({ queryKey: ['posts'] })
 *
 * if (query) {
 *   console.log(query.state.dataUpdatedAt)
 * }
 * ```
 */
export class Query<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends Removable {
  queryKey: TQueryKey
  queryHash: string
  options!: QueryOptions<TQueryFnData, TError, TData, TQueryKey>
  state: QueryState<TData, TError>
  #queryType?: 'infinite'

  #initialState: QueryState<TData, TError>
  #revertState?: QueryState<TData, TError>
  #cache: QueryCache
  #client: QueryClient
  #retryer?: Retryer<TData>
  observers: Array<QueryObserver<any, any, any, any, any>>
  #defaultOptions?: QueryOptions<TQueryFnData, TError, TData, TQueryKey>
  #abortSignalConsumed: boolean

  constructor(config: QueryConfig<TQueryFnData, TError, TData, TQueryKey>) {
    super()

    this.#abortSignalConsumed = false
    this.#defaultOptions = config.defaultOptions
    this.setOptions(config.options)
    this.observers = []
    this.#client = config.client
    this.#cache = this.#client.getQueryCache()
    this.queryKey = config.queryKey
    this.queryHash = config.queryHash
    this.#initialState = getDefaultState(this.options)
    this.state = config.state ?? this.#initialState
    this.scheduleGc()
  }
  /**
   * The `meta` object passed in the query's options, if any.
   * @returns The query's `meta`, or `undefined` if none was set.
   */
  get meta(): QueryMeta | undefined {
    return this.options.meta
  }

  /**
   * `'infinite'` for an infinite query, otherwise `undefined`.
   * @internal
   * @returns The type of the query, set from the `_type` option (e.g. `'infinite'`).
   */
  get queryType() {
    return this.#queryType
  }

  /**
   * The promise for the currently in-flight fetch, if the query is fetching.
   * `undefined` when the query is not fetching.
   * @returns The promise of the in-flight fetch, or `undefined`.
   */
  get promise(): Promise<TData> | undefined {
    return this.#retryer?.promise
  }

  /**
   * Replaces the query's options and applies their `gcTime`. If the query has no data yet, it gets
   * the `initialData` from the new options, if any.
   * @internal
   * @param options - The new query options, merged on top of the query's default options.
   */
  setOptions(
    options?: QueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  ): void {
    this.options = { ...this.#defaultOptions, ...options }

    if (options?._type) {
      this.#queryType = options._type
    }

    this.updateGcTime(this.options.gcTime)

    // oxlint-disable-next-line typescript/no-unnecessary-condition
    if (this.state && this.state.data === undefined) {
      const defaultState = getDefaultState(this.options)
      if (defaultState.data !== undefined) {
        this.setState(
          successState(defaultState.data, defaultState.dataUpdatedAt),
        )
        this.#initialState = defaultState
      }
    }
  }

  protected override optionalRemove() {
    if (!this.observers.length && this.state.fetchStatus === 'idle') {
      this.#cache.remove(this)
    }
  }

  /**
   * Writes new data to the query and marks it as successfully fetched.
   * @internal
   * @param newData - The data to write. Structural sharing with the current data is applied.
   * @param options - Set `updatedAt` to override the timestamp, and `manual` to mark the write as
   * manual (e.g. from `queryClient.setQueryData`).
   * @returns The data that was written.
   */
  setData(
    newData: TData,
    options?: SetDataOptions & { manual: boolean },
  ): TData {
    const data = replaceData(this.state.data, newData, this.options)

    // Set data and mark it as cached
    this.#dispatch({
      data,
      type: 'success',
      dataUpdatedAt: options?.updatedAt,
      manual: options?.manual,
    })

    return data
  }

  /**
   * Merges the given partial state directly into this query's state, notifying observers. Used
   * by persistence and broadcast plugins to restore a state snapshot, and by devtools to let a
   * user manually trigger a loading/error state or edit the cached data.
   * @param state - The partial state to merge into the query's state.
   */
  setState(state: Partial<QueryState<TData, TError>>): void {
    this.#dispatch({ type: 'setState', state })
  }

  /**
   * Cancels the query's currently in-flight fetch, if any.
   * - Returns a promise that resolves once the cancellation has settled.
   * - If no fetch is in progress, resolves immediately.
   * @param options - Set `revert` to restore the state from before the fetch started, and `silent`
   * to suppress the cancellation error when a new fetch replaces the cancelled one.
   * @returns A promise that resolves once the cancellation has settled.
   * @example
   * ```ts
   * await query.cancel()
   * ```
   */
  cancel(options?: CancelOptions): Promise<void> {
    const promise = this.#retryer?.promise
    this.#retryer?.cancel(options)
    return promise ? promise.then(noop).catch(noop) : Promise.resolve()
  }

  /**
   * Clears the query's garbage collection timeout and silently cancels any
   * in-flight fetch. Called by `QueryCache` when the query is removed from
   * the cache.
   * @see {@link Query#cancel}
   */
  override destroy(): void {
    super.destroy()

    this.cancel({ silent: true })
  }

  /**
   * The state the query was created with.
   * @internal
   * @returns The state the query had when it was first created, used by {@link Query#reset}.
   */
  get resetState(): QueryState<TData, TError> {
    return this.#initialState
  }

  /**
   * Resets the query back to its initial state (the state it had when it was
   * first created, e.g. any `initialData`), destroying it first to cancel any
   * in-flight fetch.
   */
  reset(): void {
    this.destroy()
    this.setState(this.resetState)
  }

  /**
   * Returns `true` if the query has at least one observer for which `enabled`
   * does not resolve to `false`.
   * @returns `true` if the query has an enabled observer.
   */
  isActive(): boolean {
    return this.observers.some(
      (observer) => resolveQueryValue(observer.options.enabled, this) !== false,
    )
  }

  /**
   * Returns `true` if the query is disabled, meaning it will not fetch
   * automatically.
   * - If the query has observers, it is disabled when none of them are active
   *   (see `isActive`).
   * - If the query has no observers, it is disabled when its `queryFn` is
   *   `skipToken` or it has never been fetched.
   * @returns `true` if the query is disabled.
   */
  isDisabled(): boolean {
    if (this.getObserversCount() > 0) {
      return !this.isActive()
    }
    // if a query has no observers, it should still be considered disabled if it never attempted a fetch
    return this.options.queryFn === skipToken || !this.isFetched()
  }

  /**
   * Returns `true` if the query has been fetched, i.e. it has resolved with
   * either data or an error at least once.
   * @returns `true` if the query has been fetched.
   */
  isFetched() {
    return this.state.dataUpdateCount + this.state.errorUpdateCount > 0
  }

  /**
   * Returns `true` if the query has at least one observer configured with
   * `staleTime: 'static'`, meaning it is treated as never stale.
   * @returns `true` if the query is static.
   */
  isStatic(): boolean {
    if (this.getObserversCount() > 0) {
      return this.observers.some(
        (observer) =>
          resolveQueryValue(observer.options.staleTime, this) === 'static',
      )
    }

    return false
  }

  /**
   * Returns `true` if the query is stale.
   * - If the query has observers, defers to whether any observer's current
   *   result reports `isStale` (which accounts for each observer's own
   *   `staleTime` and `enabled` state).
   * - If the query has no observers, it is considered stale when it has no
   *   data or has been invalidated.
   * @returns `true` if the query is stale.
   * @see {@link Query#isStaleByTime}
   * @example
   * ```ts
   * if (query.isStale()) {
   *   // refetch or otherwise treat the cached data as outdated
   * }
   * ```
   */
  isStale(): boolean {
    // check observers first, their `isStale` has the source of truth
    // calculated with `isStaleByTime` and it takes `enabled` into account
    if (this.getObserversCount() > 0) {
      return this.observers.some(
        (observer) => observer.getCurrentResult().isStale,
      )
    }

    return this.state.data === undefined || this.state.isInvalidated
  }

  /**
   * Returns `true` if the query's data is stale relative to the given
   * `staleTime` (defaults to `0`).
   * - A query with no data is always stale.
   * - `staleTime: 'static'` is never stale.
   * - An invalidated query is always stale.
   * - Otherwise, staleness is based on elapsed time since `dataUpdatedAt`.
   * @param staleTime - The time, in milliseconds, after which data is considered stale, or
   * `'static'` to never treat existing data as stale. A query without data is stale either way.
   * @returns `true` if the query's data is stale.
   * @see {@link Query#isStale}
   * @example
   * ```ts
   * const isStale = query.isStaleByTime(1000 * 60)
   * ```
   */
  isStaleByTime(staleTime: StaleTime = 0): boolean {
    // no data is always stale
    if (this.state.data === undefined) {
      return true
    }
    // static is never stale
    if (staleTime === 'static') {
      return false
    }
    // if the query is invalidated, it is stale
    if (this.state.isInvalidated) {
      return true
    }

    return !timeUntilStale(this.state.dataUpdatedAt, staleTime)
  }

  /**
   * Refetches the query when the window regains focus, if an observer wants that, and continues a
   * paused fetch.
   * @internal
   */
  onFocus(): void {
    const observer = this.observers.find((x) => x.shouldFetchOnWindowFocus())

    observer?.refetch({ cancelRefetch: false })

    // Continue fetch if currently paused
    this.#retryer?.continue()
  }

  /**
   * Refetches the query when the app reconnects, if an observer wants that, and continues a paused
   * fetch.
   * @internal
   */
  onOnline(): void {
    const observer = this.observers.find((x) => x.shouldFetchOnReconnect())

    observer?.refetch({ cancelRefetch: false })

    // Continue fetch if currently paused
    this.#retryer?.continue()
  }

  /**
   * Subscribes an observer to the query and stops its garbage collection.
   * @internal
   * @param observer - The observer to add. Adding an observer that is already subscribed does
   * nothing.
   */
  addObserver(observer: QueryObserver<any, any, any, any, any>): void {
    if (!this.observers.includes(observer)) {
      this.observers.push(observer)

      // Stop the query from being garbage collected
      this.clearGcTimeout()

      this.#cache.notify({ type: 'observerAdded', query: this, observer })
    }
  }

  /**
   * Unsubscribes an observer from the query.
   * @internal
   * @param observer - The observer to remove. When the last observer is removed, the in-flight
   * fetch is cancelled if its abort signal was consumed (otherwise only its retries are stopped),
   * and garbage collection is scheduled.
   */
  removeObserver(observer: QueryObserver<any, any, any, any, any>): void {
    const index = this.observers.indexOf(observer)
    if (index !== -1) {
      this.observers.splice(index, 1)

      if (!this.observers.length) {
        // If the transport layer does not support cancellation
        // we'll let the query continue so the result can be cached
        if (this.#retryer) {
          if (
            this.#abortSignalConsumed ||
            (this.state.fetchStatus === 'paused' &&
              this.state.status === 'pending')
          ) {
            this.#retryer.cancel({ revert: true })
          } else {
            this.#retryer.cancelRetry()
          }
        }

        this.scheduleGc()
      }

      this.#cache.notify({ type: 'observerRemoved', query: this, observer })
    }
  }

  /**
   * Returns the number of observers currently subscribed to this query.
   * @returns The number of observers.
   * @example
   * ```ts
   * if (query.getObserversCount() === 0) {
   *   // no component is currently watching this query
   * }
   * ```
   */
  getObserversCount(): number {
    return this.observers.length
  }

  /**
   * Marks the query as invalidated, unless it is already invalidated. This
   * updates `state.isInvalidated` and notifies observers, but does not by
   * itself trigger a refetch.
   * @example
   * ```ts
   * query.invalidate()
   * ```
   */
  invalidate(): void {
    if (!this.state.isInvalidated) {
      this.#dispatch({ type: 'invalidate' })
    }
  }

  /**
   * Fetches the query, i.e. runs its `queryFn` (through any configured
   * retryer/behavior) and updates the query's state with the result.
   * - If a fetch is already in flight, returns its promise instead of
   *   starting a new one, unless `fetchOptions.cancelRefetch` is set and the
   *   query already has data, in which case the current fetch is silently
   *   cancelled first.
   * - If `options` is passed, it replaces the query's current options
   *   before fetching.
   * @param options - Query options that replace the query's current options before fetching. They
   * are not applied when an in-flight fetch is reused.
   * @param fetchOptions - Set `cancelRefetch` to cancel an in-flight fetch first (only if the query
   * already has data), and `meta` to pass extra information to the query's behavior.
   * @returns A promise that resolves with the fetched data, or rejects with the fetch error. If the
   * fetch is cancelled with `revert` while the query has data, it resolves with the restored data
   * instead.
   */
  async fetch(
    options?: QueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    fetchOptions?: FetchOptions<TQueryFnData>,
  ): Promise<TData> {
    if (
      this.state.fetchStatus !== 'idle' &&
      // If the promise in the retryer is already rejected, we have to definitely
      // re-start the fetch; there is a chance that the query is still in a
      // pending state when that happens
      this.#retryer?.status() !== 'rejected'
    ) {
      if (this.state.data !== undefined && fetchOptions?.cancelRefetch) {
        // Silently cancel current fetch if the user wants to cancel refetch
        this.cancel({ silent: true })
      } else if (this.#retryer) {
        // make sure that retries that were potentially cancelled due to unmounts can continue
        this.#retryer.continueRetry()
        // Return current promise if we are already fetching
        return this.#retryer.promise
      }
    }

    // Update config if passed, otherwise the config from the last execution is used
    if (options) {
      this.setOptions(options)
    }

    // Use the options from the first observer with a query function if no function is found.
    // This can happen when the query is hydrated or created with setQueryData.
    if (!this.options.queryFn) {
      const observer = this.observers.find((x) => x.options.queryFn)
      if (observer) {
        this.setOptions(observer.options)
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      if (!Array.isArray(this.options.queryKey)) {
        console.error(
          `As of v4, queryKey needs to be an Array. If you are using a string like 'repoData', please change it to an Array, e.g. ['repoData']`,
        )
      }
    }

    const abortController = new AbortController()
    // Behaviors can replace fetchFn, so reset consumption for every new fetch here too.
    this.#abortSignalConsumed = false

    // Adds an enumerable signal property to the object that
    // which sets abortSignalConsumed to true when the signal
    // is read.
    const addSignalProperty = (object: unknown) => {
      Object.defineProperty(object, 'signal', {
        enumerable: true,
        get: () => {
          this.#abortSignalConsumed = true
          return abortController.signal
        },
      })
    }

    // Create fetch function
    const fetchFn = () => {
      const queryFn = ensureQueryFn(this.options, fetchOptions)

      // Create query function context
      const createQueryFnContext = (): QueryFunctionContext<TQueryKey> => {
        const queryFnContext: OmitKeyof<
          QueryFunctionContext<TQueryKey>,
          'signal'
        > = {
          client: this.#client,
          queryKey: this.queryKey,
          meta: this.meta,
        }
        addSignalProperty(queryFnContext)
        return queryFnContext as QueryFunctionContext<TQueryKey>
      }

      const queryFnContext = createQueryFnContext()

      this.#abortSignalConsumed = false
      if (this.options.persister) {
        return this.options.persister(
          queryFn,
          queryFnContext,
          this as unknown as Query,
        )
      }

      return queryFn(queryFnContext)
    }

    // Trigger behavior hook
    const createFetchContext = (): FetchContext<
      TQueryFnData,
      TError,
      TData,
      TQueryKey
    > => {
      const context: OmitKeyof<
        FetchContext<TQueryFnData, TError, TData, TQueryKey>,
        'signal'
      > = {
        fetchOptions,
        options: this.options,
        queryKey: this.queryKey,
        client: this.#client,
        state: this.state,
        fetchFn,
      }

      addSignalProperty(context)
      return context as FetchContext<TQueryFnData, TError, TData, TQueryKey>
    }

    const context = createFetchContext()

    const behavior =
      this.#queryType === 'infinite'
        ? (infiniteQueryBehavior(
            (this.options as { pages?: number }).pages,
          ) as QueryBehavior<TQueryFnData, TError, TData, TQueryKey>)
        : this.options.behavior
    behavior?.onFetch(context, this as unknown as Query)

    // Store state in case the current fetch needs to be reverted
    this.#revertState = this.state

    // Set to fetching state if not already in it
    if (
      this.state.fetchStatus === 'idle' ||
      this.state.fetchMeta !== context.fetchOptions?.meta
    ) {
      this.#dispatch({ type: 'fetch', meta: context.fetchOptions?.meta })
    }

    // Try to fetch the data
    const retryer = (this.#retryer = createRetryer({
      initialPromise: fetchOptions?.initialPromise as
        | Promise<TData>
        | undefined,
      fn: context.fetchFn as () => Promise<TData>,
      onCancel: (error) => {
        if (error instanceof CancelledError && error.revert) {
          this.setState({
            ...this.#revertState,
            fetchStatus: 'idle' as const,
          })
        }
        abortController.abort()
      },
      onFail: (failureCount, error) => {
        this.#dispatch({ type: 'failed', failureCount, error })
      },
      onPause: () => {
        this.#dispatch({ type: 'pause' })
      },
      onContinue: () => {
        this.#dispatch({ type: 'continue' })
      },
      retry: context.options.retry,
      retryDelay: context.options.retryDelay,
      networkMode: context.options.networkMode,
      canRun: () => true,
    }))

    try {
      const data = await retryer.start()
      // this is more of a runtime guard
      if (data === undefined) {
        if (process.env.NODE_ENV !== 'production') {
          console.error(
            `Query data cannot be undefined. Please make sure to return a value other than undefined from your query function. Affected query key: ${this.queryHash}`,
          )
        }
        throw new Error(`${this.queryHash} data is undefined`)
      }

      this.setData(data)

      // Notify cache callback
      this.#cache.config.onSuccess?.(data, this as Query<any, any, any, any>)
      this.#cache.config.onSettled?.(
        data,
        this.state.error as any,
        this as Query<any, any, any, any>,
      )
      return data
    } catch (error) {
      if (error instanceof CancelledError) {
        if (error.silent) {
          // silent cancellation implies a new fetch is going to be started,
          // so we piggyback onto that promise
          return this.#retryer.promise
        } else if (error.revert) {
          // transform error into reverted state data
          // if the initial fetch was cancelled, we have no data, so we have
          // to get reject with a CancelledError
          if (this.state.data === undefined) {
            throw error
          }
          return this.state.data
        }
      }
      this.#dispatch({
        type: 'error',
        error: error as TError,
      })

      // Notify cache callback
      this.#cache.config.onError?.(
        error as any,
        this as Query<any, any, any, any>,
      )
      this.#cache.config.onSettled?.(
        this.state.data,
        error as any,
        this as Query<any, any, any, any>,
      )

      throw error // rethrow the error for further handling
    } finally {
      // The settled retryer's promise would otherwise pin this fetch's raw
      // result (a second copy after structural sharing) for the query's lifetime
      if (this.#retryer === retryer) {
        this.#retryer = undefined
      }
      // Schedule query gc after fetching
      this.scheduleGc()
    }
  }

  #dispatch(action: Action<TData, TError>): void {
    const reducer = (
      state: QueryState<TData, TError>,
    ): QueryState<TData, TError> => {
      switch (action.type) {
        case 'failed':
          return {
            ...state,
            fetchFailureCount: action.failureCount,
            fetchFailureReason: action.error,
          }
        case 'pause':
          return {
            ...state,
            fetchStatus: 'paused',
          }
        case 'continue':
          return {
            ...state,
            fetchStatus: 'fetching',
          }
        case 'fetch':
          return {
            ...state,
            ...fetchState(state.data, this.options),
            fetchMeta: action.meta ?? null,
          }
        case 'success':
          const newState = {
            ...state,
            ...successState(action.data, action.dataUpdatedAt),
            dataUpdateCount: state.dataUpdateCount + 1,
            ...(!action.manual && {
              fetchStatus: 'idle' as const,
              fetchFailureCount: 0,
              fetchFailureReason: null,
            }),
          }
          // If fetching ends successfully, we don't need revertState as a fallback anymore.
          // For manual updates, capture the state to revert to it in case of a cancellation.
          this.#revertState = action.manual ? newState : undefined

          return newState
        case 'error':
          const error = action.error
          return {
            ...state,
            error,
            errorUpdateCount: state.errorUpdateCount + 1,
            errorUpdatedAt: Date.now(),
            fetchFailureCount: state.fetchFailureCount + 1,
            fetchFailureReason: error,
            fetchStatus: 'idle',
            status: 'error',
            // flag existing data as invalidated if we get a background error
            // note that "no data" always means stale so we can set unconditionally here
            isInvalidated: true,
          }
        case 'invalidate':
          return {
            ...state,
            isInvalidated: true,
          }
        case 'setState':
          return {
            ...state,
            ...action.state,
          }
      }
    }

    this.state = reducer(this.state)

    notifyManager.batch(() => {
      // Keep the current iteration stable if an observer unsubscribes
      // synchronously while it is being notified.
      this.observers.slice().forEach((observer) => {
        observer.onQueryUpdate()
      })

      this.#cache.notify({ query: this, type: 'updated', action })
    })
  }
}

/**
 * Returns the state changes applied when a query starts fetching.
 * @param data - The query's current data. If it is `undefined`, the query is also reset to
 * `'pending'` with no error.
 * @param options - The query options, whose `networkMode` decides whether the query is `'fetching'`
 * or `'paused'`.
 * @returns The partial query state for a starting fetch.
 */
export function fetchState<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey,
>(
  data: TData | undefined,
  options: QueryOptions<TQueryFnData, TError, TData, TQueryKey>,
) {
  return {
    fetchFailureCount: 0,
    fetchFailureReason: null,
    fetchStatus: canFetch(options.networkMode) ? 'fetching' : 'paused',
    ...(data === undefined &&
      ({
        error: null,
        status: 'pending',
      } as const)),
  } as const
}

/**
 * Returns the state changes applied when a query receives data.
 * @param data - The new data.
 * @param dataUpdatedAt - The timestamp the data is recorded with. Defaults to the current time.
 * @returns The partial query state for a successful update.
 */
function successState<TData>(data: TData | undefined, dataUpdatedAt?: number) {
  return {
    data,
    dataUpdatedAt: dataUpdatedAt ?? Date.now(),
    error: null,
    isInvalidated: false,
    status: 'success' as const,
  }
}

/**
 * Returns the initial state of a query, based on its `initialData` and `initialDataUpdatedAt`
 * options.
 * @param options - The query options.
 * @returns The initial query state: `'success'` if `initialData` is set, otherwise `'pending'`.
 */
function getDefaultState<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey,
>(
  options: QueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): QueryState<TData, TError> {
  const data =
    typeof options.initialData === 'function'
      ? (options.initialData as InitialDataFunction<TData>)()
      : options.initialData

  const hasData = data !== undefined

  const initialDataUpdatedAt = hasData
    ? typeof options.initialDataUpdatedAt === 'function'
      ? options.initialDataUpdatedAt()
      : options.initialDataUpdatedAt
    : 0

  return {
    data,
    dataUpdateCount: 0,
    dataUpdatedAt: hasData ? (initialDataUpdatedAt ?? Date.now()) : 0,
    error: null,
    errorUpdateCount: 0,
    errorUpdatedAt: 0,
    fetchFailureCount: 0,
    fetchFailureReason: null,
    fetchMeta: null,
    isInvalidated: false,
    status: hasData ? 'success' : 'pending',
    fetchStatus: 'idle',
  }
}
