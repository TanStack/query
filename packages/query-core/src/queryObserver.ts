import type { DefaultedQueryObserverOptions, RefetchPageFilters } from './types'
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
  cache?: boolean
  listeners?: boolean
  onError?: boolean
  onSuccess?: boolean
}

export interface ObserverFetchOptions extends FetchOptions {
  throwOnError?: boolean
}

export class QueryObserver<
  TQueryFnData = unknown,
  TError = unknown,
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

  private client: QueryClient
  private currentQuery!: Query<TQueryFnData, TError, TQueryData, TQueryKey>
  private currentQueryInitialState!: QueryState<TQueryData, TError>
  private currentResult!: QueryObserverResult<TData, TError>
  private currentResultState?: QueryState<TQueryData, TError>
  private currentResultOptions?: QueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >
  private previousQueryResult?: QueryObserverResult<TData, TError>
  private selectError: TError | null
  private selectFn?: (data: TQueryData) => TData
  private selectResult?: TData
  private staleTimeoutId?: ReturnType<typeof setTimeout>
  private refetchIntervalId?: ReturnType<typeof setInterval>
  private currentRefetchInterval?: number | false
  private trackedProps!: Set<keyof QueryObserverResult>

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

    this.client = client
    this.options = options
    this.trackedProps = new Set()
    this.selectError = null
    this.bindMethods()
    this.setOptions(options)
  }

  protected bindMethods(): void {
    this.remove = this.remove.bind(this)
    this.refetch = this.refetch.bind(this)
  }

  protected onSubscribe(): void {
    if (this.listeners.length === 1) {
      this.currentQuery.addObserver(this)

      if (shouldFetchOnMount(this.currentQuery, this.options)) {
        this.executeFetch()
      }

      this.updateTimers()
    }
  }

  protected onUnsubscribe(): void {
    if (!this.listeners.length) {
      this.destroy()
    }
  }

  shouldFetchOnReconnect(): boolean {
    return shouldFetchOn(
      this.currentQuery,
      this.options,
      this.options.refetchOnReconnect,
    )
  }

  shouldFetchOnWindowFocus(): boolean {
    return shouldFetchOn(
      this.currentQuery,
      this.options,
      this.options.refetchOnWindowFocus,
    )
  }

  destroy(): void {
    this.listeners = []
    this.clearStaleTimeout()
    this.clearRefetchInterval()
    this.currentQuery.removeObserver(this)
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
    const prevQuery = this.currentQuery

    this.options = this.client.defaultQueryOptions(options)

    if (!shallowEqualObjects(prevOptions, this.options)) {
      this.client.getQueryCache().notify({
        type: 'observerOptionsUpdated',
        query: this.currentQuery,
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

    this.updateQuery()

    const mounted = this.hasListeners()

    // Fetch if there are subscribers
    if (
      mounted &&
      shouldFetchOptionally(
        this.currentQuery,
        prevQuery,
        this.options,
        prevOptions,
      )
    ) {
      this.executeFetch()
    }

    // Update result
    this.updateResult(notifyOptions)

    // Update stale interval if needed
    if (
      mounted &&
      (this.currentQuery !== prevQuery ||
        this.options.enabled !== prevOptions.enabled ||
        this.options.staleTime !== prevOptions.staleTime)
    ) {
      this.updateStaleTimeout()
    }

    const nextRefetchInterval = this.computeRefetchInterval()

    // Update refetch interval if needed
    if (
      mounted &&
      (this.currentQuery !== prevQuery ||
        this.options.enabled !== prevOptions.enabled ||
        nextRefetchInterval !== this.currentRefetchInterval)
    ) {
      this.updateRefetchInterval(nextRefetchInterval)
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
    const query = this.client.getQueryCache().build(this.client, options)

    return this.createResult(query, options)
  }

  getCurrentResult(): QueryObserverResult<TData, TError> {
    return this.currentResult
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
          this.trackedProps.add(key as keyof QueryObserverResult)
          return result[key as keyof QueryObserverResult]
        },
      })
    })

    return trackedResult
  }

  getCurrentQuery(): Query<TQueryFnData, TError, TQueryData, TQueryKey> {
    return this.currentQuery
  }

  remove(): void {
    this.client.getQueryCache().remove(this.currentQuery)
  }

  refetch<TPageData>({
    refetchPage,
    ...options
  }: RefetchOptions & RefetchPageFilters<TPageData> = {}): Promise<
    QueryObserverResult<TData, TError>
  > {
    return this.fetch({
      ...options,
      meta: { refetchPage },
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
    const defaultedOptions = this.client.defaultQueryOptions(options)

    const query = this.client
      .getQueryCache()
      .build(this.client, defaultedOptions)
    query.isFetchingOptimistic = true

    return query.fetch().then(() => this.createResult(query, defaultedOptions))
  }

  protected fetch(
    fetchOptions: ObserverFetchOptions,
  ): Promise<QueryObserverResult<TData, TError>> {
    return this.executeFetch({
      ...fetchOptions,
      cancelRefetch: fetchOptions.cancelRefetch ?? true,
    }).then(() => {
      this.updateResult()
      return this.currentResult
    })
  }

  private executeFetch(
    fetchOptions?: ObserverFetchOptions,
  ): Promise<TQueryData | undefined> {
    // Make sure we reference the latest query as the current one might have been removed
    this.updateQuery()

    // Fetch
    let promise: Promise<TQueryData | undefined> = this.currentQuery.fetch(
      this.options as QueryOptions<TQueryFnData, TError, TQueryData, TQueryKey>,
      fetchOptions,
    )

    if (!fetchOptions?.throwOnError) {
      promise = promise.catch(noop)
    }

    return promise
  }

  private updateStaleTimeout(): void {
    this.clearStaleTimeout()

    if (
      isServer ||
      this.currentResult.isStale ||
      !isValidTimeout(this.options.staleTime)
    ) {
      return
    }

    const time = timeUntilStale(
      this.currentResult.dataUpdatedAt,
      this.options.staleTime,
    )

    // The timeout is sometimes triggered 1 ms before the stale time expiration.
    // To mitigate this issue we always add 1 ms to the timeout.
    const timeout = time + 1

    this.staleTimeoutId = setTimeout(() => {
      if (!this.currentResult.isStale) {
        this.updateResult()
      }
    }, timeout)
  }

  private computeRefetchInterval() {
    return typeof this.options.refetchInterval === 'function'
      ? this.options.refetchInterval(this.currentResult.data, this.currentQuery)
      : this.options.refetchInterval ?? false
  }

  private updateRefetchInterval(nextInterval: number | false): void {
    this.clearRefetchInterval()

    this.currentRefetchInterval = nextInterval

    if (
      isServer ||
      this.options.enabled === false ||
      !isValidTimeout(this.currentRefetchInterval) ||
      this.currentRefetchInterval === 0
    ) {
      return
    }

    this.refetchIntervalId = setInterval(() => {
      if (
        this.options.refetchIntervalInBackground ||
        focusManager.isFocused()
      ) {
        this.executeFetch()
      }
    }, this.currentRefetchInterval)
  }

  private updateTimers(): void {
    this.updateStaleTimeout()
    this.updateRefetchInterval(this.computeRefetchInterval())
  }

  private clearStaleTimeout(): void {
    if (this.staleTimeoutId) {
      clearTimeout(this.staleTimeoutId)
      this.staleTimeoutId = undefined
    }
  }

  private clearRefetchInterval(): void {
    if (this.refetchIntervalId) {
      clearInterval(this.refetchIntervalId)
      this.refetchIntervalId = undefined
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
    const prevQuery = this.currentQuery
    const prevOptions = this.options
    const prevResult = this.currentResult as
      | QueryObserverResult<TData, TError>
      | undefined
    const prevResultState = this.currentResultState
    const prevResultOptions = this.currentResultOptions
    const queryChange = query !== prevQuery
    const queryInitialState = queryChange
      ? query.state
      : this.currentQueryInitialState
    const prevQueryResult = queryChange
      ? this.currentResult
      : this.previousQueryResult

    const { state } = query
    let { dataUpdatedAt, error, errorUpdatedAt, fetchStatus, status } = state
    let isPreviousData = false
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
        if (!dataUpdatedAt) {
          status = 'loading'
        }
      }
      if (options._optimisticResults === 'isRestoring') {
        fetchStatus = 'idle'
      }
    }

    // Keep previous data if needed
    if (
      options.keepPreviousData &&
      !state.dataUpdateCount &&
      prevQueryResult?.isSuccess &&
      status !== 'error'
    ) {
      data = prevQueryResult.data
      dataUpdatedAt = prevQueryResult.dataUpdatedAt
      status = prevQueryResult.status
      isPreviousData = true
    }
    // Select data if needed
    else if (options.select && typeof state.data !== 'undefined') {
      // Memoize select result
      if (
        prevResult &&
        state.data === prevResultState?.data &&
        options.select === this.selectFn
      ) {
        data = this.selectResult
      } else {
        try {
          this.selectFn = options.select
          data = options.select(state.data)
          data = replaceData(prevResult?.data, data, options)
          this.selectResult = data
          this.selectError = null
        } catch (selectError) {
          if (process.env.NODE_ENV !== 'production') {
            this.client.getLogger().error(selectError)
          }
          this.selectError = selectError as TError
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
      status === 'loading'
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
            ? (options.placeholderData as PlaceholderDataFunction<TQueryData>)()
            : options.placeholderData
        if (options.select && typeof placeholderData !== 'undefined') {
          try {
            placeholderData = options.select(placeholderData)
            placeholderData = replaceData(
              prevResult?.data,
              placeholderData,
              options,
            )
            this.selectError = null
          } catch (selectError) {
            if (process.env.NODE_ENV !== 'production') {
              this.client.getLogger().error(selectError)
            }
            this.selectError = selectError as TError
          }
        }
      }

      if (typeof placeholderData !== 'undefined') {
        status = 'success'
        data = placeholderData as TData
        isPlaceholderData = true
      }
    }

    if (this.selectError) {
      error = this.selectError as any
      data = this.selectResult
      errorUpdatedAt = Date.now()
      status = 'error'
    }

    const isFetching = fetchStatus === 'fetching'
    const isLoading = status === 'loading'
    const isError = status === 'error'

    const result: QueryObserverBaseResult<TData, TError> = {
      status,
      fetchStatus,
      isLoading,
      isSuccess: status === 'success',
      isError,
      isInitialLoading: isLoading && isFetching,
      data,
      dataUpdatedAt,
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
      isRefetching: isFetching && !isLoading,
      isLoadingError: isError && state.dataUpdatedAt === 0,
      isPaused: fetchStatus === 'paused',
      isPlaceholderData,
      isPreviousData,
      isRefetchError: isError && state.dataUpdatedAt !== 0,
      isStale: isStale(query, options),
      refetch: this.refetch,
      remove: this.remove,
    }

    return result as QueryObserverResult<TData, TError>
  }

  updateResult(notifyOptions?: NotifyOptions): void {
    const prevResult = this.currentResult as
      | QueryObserverResult<TData, TError>
      | undefined

    const nextResult = this.createResult(this.currentQuery, this.options)
    this.currentResultState = this.currentQuery.state
    this.currentResultOptions = this.options

    // Only notify and update result if something has changed
    if (shallowEqualObjects(nextResult, prevResult)) {
      return
    }

    this.currentResult = nextResult

    // Determine which callbacks to trigger
    const defaultNotifyOptions: NotifyOptions = { cache: true }

    const shouldNotifyListeners = (): boolean => {
      if (!prevResult) {
        return true
      }

      const { notifyOnChangeProps } = this.options

      if (
        notifyOnChangeProps === 'all' ||
        (!notifyOnChangeProps && !this.trackedProps.size)
      ) {
        return true
      }

      const includedProps = new Set(notifyOnChangeProps ?? this.trackedProps)

      if (this.options.useErrorBoundary) {
        includedProps.add('error')
      }

      return Object.keys(this.currentResult).some((key) => {
        const typedKey = key as keyof QueryObserverResult
        const changed = this.currentResult[typedKey] !== prevResult[typedKey]
        return changed && includedProps.has(typedKey)
      })
    }

    if (notifyOptions?.listeners !== false && shouldNotifyListeners()) {
      defaultNotifyOptions.listeners = true
    }

    this.notify({ ...defaultNotifyOptions, ...notifyOptions })
  }

  private updateQuery(): void {
    const query = this.client.getQueryCache().build(this.client, this.options)

    if (query === this.currentQuery) {
      return
    }

    const prevQuery = this.currentQuery as
      | Query<TQueryFnData, TError, TQueryData, TQueryKey>
      | undefined
    this.currentQuery = query
    this.currentQueryInitialState = query.state
    this.previousQueryResult = this.currentResult

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

    this.updateResult(notifyOptions)

    if (this.hasListeners()) {
      this.updateTimers()
    }
  }

  private notify(notifyOptions: NotifyOptions): void {
    notifyManager.batch(() => {
      // First trigger the configuration callbacks
      if (notifyOptions.onSuccess) {
        this.options.onSuccess?.(this.currentResult.data!)
        this.options.onSettled?.(this.currentResult.data!, null)
      } else if (notifyOptions.onError) {
        this.options.onError?.(this.currentResult.error!)
        this.options.onSettled?.(undefined, this.currentResult.error!)
      }

      // Then trigger the listeners
      if (notifyOptions.listeners) {
        this.listeners.forEach((listener) => {
          listener(this.currentResult)
        })
      }

      // Then the cache listeners
      if (notifyOptions.cache) {
        this.client.getQueryCache().notify({
          query: this.currentQuery,
          type: 'observerResultsUpdated',
        })
      }
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
  field: typeof options['refetchOnMount'] &
    typeof options['refetchOnWindowFocus'] &
    typeof options['refetchOnReconnect'],
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
