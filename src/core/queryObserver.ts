import {
  getStatusProps,
  isDocumentVisible,
  isServer,
  isValidTimeout,
  noop,
} from './utils'
import type { QueryResult, ResolvedQueryConfig } from './types'
import type { Query, Action, FetchMoreOptions, RefetchOptions } from './query'

export type UpdateListener<TResult, TError> = (
  result: QueryResult<TResult, TError>
) => void

export class QueryObserver<TResult, TError> {
  config: ResolvedQueryConfig<TResult, TError>

  private currentQuery!: Query<TResult, TError>
  private currentResult!: QueryResult<TResult, TError>
  private previousQueryResult?: QueryResult<TResult, TError>
  private listener?: UpdateListener<TResult, TError>
  private isStale: boolean
  private initialUpdateCount: number
  private staleTimeoutId?: number
  private refetchIntervalId?: number

  constructor(config: ResolvedQueryConfig<TResult, TError>) {
    this.config = config
    this.isStale = true
    this.initialUpdateCount = 0

    // Bind exposed methods
    this.remove = this.remove.bind(this)
    this.refetch = this.refetch.bind(this)
    this.fetchMore = this.fetchMore.bind(this)

    // Subscribe to the query
    this.updateQuery()
  }

  subscribe(listener?: UpdateListener<TResult, TError>): () => void {
    this.listener = listener
    this.currentQuery.subscribeObserver(this)

    if (
      this.config.enabled &&
      (this.config.forceFetchOnMount || this.config.refetchOnMount === 'always')
    ) {
      this.fetch()
    } else {
      this.optionalFetch()
    }

    this.updateTimers()
    return this.unsubscribe.bind(this)
  }

  unsubscribe(): void {
    this.listener = undefined
    this.clearTimers()
    this.currentQuery.unsubscribeObserver(this)
  }

  updateConfig(config: ResolvedQueryConfig<TResult, TError>): void {
    const prevConfig = this.config
    const prevQuery = this.currentQuery

    this.config = config
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
    if (config.enabled && !prevConfig.enabled) {
      this.optionalFetch()
    }

    // Update stale interval if needed
    if (
      config.enabled !== prevConfig.enabled ||
      config.staleTime !== prevConfig.staleTime
    ) {
      this.updateStaleTimeout()
    }

    // Update refetch interval if needed
    if (
      config.enabled !== prevConfig.enabled ||
      config.refetchInterval !== prevConfig.refetchInterval
    ) {
      this.updateRefetchInterval()
    }
  }

  getCurrentQuery(): Query<TResult, TError> {
    return this.currentQuery
  }

  getCurrentResult(): QueryResult<TResult, TError> {
    return this.currentResult
  }

  /**
   * @deprecated
   */
  clear(): void {
    this.remove()
  }

  remove(): void {
    this.currentQuery.remove()
  }

  refetch(options?: RefetchOptions): Promise<TResult | undefined> {
    return this.currentQuery.refetch(options, this.config)
  }

  fetchMore(
    fetchMoreVariable?: unknown,
    options?: FetchMoreOptions
  ): Promise<TResult | undefined> {
    return this.currentQuery
      .fetchMore(fetchMoreVariable, options, this.config)
      .catch(noop)
  }

  fetch(): Promise<TResult | undefined> {
    return this.currentQuery.fetch(undefined, this.config).catch(noop)
  }

  private optionalFetch(): void {
    if (
      this.config.enabled && // Only fetch if enabled
      this.isStale && // Only fetch if stale
      !(this.config.suspense && this.currentResult.isFetched) && // Don't refetch if in suspense mode and the data is already fetched
      (this.config.refetchOnMount || this.currentQuery.observers.length === 1)
    ) {
      this.fetch()
    }
  }

  private notify(): void {
    this.listener?.(this.currentResult)
  }

  private updateStaleTimeout(): void {
    if (isServer) {
      return
    }

    this.clearStaleTimeout()

    if (this.isStale || !isValidTimeout(this.config.staleTime)) {
      return
    }

    const timeElapsed = Date.now() - this.currentResult.updatedAt
    const timeUntilStale = this.config.staleTime - timeElapsed + 1
    const timeout = Math.max(timeUntilStale, 0)

    this.staleTimeoutId = setTimeout(() => {
      if (!this.isStale) {
        this.isStale = true
        this.updateResult()
        this.notify()
        this.config.queryCache.notifyGlobalListeners(this.currentQuery)
      }
    }, timeout)
  }

  private updateRefetchInterval(): void {
    if (isServer) {
      return
    }

    this.clearRefetchInterval()

    if (!this.config.enabled || !isValidTimeout(this.config.refetchInterval)) {
      return
    }

    this.refetchIntervalId = setInterval(() => {
      if (this.config.refetchIntervalInBackground || isDocumentVisible()) {
        this.fetch()
      }
    }, this.config.refetchInterval)
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
    if (this.staleTimeoutId) {
      clearInterval(this.staleTimeoutId)
      this.staleTimeoutId = undefined
    }
  }

  private clearRefetchInterval(): void {
    if (this.refetchIntervalId) {
      clearInterval(this.refetchIntervalId)
      this.refetchIntervalId = undefined
    }
  }

  private updateResult(): void {
    const { currentQuery, previousQueryResult, config } = this
    const { state } = currentQuery
    let { data, status, updatedAt } = state
    let isPreviousData = false

    // Keep previous data if needed
    if (
      config.keepPreviousData &&
      state.isInitialData &&
      previousQueryResult?.isSuccess
    ) {
      data = previousQueryResult.data
      updatedAt = previousQueryResult.updatedAt
      status = previousQueryResult.status
      isPreviousData = true
    }

    this.currentResult = {
      ...getStatusProps(status),
      canFetchMore: state.canFetchMore,
      clear: this.remove,
      data,
      error: state.error,
      failureCount: state.failureCount,
      fetchMore: this.fetchMore,
      isFetched: state.updateCount > 0,
      isFetchedAfterMount: state.updateCount > this.initialUpdateCount,
      isFetching: state.isFetching,
      isFetchingMore: state.isFetchingMore,
      isInitialData: state.isInitialData,
      isPreviousData,
      isStale: this.isStale,
      refetch: this.refetch,
      remove: this.remove,
      updatedAt,
    }
  }

  private updateQuery(): void {
    const config = this.config
    const prevQuery = this.currentQuery

    let query = config.queryCache.getQueryByHash<TResult, TError>(
      config.queryHash
    )

    if (!query) {
      query = config.queryCache.createQuery(config)
    }

    if (query === prevQuery) {
      return
    }

    this.previousQueryResult = this.currentResult
    this.currentQuery = query
    this.initialUpdateCount = query.state.updateCount

    // Update stale state on query switch
    if (query.state.isInitialData) {
      if (config.keepPreviousData && prevQuery) {
        this.isStale = true
      } else if (typeof config.initialStale === 'function') {
        this.isStale = config.initialStale()
      } else if (typeof config.initialStale === 'boolean') {
        this.isStale = config.initialStale
      } else {
        this.isStale = typeof query.state.data === 'undefined'
      }
    } else {
      this.isStale = query.isStaleByTime(config.staleTime)
    }

    this.updateResult()

    if (this.listener) {
      prevQuery?.unsubscribeObserver(this)
      this.currentQuery.subscribeObserver(this)
    }
  }

  onQueryUpdate(action: Action<TResult, TError>): void {
    const { config } = this
    const { type } = action

    // Update stale state on success, error or invalidation
    if (type === 2 || type === 3 || type === 4) {
      this.isStale = this.currentQuery.isStaleByTime(config.staleTime)
    }

    // Store current result and get new result
    const prevResult = this.currentResult
    this.updateResult()
    const currentResult = this.currentResult

    // Update timers on success, error or invalidation
    if (type === 2 || type === 3 || type === 4) {
      this.updateTimers()
    }

    // Trigger callbacks on success or error
    if (type === 2) {
      config.onSuccess?.(currentResult.data!)
      config.onSettled?.(currentResult.data!, null)
    } else if (type === 3) {
      config.onError?.(currentResult.error!)
      config.onSettled?.(undefined, currentResult.error!)
    }

    // Do not notify if the query was invalidated but the stale state did not changed
    if (type === 4 && currentResult.isStale === prevResult.isStale) {
      return
    }

    if (
      // Always notify on data or error change
      currentResult.data !== prevResult.data ||
      currentResult.error !== prevResult.error ||
      // Maybe notify on other changes
      config.notifyOnStatusChange
    ) {
      this.notify()
    }
  }
}
