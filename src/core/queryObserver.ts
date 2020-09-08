import {
  getStatusProps,
  isServer,
  isDocumentVisible,
  isValidTimeout,
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
  private initialFetchedCount: number
  private staleTimeoutId?: number
  private refetchIntervalId?: number

  constructor(config: ResolvedQueryConfig<TResult, TError>) {
    this.config = config
    this.initialFetchedCount = 0

    // Bind exposed methods
    this.clear = this.clear.bind(this)
    this.refetch = this.refetch.bind(this)
    this.fetchMore = this.fetchMore.bind(this)

    // Subscribe to the query
    this.updateQuery()
  }

  subscribe(listener?: UpdateListener<TResult, TError>): () => void {
    this.listener = listener
    this.currentQuery.subscribeObserver(this)

    if (this.config.enabled && this.config.forceFetchOnMount) {
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

  clear(): void {
    return this.currentQuery.clear()
  }

  async refetch(options?: RefetchOptions): Promise<TResult | undefined> {
    return this.currentQuery.refetch(options, this.config)
  }

  async fetchMore(
    fetchMoreVariable?: unknown,
    options?: FetchMoreOptions
  ): Promise<TResult | undefined> {
    return this.currentQuery.fetchMore(fetchMoreVariable, options, this.config)
  }

  async fetch(): Promise<TResult | undefined> {
    try {
      return await this.currentQuery.fetch(undefined, this.config)
    } catch {
      // ignore
    }
  }

  private optionalFetch(): void {
    if (
      this.config.enabled && // Don't auto refetch if disabled
      !(this.config.suspense && this.currentResult.isFetched) && // Don't refetch if in suspense mode and the data is already fetched
      this.currentResult.isStale && // Only refetch if stale
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

    if (this.currentResult.isStale || !isValidTimeout(this.config.staleTime)) {
      return
    }

    const timeElapsed = Date.now() - this.currentResult.updatedAt
    const timeUntilStale = this.config.staleTime - timeElapsed + 1
    const timeout = Math.max(timeUntilStale, 0)

    this.staleTimeoutId = setTimeout(() => {
      if (!this.currentResult.isStale) {
        this.currentResult = { ...this.currentResult, isStale: true }
        this.notify()
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
    const { currentQuery, currentResult, previousQueryResult, config } = this
    const { state } = currentQuery
    let { data, status, updatedAt } = state
    let isPreviousData = false

    // Keep previous data if needed
    if (
      config.keepPreviousData &&
      (state.isIdle || state.isLoading) &&
      previousQueryResult?.isSuccess
    ) {
      data = previousQueryResult.data
      updatedAt = previousQueryResult.updatedAt
      status = previousQueryResult.status
      isPreviousData = true
    }

    let isStale

    // When the query has not been fetched yet and this is the initial render,
    // determine the staleness based on the initialStale or existence of initial data.
    if (!currentResult && !state.isFetched) {
      if (typeof config.initialStale === 'function') {
        isStale = config.initialStale()
      } else if (typeof config.initialStale === 'boolean') {
        isStale = config.initialStale
      } else {
        isStale = typeof state.data === 'undefined'
      }
    } else {
      isStale = currentQuery.isStaleByTime(config.staleTime)
    }

    this.currentResult = {
      ...getStatusProps(status),
      canFetchMore: state.canFetchMore,
      clear: this.clear,
      data,
      error: state.error,
      failureCount: state.failureCount,
      fetchMore: this.fetchMore,
      isFetched: state.isFetched,
      isFetchedAfterMount: state.fetchedCount > this.initialFetchedCount,
      isFetching: state.isFetching,
      isFetchingMore: state.isFetchingMore,
      isPreviousData,
      isStale,
      refetch: this.refetch,
      updatedAt,
    }
  }

  private updateQuery(): void {
    const prevQuery = this.currentQuery

    // Remove the initial data when there is an existing query
    // because this data should not be used for a new query
    const config =
      this.config.keepPreviousData && prevQuery
        ? { ...this.config, initialData: undefined }
        : this.config

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
    this.initialFetchedCount = query.state.fetchedCount
    this.updateResult()

    if (this.listener) {
      prevQuery?.unsubscribeObserver(this)
      this.currentQuery.subscribeObserver(this)
    }
  }

  onQueryUpdate(action: Action<TResult, TError>): void {
    const { type } = action

    // Store current result and get new result
    const prevResult = this.currentResult
    this.updateResult()

    const { currentResult, config } = this

    // We need to check the action because the state could have
    // transitioned from success to success in case of `setQueryData`.
    if (type === 2) {
      config.onSuccess?.(currentResult.data!)
      config.onSettled?.(currentResult.data!, null)
      this.updateTimers()
    } else if (type === 3) {
      config.onError?.(currentResult.error!)
      config.onSettled?.(undefined, currentResult.error!)
      this.updateTimers()
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
