import { getStatusProps, isServer, isDocumentVisible } from './utils'
import type { QueryResult, QueryObserverConfig } from './types'
import type {
  Query,
  QueryState,
  Action,
  FetchMoreOptions,
  RefetchOptions,
} from './query'

export type UpdateListener<TResult, TError> = (
  result: QueryResult<TResult, TError>
) => void

export class QueryObserver<TResult, TError> {
  config: QueryObserverConfig<TResult, TError>

  private currentQuery!: Query<TResult, TError>
  private currentResult!: QueryResult<TResult, TError>
  private previousResult?: QueryResult<TResult, TError>
  private updateListener?: UpdateListener<TResult, TError>
  private staleTimeoutId?: number
  private refetchIntervalId?: number
  private started?: boolean

  constructor(config: QueryObserverConfig<TResult, TError>) {
    this.config = config

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
    this.optionalFetch()
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

  getCurrentResult(): QueryResult<TResult, TError> {
    return this.currentResult
  }

  clear(): void {
    return this.currentQuery.clear()
  }

  async refetch(options?: RefetchOptions): Promise<TResult | undefined> {
    this.currentQuery.updateConfig(this.config)
    return this.currentQuery.refetch(options)
  }

  async fetchMore(
    fetchMoreVariable?: unknown,
    options?: FetchMoreOptions
  ): Promise<TResult | undefined> {
    this.currentQuery.updateConfig(this.config)
    return this.currentQuery.fetchMore(fetchMoreVariable, options)
  }

  async fetch(): Promise<TResult | undefined> {
    this.currentQuery.updateConfig(this.config)
    try {
      return await this.currentQuery.fetch()
    } catch (error) {
      return undefined
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
      this.currentResult = this.createResult()
      this.updateListener?.(this.currentResult)
    }
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

  private createResult(): QueryResult<TResult, TError> {
    const { currentResult, currentQuery, previousResult, config } = this

    const {
      canFetchMore,
      error,
      failureCount,
      isFetched,
      isFetching,
      isFetchingMore,
      isLoading,
    } = currentQuery.state

    let { data, status, updatedAt } = currentQuery.state

    // Keep previous data if needed
    if (config.keepPreviousData && isLoading && previousResult?.isSuccess) {
      data = previousResult.data
      updatedAt = previousResult.updatedAt
      status = previousResult.status
    }

    let isStale = false

    // When the query has not been fetched yet and this is the initial render,
    // determine the staleness based on the initialStale or existence of initial data.
    if (!currentResult && !currentQuery.state.isFetched) {
      if (typeof config.initialStale === 'function') {
        isStale = config.initialStale()
      } else if (typeof config.initialStale === 'boolean') {
        isStale = config.initialStale
      } else {
        isStale = typeof currentQuery.state.data === 'undefined'
      }
    } else {
      isStale = currentQuery.isStaleByTime(config.staleTime)
    }

    return {
      ...getStatusProps(status),
      canFetchMore,
      clear: this.clear,
      data,
      error,
      failureCount,
      fetchMore: this.fetchMore,
      isFetched,
      isFetching,
      isFetchingMore,
      isStale,
      query: currentQuery,
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

    const newQuery = config.queryCache!.buildQuery(config.queryKey, config)

    if (newQuery === prevQuery) {
      return false
    }

    this.previousResult = this.currentResult
    this.currentQuery = newQuery
    this.currentResult = this.createResult()

    if (this.started) {
      prevQuery?.unsubscribeObserver(this)
      this.currentQuery.subscribeObserver(this)
    }

    return true
  }

  onQueryUpdate(
    _state: QueryState<TResult, TError>,
    action: Action<TResult, TError>
  ): void {
    this.currentResult = this.createResult()

    const { data, error, isSuccess, isError } = this.currentResult

    if (action.type === 'Success' && isSuccess) {
      this.config.onSuccess?.(data!)
      this.config.onSettled?.(data!, null)
      this.updateTimers()
    } else if (action.type === 'Error' && isError) {
      this.config.onError?.(error!)
      this.config.onSettled?.(undefined, error!)
      this.updateTimers()
    }

    this.updateListener?.(this.currentResult)
  }
}
