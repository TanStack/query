import {
  getStatusProps,
  isDocumentVisible,
  isServer,
  isValidTimeout,
  noop,
  timeUntilStale,
} from './utils'
import { notifyManager } from './notifyManager'
import type {
  FetchMoreOptions,
  QueryObserverOptions,
  QueryObserverResult,
  QueryOptions,
  RefetchOptions,
} from './types'
import type { Query, Action, FetchOptions } from './query'
import { QueryClient } from './queryClient'

export interface QueryObserverConfig<
  TData = unknown,
  TError = unknown,
  TQueryFnData = TData,
  TQueryData = TQueryFnData
> {
  client: QueryClient
  options?: QueryObserverOptions<TData, TError, TQueryFnData, TQueryData>
}

type QueryObserverListener<TData, TError> = (
  result: QueryObserverResult<TData, TError>
) => void

interface NotifyOptions {
  cache?: boolean
  listener?: boolean
  onError?: boolean
  onSuccess?: boolean
}

export class QueryObserver<
  TData = unknown,
  TError = unknown,
  TQueryFnData = TData,
  TQueryData = TQueryFnData
> {
  options: QueryObserverOptions<TData, TError, TQueryFnData, TQueryData>

  private client: QueryClient
  private currentQuery!: Query<TQueryData, TError, TQueryFnData>
  private currentResult!: QueryObserverResult<TData, TError>
  private previousQueryResult?: QueryObserverResult<TData, TError>
  private listener?: QueryObserverListener<TData, TError>
  private initialDataUpdateCount: number
  private staleTimeoutId?: number
  private refetchIntervalId?: number

  constructor(
    config: QueryObserverConfig<TData, TError, TQueryFnData, TQueryData>
  ) {
    this.client = config.client
    this.options = config.client.defaultQueryObserverOptions(config.options)
    this.initialDataUpdateCount = 0

    // Bind exposed methods
    this.remove = this.remove.bind(this)
    this.refetch = this.refetch.bind(this)
    this.fetchMore = this.fetchMore.bind(this)
    this.unsubscribe = this.unsubscribe.bind(this)

    // Subscribe to the query
    this.updateQuery()
  }

  subscribe(listener?: QueryObserverListener<TData, TError>): () => void {
    this.listener = listener || noop
    this.currentQuery.subscribeObserver(this)

    if (this.options.enabled) {
      if (this.options.refetchOnMount === 'always') {
        this.fetch()
      } else if (
        this.options.refetchOnMount ||
        !this.currentQuery.state.updatedAt
      ) {
        this.optionalFetch()
      }
    }

    this.updateTimers()

    return this.unsubscribe
  }

  unsubscribe(): void {
    this.listener = undefined
    this.clearTimers()
    this.currentQuery.unsubscribeObserver(this)
  }

  setOptions(
    options?: QueryObserverOptions<TData, TError, TQueryFnData, TQueryData>
  ): void {
    const prevOptions = this.options
    const prevQuery = this.currentQuery

    this.options = this.client.defaultQueryObserverOptions({
      ...prevOptions,
      ...options,
    })

    this.updateQuery()

    // Take no further actions if there is no subscriber
    if (!this.listener) {
      return
    }

    // If we subscribed to a new query, optionally fetch and update refetch
    if (this.currentQuery !== prevQuery) {
      this.optionalFetch()
      this.updateTimers()
      return
    }

    // Optionally fetch if the query became enabled
    if (this.options.enabled && !prevOptions.enabled) {
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

  getCurrentQuery(): Query<TQueryData, TError, TQueryFnData> {
    return this.currentQuery
  }

  remove(): void {
    this.currentQuery.remove()
  }

  refetch(options?: RefetchOptions): Promise<TData | undefined> {
    return this.fetch(options)
  }

  fetchMore(
    fetchMoreVariable?: unknown,
    options?: FetchMoreOptions
  ): Promise<TData | undefined> {
    return this.fetch({ fetchMore: { ...options, fetchMoreVariable } })
  }

  fetch(fetchOptions?: FetchOptions): Promise<TData | undefined> {
    const queryOptions = this.getQueryOptions()

    // Never try to fetch if no query function has been set
    if (!queryOptions.queryFn && !this.currentQuery.defaultOptions?.queryFn) {
      return Promise.resolve(this.currentResult.data)
    }

    let promise: Promise<TData | undefined> = this.currentQuery
      .fetch(queryOptions, fetchOptions)
      .then(data => this.resolveData(data))

    if (!fetchOptions?.throwOnError) {
      promise = promise.catch(noop)
    }

    return promise
  }

  private optionalFetch(): void {
    if (this.options.enabled && this.currentResult.isStale) {
      this.fetch()
    }
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
        this.notify({ listener: true, cache: true })
      }
    }, timeout)
  }

  private updateRefetchInterval(): void {
    this.clearRefetchInterval()

    if (
      isServer ||
      !this.options.enabled ||
      !isValidTimeout(this.options.refetchInterval)
    ) {
      return
    }

    this.refetchIntervalId = setInterval(() => {
      if (this.options.refetchIntervalInBackground || isDocumentVisible()) {
        this.fetch()
      }
    }, this.options.refetchInterval)
  }

  updateTimers(): void {
    this.updateStaleTimeout()
    this.updateRefetchInterval()
  }

  clearTimers(): void {
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

  private getQueryOptions(): QueryOptions<TQueryData, TError, TQueryFnData> {
    return this.options as QueryOptions<TQueryData, TError, TQueryFnData>
  }

  private resolveData(data?: TQueryData): TData {
    return this.options.select && typeof data !== 'undefined'
      ? this.options.select(data)
      : ((data as unknown) as TData)
  }

  private updateResult(): void {
    const { state } = this.currentQuery
    let { status, updatedAt } = state
    let isPreviousData = false
    let data

    // Keep previous data if needed
    if (
      this.options.keepPreviousData &&
      !state.dataUpdateCount &&
      this.previousQueryResult?.isSuccess
    ) {
      data = this.previousQueryResult.data
      updatedAt = this.previousQueryResult.updatedAt
      status = this.previousQueryResult.status
      isPreviousData = true
    } else {
      data = this.resolveData(state.data)
    }

    this.currentResult = {
      ...getStatusProps(status),
      canFetchMore: state.canFetchMore,
      data,
      error: state.error,
      failureCount: state.failureCount,
      fetchMore: this.fetchMore,
      isFetched: state.dataUpdateCount > 0,
      isFetchedAfterMount: state.dataUpdateCount > this.initialDataUpdateCount,
      isFetching: state.isFetching,
      isFetchingMore: state.isFetchingMore,
      isPreviousData,
      isStale: this.currentQuery.isStaleByTime(this.options.staleTime),
      refetch: this.refetch,
      remove: this.remove,
      updatedAt,
    }
  }

  private updateQuery(): void {
    const prevQuery = this.currentQuery

    const queryOptions = this.getQueryOptions()
    const query = this.client.getCache().build(queryOptions)

    if (query === prevQuery) {
      return
    }

    this.previousQueryResult = this.currentResult
    this.currentQuery = query
    this.initialDataUpdateCount = query.state.dataUpdateCount

    this.updateResult()

    if (!this.listener) {
      return
    }

    prevQuery?.unsubscribeObserver(this)
    this.currentQuery.subscribeObserver(this)

    if (this.options.notifyOnStatusChange) {
      this.notify({ listener: true })
    }
  }

  onQueryUpdate(action: Action<TData, TError>): void {
    const { options } = this
    const { type } = action

    // Store current result and get new result
    const prevResult = this.currentResult
    this.updateResult()
    const currentResult = this.currentResult

    // Update timers if needed
    if (type === 'success' || type === 'error' || type === 'invalidate') {
      this.updateTimers()
    }

    // Do not notify if the query was invalidated but the stale state did not changed
    if (type === 'invalidate' && currentResult.isStale === prevResult.isStale) {
      return
    }

    // Determine which callbacks to trigger
    const notifyOptions: NotifyOptions = {}

    if (type === 'success') {
      notifyOptions.onSuccess = true
    } else if (type === 'error') {
      notifyOptions.onError = true
    }

    if (
      // Always notify if notifyOnStatusChange is set
      options.notifyOnStatusChange ||
      // Otherwise only notify on data or error change
      currentResult.data !== prevResult.data ||
      currentResult.error !== prevResult.error
    ) {
      notifyOptions.listener = true
    }

    this.notify(notifyOptions)
  }

  private notify(notifyOptions: NotifyOptions): void {
    const { options, currentResult, currentQuery, listener } = this
    const { onSuccess, onSettled, onError } = options

    notifyManager.batch(() => {
      // First trigger the configuration callbacks
      if (notifyOptions.onSuccess) {
        if (onSuccess) {
          notifyManager.schedule(() => {
            onSuccess(currentResult.data!)
          })
        }
        if (onSettled) {
          notifyManager.schedule(() => {
            onSettled(currentResult.data!, null)
          })
        }
      } else if (notifyOptions.onError) {
        if (onError) {
          notifyManager.schedule(() => {
            onError(currentResult.error!)
          })
        }
        if (onSettled) {
          notifyManager.schedule(() => {
            onSettled(undefined, currentResult.error!)
          })
        }
      }

      // Then trigger the listener
      if (notifyOptions.listener && listener) {
        notifyManager.schedule(() => {
          listener(currentResult)
        })
      }

      // Then the cache listeners
      if (notifyOptions.cache) {
        this.client.getCache().notify(currentQuery)
      }
    })
  }
}
