import {
  getStatusProps,
  isServer,
  isValidTimeout,
  noop,
  replaceEqualDeep,
  shallowEqualObjects,
  timeUntilStale,
} from './utils'
import { notifyManager } from './notifyManager'
import type {
  PlaceholderDataFunction,
  QueryObserverOptions,
  QueryObserverResult,
  QueryOptions,
  RefetchOptions,
  ResultOptions,
} from './types'
import type { Query, QueryState, Action, FetchOptions } from './query'
import type { QueryClient } from './queryClient'
import { focusManager } from './focusManager'
import { Subscribable } from './subscribable'

type QueryObserverListener<TData, TError> = (
  result: QueryObserverResult<TData, TError>
) => void

interface NotifyOptions {
  cache?: boolean
  listeners?: boolean
  onError?: boolean
  onSuccess?: boolean
}

export interface ObserverFetchOptions extends FetchOptions {
  throwOnError?: boolean
}

export class QueryObserver<
  TData = unknown,
  TError = unknown,
  TQueryFnData = TData,
  TQueryData = TQueryFnData
> extends Subscribable<QueryObserverListener<TData, TError>> {
  options: QueryObserverOptions<TData, TError, TQueryFnData, TQueryData>

  private client: QueryClient
  private currentQuery!: Query<TQueryData, TError, TQueryFnData>
  private currentResult!: QueryObserverResult<TData, TError>
  private currentResultState?: QueryState<TQueryData, TError>
  private previousQueryResult?: QueryObserverResult<TData, TError>
  private initialDataUpdateCount: number
  private staleTimeoutId?: number
  private refetchIntervalId?: number

  constructor(
    client: QueryClient,
    options: QueryObserverOptions<TData, TError, TQueryFnData, TQueryData>
  ) {
    super()

    this.client = client
    this.options = options
    this.initialDataUpdateCount = 0
    this.bindMethods()
    this.setOptions(options)
  }

  protected bindMethods(): void {
    this.remove = this.remove.bind(this)
    this.refetch = this.refetch.bind(this)
  }

  protected onSubscribe(): void {
    if (this.listeners.length === 1) {
      this.updateQuery()

      this.currentQuery.addObserver(this)

      if (this.willFetchOnMount()) {
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

  willFetchOnMount(): boolean {
    return (
      this.options.enabled !== false &&
      (!this.currentQuery.state.dataUpdatedAt ||
        this.options.refetchOnMount === 'always' ||
        (this.options.refetchOnMount !== false && this.isStale()))
    )
  }

  willFetchOnReconnect(): boolean {
    return (
      this.options.enabled !== false &&
      (this.options.refetchOnReconnect === 'always' ||
        (this.options.refetchOnReconnect !== false && this.isStale()))
    )
  }

  willFetchOnWindowFocus(): boolean {
    return (
      this.options.enabled !== false &&
      (this.options.refetchOnWindowFocus === 'always' ||
        (this.options.refetchOnWindowFocus !== false && this.isStale()))
    )
  }

  private willFetchOptionally(): boolean {
    return this.options.enabled !== false && this.isStale()
  }

  private isStale(): boolean {
    return this.currentQuery.isStaleByTime(this.options.staleTime)
  }

  destroy(): void {
    this.listeners = []
    this.clearTimers()
    this.currentQuery.removeObserver(this)
  }

  setOptions(
    options?: QueryObserverOptions<TData, TError, TQueryFnData, TQueryData>
  ): void {
    const prevOptions = this.options
    const prevQuery = this.currentQuery

    this.options = this.client.defaultQueryObserverOptions(options)

    // Keep previous query key if the user does not supply one
    if (!this.options.queryKey) {
      this.options.queryKey = prevOptions.queryKey
    }

    this.updateQuery()

    // Take no further actions if there are no subscribers
    if (!this.listeners.length) {
      return
    }

    // If we subscribed to a new query, optionally fetch and update refetch
    if (this.currentQuery !== prevQuery) {
      this.optionalFetch()
      this.updateTimers()
      return
    }

    // Optionally fetch if the query became enabled
    if (this.options.enabled !== false && prevOptions.enabled === false) {
      this.optionalFetch()
    }

    // Update stale interval if needed
    if (
      this.options.enabled !== prevOptions.enabled ||
      this.options.staleTime !== prevOptions.staleTime
    ) {
      this.updateStaleTimeout()
    }

    // Update refetch interval if needed
    if (
      this.options.enabled !== prevOptions.enabled ||
      this.options.refetchInterval !== prevOptions.refetchInterval
    ) {
      this.updateRefetchInterval()
    }
  }

  getCurrentResult(): QueryObserverResult<TData, TError> {
    return this.currentResult
  }

  getNextResult(
    options?: ResultOptions
  ): Promise<QueryObserverResult<TData, TError>> {
    return new Promise((resolve, reject) => {
      const unsubscribe = this.subscribe(result => {
        if (!result.isFetching) {
          unsubscribe()
          if (result.isError && options?.throwOnError) {
            reject(result.error)
          } else {
            resolve(result)
          }
        }
      })
    })
  }

  getCurrentQuery(): Query<TQueryData, TError, TQueryFnData> {
    return this.currentQuery
  }

  remove(): void {
    this.client.getQueryCache().remove(this.currentQuery)
  }

  refetch(
    options?: RefetchOptions
  ): Promise<QueryObserverResult<TData, TError>> {
    return this.fetch({ origin: 'observerRefetch', ...options })
  }

  protected fetch(
    fetchOptions?: ObserverFetchOptions
  ): Promise<QueryObserverResult<TData, TError>> {
    return this.executeFetch(fetchOptions).then(() => {
      this.updateResult()
      return this.currentResult
    })
  }

  private optionalFetch(): void {
    if (this.willFetchOptionally()) {
      this.executeFetch()
    }
  }

  private executeFetch(
    fetchOptions?: ObserverFetchOptions
  ): Promise<TQueryData | undefined> {
    // Make sure we reference the latest query as the current one might have been removed
    this.updateQuery()

    // Fetch
    return this.currentQuery
      .fetch(this.options as QueryOptions<TQueryData, TError, TQueryFnData>, {
        ...fetchOptions,
        origin: fetchOptions?.origin || 'observerFetch',
      })
      .catch(noop)
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
      this.currentResult.updatedAt,
      this.options.staleTime
    )

    // The timeout is sometimes triggered 1 ms before the stale time expiration.
    // To mitigate this issue we always add 1 ms to the timeout.
    const timeout = time + 1

    this.staleTimeoutId = setTimeout(() => {
      if (!this.currentResult.isStale) {
        this.updateResult()
        this.notify({
          listeners: this.options.notifyOnStaleChange === true,
          cache: true,
        })
      }
    }, timeout)
  }

  private updateRefetchInterval(): void {
    this.clearRefetchInterval()

    if (
      isServer ||
      this.options.enabled === false ||
      !isValidTimeout(this.options.refetchInterval)
    ) {
      return
    }

    this.refetchIntervalId = setInterval(() => {
      if (
        this.options.refetchIntervalInBackground ||
        focusManager.isFocused()
      ) {
        this.executeFetch({ origin: 'observerRefetchInterval' })
      }
    }, this.options.refetchInterval)
  }

  private updateTimers(): void {
    this.updateStaleTimeout()
    this.updateRefetchInterval()
  }

  private clearTimers(): void {
    this.clearStaleTimeout()
    this.clearRefetchInterval()
  }

  private clearStaleTimeout(): void {
    clearInterval(this.staleTimeoutId)
    this.staleTimeoutId = undefined
  }

  private clearRefetchInterval(): void {
    clearInterval(this.refetchIntervalId)
    this.refetchIntervalId = undefined
  }

  protected getNewResult(
    willFetch?: boolean
  ): QueryObserverResult<TData, TError> {
    const { state } = this.currentQuery
    let { dataOrigin, fetchOrigin, isFetching, status } = state
    let isPreviousData = false
    let isPlaceholderData = false
    let data: TData | undefined
    let updatedAt = state.dataUpdatedAt

    // Optimistically set status to loading if we will start fetching
    if (willFetch) {
      isFetching = true
      fetchOrigin = 'observerFetch'
      if (status === 'idle') {
        status = 'loading'
      }
    }

    // Keep previous data if needed
    if (
      this.options.keepPreviousData &&
      !state.dataUpdateCount &&
      this.previousQueryResult?.isSuccess
    ) {
      data = this.previousQueryResult.data
      updatedAt = this.previousQueryResult.updatedAt
      dataOrigin = this.previousQueryResult.dataOrigin
      status = this.previousQueryResult.status
      isPreviousData = true
    }
    // Select data if needed
    else if (this.options.select && typeof state.data !== 'undefined') {
      // Use the previous select result if the query data did not change
      if (this.currentResult && state.data === this.currentResultState?.data) {
        data = this.currentResult.data
      } else {
        data = this.options.select(state.data)
        if (this.options.structuralSharing !== false) {
          data = replaceEqualDeep(this.currentResult?.data, data)
        }
      }
    }
    // Use query data
    else {
      data = (state.data as unknown) as TData
    }

    // Show placeholder data if needed
    if (
      typeof this.options.placeholderData !== 'undefined' &&
      typeof data === 'undefined' &&
      status === 'loading'
    ) {
      const placeholderData =
        typeof this.options.placeholderData === 'function'
          ? (this.options.placeholderData as PlaceholderDataFunction<TData>)()
          : this.options.placeholderData
      if (typeof placeholderData !== 'undefined') {
        status = 'success'
        data = placeholderData
        isPlaceholderData = true
      }
    }

    return {
      ...getStatusProps(status),
      data,
      dataOrigin,
      error: state.error,
      errorOrigin: state.errorOrigin,
      failureCount: state.fetchFailureCount,
      fetchOrigin,
      isFetched: state.dataUpdateCount > 0,
      isFetchedAfterMount: state.dataUpdateCount > this.initialDataUpdateCount,
      isFetching,
      isPlaceholderData,
      isPreviousData,
      isStale: this.isStale(),
      refetch: this.refetch,
      remove: this.remove,
      updatedAt,
    }
  }

  private updateResult(willFetch?: boolean): void {
    const result = this.getNewResult(willFetch)

    // Keep reference to the current state on which the current result is based on
    this.currentResultState = this.currentQuery.state

    // Only update if something has changed
    if (!shallowEqualObjects(result, this.currentResult)) {
      this.currentResult = result
    }
  }

  private updateQuery(): void {
    const prevQuery = this.currentQuery

    const query = this.client
      .getQueryCache()
      .build(
        this.client,
        this.options as QueryOptions<TQueryData, TError, TQueryFnData>
      )

    if (query === prevQuery) {
      return
    }

    this.previousQueryResult = this.currentResult
    this.currentQuery = query
    this.initialDataUpdateCount = query.state.dataUpdateCount

    const willFetch = prevQuery
      ? this.willFetchOptionally()
      : this.willFetchOnMount()

    this.updateResult(willFetch)

    if (!this.hasListeners()) {
      return
    }

    prevQuery?.removeObserver(this)
    this.currentQuery.addObserver(this)

    if (this.options.notifyOnStatusChange !== false) {
      this.notify({ listeners: true })
    }
  }

  onQueryUpdate(action: Action<TData, TError>): void {
    // Store current result and get new result
    const prevResult = this.currentResult
    this.updateResult()
    const currentResult = this.currentResult

    // Update timers
    this.updateTimers()

    // Do not notify if the nothing has changed
    if (prevResult === currentResult) {
      return
    }

    // Determine which callbacks to trigger
    const notifyOptions: NotifyOptions = {}

    if (action.type === 'success') {
      notifyOptions.onSuccess = true
    } else if (action.type === 'error') {
      notifyOptions.onError = true
    }

    if (
      // Always notify if notifyOnStatusChange is set
      this.options.notifyOnStatusChange !== false ||
      // Otherwise only notify on data or error change
      currentResult.data !== prevResult.data ||
      currentResult.error !== prevResult.error
    ) {
      notifyOptions.listeners = true
    }

    this.notify(notifyOptions)
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
        this.listeners.forEach(listener => {
          listener(this.currentResult)
        })
      }

      // Then the cache listeners
      if (notifyOptions.cache) {
        this.client.getQueryCache().notify(this.currentQuery)
      }
    })
  }
}
