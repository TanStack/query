import { clientFeatures } from './clientFeatures'
import { notifyManager } from './notifyManager'
import { Removable } from './removable'
import { CancelledError, canFetch, createRetryer } from './retryer'
import {
  ensureQueryFn,
  fetchSignal,
  noop,
  replaceData,
  resolveQueryValue,
  skipToken,
  timeUntilStale,
} from './utils'
import type * as Shared from '@tanstack/query-types/bindings'
import type {
  FetchOptions,
  QueryAction as Action,
  QueryState,
} from '@tanstack/query-types/bindings'
import type { QueryClientFeatures } from './clientFeatures'
import type { QueryCache } from './queryCache'
import type { QueryClient } from './queryClient'
import type { QueryObserver } from './queryObserver'
import type { Retryer } from './retryer'
import type { QueryRuntime } from './runtimeBinding'
import type {
  CancelOptions,
  DefaultError,
  InitialDataFunction,
  QueryKey,
  QueryMeta,
  QueryOptions,
  SetDataOptions,
  StaleTime,
} from './types'

type QueryConfig<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey = QueryKey,
> = Shared.QueryConfig<QueryRuntime, TQueryFnData, TError, TData, TQueryKey>

export type FetchContext<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey = QueryKey,
> = Shared.FetchContext<QueryRuntime, TQueryFnData, TError, TData, TQueryKey>

export type QueryBehavior<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = Shared.QueryBehavior<QueryRuntime, TQueryFnData, TError, TData, TQueryKey>

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
  #infiniteQueryBehavior?: QueryClientFeatures['infiniteQueryBehavior']

  #initialState: QueryState<TData, TError>
  #revertState?: QueryState<TData, TError>
  #cache: QueryCache
  #client: QueryClient
  #retryer?: Retryer<TData>
  #fetchPromise?: Promise<TData>
  observers: Array<QueryObserver<any, any, any, any, any>>
  #defaultOptions?: QueryOptions<TQueryFnData, TError, TData, TQueryKey>
  #abortSignalConsumed: boolean

  constructor(config: QueryConfig<TQueryFnData, TError, TData, TQueryKey>) {
    super()

    this.#abortSignalConsumed = false
    this.#defaultOptions = config.defaultOptions
    this.#client = config.client
    this.setOptions(config.options)
    this.observers = []
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
  get queryType(): 'infinite' | undefined {
    return this.#infiniteQueryBehavior ? 'infinite' : undefined
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
   * @throws {Error} When an infinite query is used without `infiniteQueryPlugin`.
   */
  setOptions(
    options?: QueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  ): void {
    if (options?._type === 'infinite') {
      const behavior = this.#client[clientFeatures].infiniteQueryBehavior
      if (!behavior) {
        throw new Error(
          'Add infiniteQueryPlugin to the QueryClient plugins to use infinite queries.',
        )
      }
      this.#infiniteQueryBehavior = behavior
    }
    this.options = { ...this.#defaultOptions, ...options }

    this.updateGcTime(this.options.gcTime)

    // oxlint-disable-next-line typescript/no-unnecessary-condition -- the constructor calls 'setOptions' before it assigns 'state'
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

    const manual = options?.manual
    const dataUpdatedAt = options?.updatedAt
    this.state = {
      ...this.state,
      ...successState(data, dataUpdatedAt),
      dataUpdateCount: this.state.dataUpdateCount + 1,
      ...(!manual && {
        fetchStatus: 'idle' as const,
        fetchFailureCount: 0,
        fetchFailureReason: null,
      }),
    }
    // A manual write becomes the snapshot to restore if a fetch is cancelled.
    this.#revertState = manual ? this.state : undefined
    this.#notify({ type: 'success', data, dataUpdatedAt, manual })

    return data
  }

  /**
   * Merges the given partial state directly into this query's state, notifying observers. Used
   * by persistence and broadcast plugins to restore a state snapshot, and by devtools to let a
   * user manually trigger a loading/error state or edit the cached data.
   * @param state - The partial state to merge into the query's state.
   */
  setState(state: Partial<QueryState<TData, TError>>): void {
    this.#update(state, { type: 'setState', state })
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
    return promise ? promise.then(noop, noop) : Promise.resolve()
  }

  /**
   * Silently cancels any in-flight fetch, then clears the query's garbage
   * collection timeout. Called by `QueryCache` when the query is removed from
   * the cache.
   * @see {@link Query#cancel}
   */
  override destroy(): void {
    this.cancel({ silent: true })
    // An abort listener can unsubscribe and schedule GC during cancellation.
    super.destroy()
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
   * Returns `true` if the query has data and at least one observer configured with
   * `staleTime: 'static'`, meaning it is treated as never stale.
   * @returns `true` if the query is static.
   */
  isStatic(): boolean {
    if (this.state.data === undefined) {
      return false
    }

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
   * const isStale = query.isStaleByTime(60 * 1000)
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
   * and garbage collection is scheduled if the query is still in the cache.
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

        this.#scheduleGcIfCached()
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
      this.#update({ isInvalidated: true }, { type: 'invalidate' })
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
      } else if (this.#retryer && this.#fetchPromise) {
        // make sure that retries that were potentially cancelled due to unmounts can continue
        this.#retryer.continueRetry()
        // Return current promise if we are already fetching
        return this.#fetchPromise
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

    const addSignalProperty: (
      object: object,
    ) => asserts object is { signal: AbortSignal } = (object) => {
      Object.defineProperties(object, {
        [fetchSignal]: { value: abortController.signal, enumerable: true },
        signal: {
          enumerable: true,
          get: () => {
            this.#abortSignalConsumed = true
            return abortController.signal
          },
        },
      })
    }

    // Create fetch function
    const fetchFn = () => {
      const queryFn = ensureQueryFn(this.options, fetchOptions)

      const queryFnContext = {
        client: this.#client,
        queryKey: this.queryKey,
        meta: this.meta,
      }
      addSignalProperty(queryFnContext)

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
    const context = {
      fetchOptions,
      options: this.options,
      queryKey: this.queryKey,
      client: this.#client,
      state: this.state,
      fetchFn,
    }
    if (this.#infiniteQueryBehavior) {
      addSignalProperty(context)
      const behavior = this.#infiniteQueryBehavior(
        (this.options as { pages?: number }).pages,
      ) as QueryBehavior<TQueryFnData, TError, TData, TQueryKey>
      behavior.onFetch(context, this as unknown as Query)
    }

    // Store state in case the current fetch needs to be reverted
    this.#revertState = this.state

    // Set to fetching state if not already in it
    if (
      this.state.fetchStatus === 'idle' ||
      this.state.fetchMeta !== context.fetchOptions?.meta
    ) {
      const meta = context.fetchOptions?.meta
      this.#update(
        {
          ...fetchState(this.state.data, this.options),
          fetchMeta: meta ?? null,
        },
        { type: 'fetch', meta },
      )
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
        this.#update(
          { fetchFailureCount: failureCount, fetchFailureReason: error },
          { type: 'failed', failureCount, error },
        )
      },
      onPause: () => {
        this.#update({ fetchStatus: 'paused' }, { type: 'pause' })
      },
      onContinue: () => {
        this.#update({ fetchStatus: 'fetching' }, { type: 'continue' })
      },
      retry: context.options.retry,
      retryDelay: context.options.retryDelay,
      networkMode: context.options.networkMode,
      canRun: () => true,
    }))

    const fetchPromise = (async () => {
      try {
        const data = await retryer.promise
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
            if (this.#retryer !== retryer && this.#fetchPromise) {
              // A new fetch replaced the silently cancelled one,
              // so we piggyback onto that promise.
              return this.#fetchPromise
            }
            throw error
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
        const fetchError = error as TError
        this.#update(
          {
            error: fetchError,
            errorUpdatedAt: Date.now(),
            errorUpdateCount: this.state.errorUpdateCount + 1,
            fetchFailureCount: this.state.fetchFailureCount + 1,
            fetchFailureReason: fetchError,
            fetchStatus: 'idle',
            status: 'error',
            isInvalidated: true,
          },
          { type: 'error', error: fetchError },
        )

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
          this.#fetchPromise = undefined
        }
        this.#scheduleGcIfCached()
      }
    })()
    this.#fetchPromise = fetchPromise
    retryer.start()
    return fetchPromise
  }

  #scheduleGcIfCached(): void {
    if (
      this.#cache.get<TQueryFnData, TError, TData, TQueryKey>(
        this.queryHash,
      ) === this
    ) {
      this.scheduleGc()
    }
  }

  #update(
    state: Partial<QueryState<TData, TError>>,
    action: Action<TData, TError>,
  ): void {
    this.state = { ...this.state, ...state }
    this.#notify(action)
  }

  #notify(action: Action<TData, TError>): void {
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

export type {
  QueryState,
  FetchDirection,
  FetchMeta,
  FetchOptions,
  QueryAction as Action,
} from '@tanstack/query-types/bindings'
