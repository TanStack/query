import { getStatusProps, isServer, isDocumentVisible } from './utils'
import type { QueryResult, QueryObserverConfig } from './types'
import type { Query, Action, FetchMoreOptions, RefetchOptions } from './query'
import type { QueryCache } from './queryCache'

export type UpdateListener<TResult, TError> = (
  result: QueryResult<TResult, TError>
) => void

export class QueryObserver<TResult, TError> {
  config: QueryObserverConfig<TResult, TError>

  private queryCache: QueryCache
  private currentQuery!: Query<TResult, TError>
  private currentResult!: QueryResult<TResult, TError>
  private previousQueryResult?: QueryResult<TResult, TError>
  private updateListener?: UpdateListener<TResult, TError>
  private initialFetchedCount: number
  private staleTimeoutId?: number
  private refetchIntervalId?: number
  private started?: boolean

  constructor(config: QueryObserverConfig<TResult, TError>) {
    this.config = config
    this.queryCache = config.queryCache!
    this.initialFetchedCount = 0

    // Bind exposed methods
    this.clear = this.clear.bind(this)
    this.refetch = this.refetch.bind(this)
    this.fetchMore = this.fetchMore.bind(this)

    // Subscribe to the query
    this.updateQuery()
  }

  subscribe(listener?: UpdateListener<TResult, TError>): () => void {
    this.started = true
    this.updateListener = listener
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
    this.started = false
    this.updateListener = undefined
    this.clearTimers()
    this.currentQuery.unsubscribeObserver(this)
  }

  updateConfig(config: QueryObserverConfig<TResult, TError>): void {
    const prevConfig = this.config
    this.config = config

    const updated = this.updateQuery()

    // Take no further actions if the observer did not start yet
    if (!this.started) {
      return
    }

    // If we subscribed to a new query, optionally fetch and update refetch
    if (updated) {
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
      config.refetchInterval !== prevConfig.refetchInterval ||
      config.refetchIntervalInBackground !==
        prevConfig.refetchIntervalInBackground
    ) {
      this.updateRefetchInterval()
    }
  }

  isStale(): boolean {
    return this.currentResult.isStale
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

  private updateIsStale(): void {
    const isStale = this.currentQuery.isStaleByTime(this.config.staleTime)
    if (isStale !== this.currentResult.isStale) {
      this.updateResult()
      this.notify()
    }
  }

  private notify(): void {
    this.updateListener?.(this.currentResult)
  }

  private updateStaleTimeout(): void {
    if (isServer) {
      return
    }

    this.clearStaleTimeout()

    const staleTime = this.config.staleTime || 0
    const { isStale, updatedAt } = this.currentResult

    if (isStale || staleTime === Infinity) {
      return
    }

    const timeElapsed = Date.now() - updatedAt
    const timeUntilStale = staleTime - timeElapsed
    const timeout = Math.max(timeUntilStale, 0)

    this.staleTimeoutId = setTimeout(() => {
      this.updateIsStale()
    }, timeout)
  }

  private updateRefetchInterval(): void {
    if (isServer) {
      return
    }

    this.clearRefetchInterval()

    if (
      !this.config.enabled ||
      !this.config.refetchInterval ||
      this.config.refetchInterval < 0 ||
      this.config.refetchInterval === Infinity
    ) {
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

    let isStale = false

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

  private updateQuery(): boolean {
    const prevQuery = this.currentQuery

    // Remove the initial data when there is an existing query
    // because this data should not be used for a new query
    const config =
      this.config.keepPreviousData && prevQuery
        ? { ...this.config, initialData: undefined }
        : this.config

    const newQuery = this.queryCache.buildQuery(config.queryKey, config)

    if (newQuery === prevQuery) {
      return false
    }

    this.previousQueryResult = this.currentResult
    this.currentQuery = newQuery
    this.initialFetchedCount = newQuery.state.fetchedCount
    this.updateResult()

    if (this.started) {
      prevQuery?.unsubscribeObserver(this)
      this.currentQuery.subscribeObserver(this)
    }

    return true
  }

  onQueryUpdate(action: Action<TResult, TError>): void {
    // Store current result and get new result
    const prevResult = this.currentResult
    this.updateResult()

    const { currentResult, config } = this

    // We need to check the action because the state could have
    // transitioned from success to success in case of `setQueryData`.
    if (action.type === 'Success' && currentResult.isSuccess) {
      config.onSuccess?.(currentResult.data!)
      config.onSettled?.(currentResult.data!, null)
      this.updateTimers()
    } else if (action.type === 'Error' && currentResult.isError) {
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
