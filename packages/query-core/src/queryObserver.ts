import type { DefaultedQueryObserverOptions, DefaultError } from './types'
import {
  isServer,
  isValidTimeout,
  noop,
  replaceData,
  shallowEqualObjects,
  timeUntilStale,
} from './utils'
import { notifyManager } from './notifyManager'
import type {
  PlaceholderDataFunction,
  QueryKey,
  QueryObserverBaseResult,
  QueryObserverOptions,
  QueryObserverResult,
  QueryOptions,
  RefetchOptions,
} from './types'
import type { Query, QueryState, Action, FetchOptions } from './query'
import type { QueryClient } from './queryClient'
import { focusManager } from './focusManager'
import { Subscribable } from './subscribable'
import { canFetch, isCancelledError } from './retryer'

type QueryObserverListener<TData, TError> = (
  result: QueryObserverResult<TData, TError>,
) => void

export interface NotifyOptions {
  listeners?: boolean
  onError?: boolean
  onSuccess?: boolean
}

export interface ObserverFetchOptions extends FetchOptions {
  throwOnError?: boolean
}

export class QueryObserver<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends Subscribable<QueryObserverListener<TData, TError>> {
  options: QueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >

  #client: QueryClient
  #currentQuery: Query<TQueryFnData, TError, TQueryData, TQueryKey> = undefined!
  #currentQueryInitialState: QueryState<TQueryData, TError> = undefined!
  #currentResult: QueryObserverResult<TData, TError> = undefined!
  #currentResultState?: QueryState<TQueryData, TError>
  #currentResultOptions?: QueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >
  #previousQueryResult?: QueryObserverResult<TData, TError>
  #selectError: TError | null
  #selectFn?: (data: TQueryData) => TData
  #selectResult?: TData
  #staleTimeoutId?: ReturnType<typeof setTimeout>
  #refetchIntervalId?: ReturnType<typeof setInterval>
  #currentRefetchInterval?: number | false
  #trackedProps: Set<keyof QueryObserverResult> = new Set()

  constructor(
    client: QueryClient,
    options: QueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    >,
  ) {
    super()

    this.#client = client
    this.options = options
    this.#selectError = null
    this.bindMethods()
    this.setOptions(options)
  }

  protected bindMethods(): void {
    this.refetch = this.refetch.bind(this)
  }

  protected onSubscribe(): void {
    if (this.listeners.length === 1) {
      this.#currentQuery.addObserver(this)

      if (shouldFetchOnMount(this.#currentQuery, this.options)) {
        this.#executeFetch()
      }

      this.#updateTimers()
    }
  }

  protected onUnsubscribe(): void {
    if (!this.listeners.length) {
      this.destroy()
    }
  }

  shouldFetchOnReconnect(): boolean {
    return shouldFetchOn(
      this.#currentQuery,
      this.options,
      this.options.refetchOnReconnect,
    )
  }

  shouldFetchOnWindowFocus(): boolean {
    return shouldFetchOn(
      this.#currentQuery,
      this.options,
      this.options.refetchOnWindowFocus,
    )
  }

  destroy(): void {
    this.listeners = []
    this.#clearStaleTimeout()
    this.#clearRefetchInterval()
    this.#currentQuery.removeObserver(this)
  }

  setOptions(
    options?: QueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    >,
    notifyOptions?: NotifyOptions,
  ): void {
    const prevOptions = this.options
    const prevQuery = this.#currentQuery

    this.options = this.#client.defaultQueryOptions(options)

    if (!shallowEqualObjects(prevOptions, this.options)) {
      this.#client.getQueryCache().notify({
        type: 'observerOptionsUpdated',
        query: this.#currentQuery,
        observer: this,
      })
    }

    if (
      typeof this.options.enabled !== 'undefined' &&
      typeof this.options.enabled !== 'boolean'
    ) {
      throw new Error('Expected enabled to be a boolean')
    }

    // Keep previous query key if the user does not supply one
    if (!this.options.queryKey) {
      this.options.queryKey = prevOptions.queryKey
    }

    this.#updateQuery()

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
    this.#updateResult(notifyOptions)

    // Update stale interval if needed
    if (
      mounted &&
      (this.#currentQuery !== prevQuery ||
        this.options.enabled !== prevOptions.enabled ||
        this.options.staleTime !== prevOptions.staleTime)
    ) {
      this.#updateStaleTimeout()
    }

    const nextRefetchInterval = this.#computeRefetchInterval()

    // Update refetch interval if needed
    if (
      mounted &&
      (this.#currentQuery !== prevQuery ||
        this.options.enabled !== prevOptions.enabled ||
        nextRefetchInterval !== this.#currentRefetchInterval)
    ) {
      this.#updateRefetchInterval(nextRefetchInterval)
    }
  }

  getOptimisticResult(
    options: DefaultedQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    >,
  ): QueryObserverResult<TData, TError> {
    const query = this.#client.getQueryCache().build(this.#client, options)

    return this.createResult(query, options)
  }

  getCurrentResult(): QueryObserverResult<TData, TError> {
    return this.#currentResult
  }

  trackResult(
    result: QueryObserverResult<TData, TError>,
  ): QueryObserverResult<TData, TError> {
    const trackedResult = {} as QueryObserverResult<TData, TError>

    Object.keys(result).forEach((key) => {
      Object.defineProperty(trackedResult, key, {
        configurable: false,
        enumerable: true,
        get: () => {
          this.#trackedProps.add(key as keyof QueryObserverResult)
          return result[key as keyof QueryObserverResult]
        },
      })
    })

    return trackedResult
  }

  getCurrentQuery(): Query<TQueryFnData, TError, TQueryData, TQueryKey> {
    return this.#currentQuery
  }

  refetch({ ...options }: RefetchOptions = {}): Promise<
    QueryObserverResult<TData, TError>
  > {
    return this.fetch({
      ...options,
    })
  }

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
    query.isFetchingOptimistic = true

    return query.fetch().then(() => this.createResult(query, defaultedOptions))
  }

  protected fetch(
    fetchOptions: ObserverFetchOptions,
  ): Promise<QueryObserverResult<TData, TError>> {
    return this.#executeFetch({
      ...fetchOptions,
      cancelRefetch: fetchOptions.cancelRefetch ?? true,
    }).then(() => {
      this.#updateResult()
      return this.#currentResult
    })
  }

  #executeFetch(
    fetchOptions?: ObserverFetchOptions,
  ): Promise<TQueryData | undefined> {
    // Make sure we reference the latest query as the current one might have been removed
    this.#updateQuery()

    // Fetch
    let promise: Promise<TQueryData | undefined> = this.#currentQuery.fetch(
      this.options as QueryOptions<TQueryFnData, TError, TQueryData, TQueryKey>,
      fetchOptions,
    )

    if (!fetchOptions?.throwOnError) {
      promise = promise.catch(noop)
    }

    return promise
  }

  #updateStaleTimeout(): void {
    this.#clearStaleTimeout()

    if (
      isServer ||
      this.#currentResult.isStale ||
      !isValidTimeout(this.options.staleTime)
    ) {
      return
    }

    const time = timeUntilStale(
      this.#currentResult.dataUpdatedAt,
      this.options.staleTime,
    )

    // The timeout is sometimes triggered 1 ms before the stale time expiration.
    // To mitigate this issue we always add 1 ms to the timeout.
    const timeout = time + 1

    this.#staleTimeoutId = setTimeout(() => {
      if (!this.#currentResult.isStale) {
        this.#updateResult()
      }
    }, timeout)
  }

  #computeRefetchInterval() {
    return typeof this.options.refetchInterval === 'function'
      ? this.options.refetchInterval(
          this.#currentResult.data,
          this.#currentQuery,
        )
      : this.options.refetchInterval ?? false
  }

  #updateRefetchInterval(nextInterval: number | false): void {
    this.#clearRefetchInterval()

    this.#currentRefetchInterval = nextInterval

    if (
      isServer ||
      this.options.enabled === false ||
      !isValidTimeout(this.#currentRefetchInterval) ||
      this.#currentRefetchInterval === 0
    ) {
      return
    }

    this.#refetchIntervalId = setInterval(() => {
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
    if (this.#staleTimeoutId) {
      clearTimeout(this.#staleTimeoutId)
      this.#staleTimeoutId = undefined
    }
  }

  #clearRefetchInterval(): void {
    if (this.#refetchIntervalId) {
      clearInterval(this.#refetchIntervalId)
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
  ): QueryObserverResult<TData, TError> {
    const prevQuery = this.#currentQuery
    const prevOptions = this.options
    const prevResult = this.#currentResult as
      | QueryObserverResult<TData, TError>
      | undefined
    const prevResultState = this.#currentResultState
    const prevResultOptions = this.#currentResultOptions
    const queryChange = query !== prevQuery
    const queryInitialState = queryChange
      ? query.state
      : this.#currentQueryInitialState
    const prevQueryResult = queryChange
      ? this.#currentResult
      : this.#previousQueryResult

    const { state } = query
    let { error, errorUpdatedAt, fetchStatus, status } = state
    let isPlaceholderData = false
    let data: TData | undefined

    // Optimistically set result in fetching state if needed
    if (options._optimisticResults) {
      const mounted = this.hasListeners()

      const fetchOnMount = !mounted && shouldFetchOnMount(query, options)

      const fetchOptionally =
        mounted && shouldFetchOptionally(query, prevQuery, options, prevOptions)

      if (fetchOnMount || fetchOptionally) {
        fetchStatus = canFetch(query.options.networkMode)
          ? 'fetching'
          : 'paused'
        if (!state.dataUpdatedAt) {
          status = 'pending'
        }
      }
      if (options._optimisticResults === 'isRestoring') {
        fetchStatus = 'idle'
      }
    }

    // Select data if needed
    if (options.select && typeof state.data !== 'undefined') {
      // Memoize select result
      if (
        prevResult &&
        state.data === prevResultState?.data &&
        options.select === this.#selectFn
      ) {
        data = this.#selectResult
      } else {
        try {
          this.#selectFn = options.select
          data = options.select(state.data)
          data = replaceData(prevResult?.data, data, options)
          this.#selectResult = data
          this.#selectError = null
        } catch (selectError) {
          this.#selectError = selectError as TError
        }
      }
    }
    // Use query data
    else {
      data = state.data as unknown as TData
    }

    // Show placeholder data if needed
    if (
      typeof options.placeholderData !== 'undefined' &&
      typeof data === 'undefined' &&
      status === 'pending'
    ) {
      let placeholderData

      // Memoize placeholder data
      if (
        prevResult?.isPlaceholderData &&
        options.placeholderData === prevResultOptions?.placeholderData
      ) {
        placeholderData = prevResult.data
      } else {
        placeholderData =
          typeof options.placeholderData === 'function'
            ? (
                options.placeholderData as unknown as PlaceholderDataFunction<TQueryData>
              )(prevQueryResult?.data as TQueryData | undefined)
            : options.placeholderData
        if (options.select && typeof placeholderData !== 'undefined') {
          try {
            placeholderData = options.select(placeholderData)
            this.#selectError = null
          } catch (selectError) {
            this.#selectError = selectError as TError
          }
        }
      }

      if (typeof placeholderData !== 'undefined') {
        status = 'success'
        data = replaceData(prevResult?.data, placeholderData, options) as TData
        isPlaceholderData = true
      }
    }

    if (this.#selectError) {
      error = this.#selectError as any
      data = this.#selectResult
      errorUpdatedAt = Date.now()
      status = 'error'
    }

    const isFetching = fetchStatus === 'fetching'
    const isPending = status === 'pending'
    const isError = status === 'error'

    const isLoading = isPending && isFetching

    const result: QueryObserverBaseResult<TData, TError> = {
      status,
      fetchStatus,
      isPending,
      isSuccess: status === 'success',
      isError,
      isInitialLoading: isLoading,
      isLoading,
      data,
      dataUpdatedAt: state.dataUpdatedAt,
      error,
      errorUpdatedAt,
      failureCount: state.fetchFailureCount,
      failureReason: state.fetchFailureReason,
      errorUpdateCount: state.errorUpdateCount,
      isFetched: state.dataUpdateCount > 0 || state.errorUpdateCount > 0,
      isFetchedAfterMount:
        state.dataUpdateCount > queryInitialState.dataUpdateCount ||
        state.errorUpdateCount > queryInitialState.errorUpdateCount,
      isFetching,
      isRefetching: isFetching && !isPending,
      isLoadingError: isError && state.dataUpdatedAt === 0,
      isPaused: fetchStatus === 'paused',
      isPlaceholderData,
      isRefetchError: isError && state.dataUpdatedAt !== 0,
      isStale: isStale(query, options),
      refetch: this.refetch,
    }

    return result as QueryObserverResult<TData, TError>
  }

  #updateResult(notifyOptions?: NotifyOptions): void {
    const prevResult = this.#currentResult as
      | QueryObserverResult<TData, TError>
      | undefined

    const nextResult = this.createResult(this.#currentQuery, this.options)
    this.#currentResultState = this.#currentQuery.state
    this.#currentResultOptions = this.options

    // Only notify and update result if something has changed
    if (shallowEqualObjects(nextResult, prevResult)) {
      return
    }

    this.#currentResult = nextResult

    // Determine which callbacks to trigger
    const defaultNotifyOptions: NotifyOptions = {}

    const shouldNotifyListeners = (): boolean => {
      if (!prevResult) {
        return true
      }

      const { notifyOnChangeProps } = this.options

      if (
        notifyOnChangeProps === 'all' ||
        (!notifyOnChangeProps && !this.#trackedProps.size)
      ) {
        return true
      }

      const includedProps = new Set(notifyOnChangeProps ?? this.#trackedProps)

      if (this.options.throwErrors) {
        includedProps.add('error')
      }

      return Object.keys(this.#currentResult).some((key) => {
        const typedKey = key as keyof QueryObserverResult
        const changed = this.#currentResult[typedKey] !== prevResult[typedKey]
        return changed && includedProps.has(typedKey)
      })
    }

    if (notifyOptions?.listeners !== false && shouldNotifyListeners()) {
      defaultNotifyOptions.listeners = true
    }

    this.#notify({ ...defaultNotifyOptions, ...notifyOptions })
  }

  #updateQuery(): void {
    const query = this.#client.getQueryCache().build(this.#client, this.options)

    if (query === this.#currentQuery) {
      return
    }

    const prevQuery = this.#currentQuery as
      | Query<TQueryFnData, TError, TQueryData, TQueryKey>
      | undefined
    this.#currentQuery = query
    this.#currentQueryInitialState = query.state
    this.#previousQueryResult = this.#currentResult

    if (this.hasListeners()) {
      prevQuery?.removeObserver(this)
      query.addObserver(this)
    }
  }

  onQueryUpdate(action: Action<TData, TError>): void {
    const notifyOptions: NotifyOptions = {}

    if (action.type === 'success') {
      notifyOptions.onSuccess = !action.manual
    } else if (action.type === 'error' && !isCancelledError(action.error)) {
      notifyOptions.onError = true
    }

    this.#updateResult(notifyOptions)

    if (this.hasListeners()) {
      this.#updateTimers()
    }
  }

  #notify(notifyOptions: NotifyOptions): void {
    notifyManager.batch(() => {
      // First trigger the configuration callbacks
      if (notifyOptions.onSuccess) {
        this.options.onSuccess?.(this.#currentResult.data!)
        this.options.onSettled?.(this.#currentResult.data!, null)
      } else if (notifyOptions.onError) {
        this.options.onError?.(this.#currentResult.error!)
        this.options.onSettled?.(undefined, this.#currentResult.error!)
      }

      // Then trigger the listeners
      if (notifyOptions.listeners) {
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
}

function shouldLoadOnMount(
  query: Query<any, any, any, any>,
  options: QueryObserverOptions<any, any, any, any>,
): boolean {
  return (
    options.enabled !== false &&
    !query.state.dataUpdatedAt &&
    !(query.state.status === 'error' && options.retryOnMount === false)
  )
}

function shouldFetchOnMount(
  query: Query<any, any, any, any>,
  options: QueryObserverOptions<any, any, any, any, any>,
): boolean {
  return (
    shouldLoadOnMount(query, options) ||
    (query.state.dataUpdatedAt > 0 &&
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
  if (options.enabled !== false) {
    const value = typeof field === 'function' ? field(query) : field

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
    options.enabled !== false &&
    (query !== prevQuery || prevOptions.enabled === false) &&
    (!options.suspense || query.state.status !== 'error') &&
    isStale(query, options)
  )
}

function isStale(
  query: Query<any, any, any, any>,
  options: QueryObserverOptions<any, any, any, any, any>,
): boolean {
  return query.isStaleByTime(options.staleTime)
}
