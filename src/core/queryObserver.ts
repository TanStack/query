import {
  getStatusProps,
  isDocumentVisible,
  isServer,
  isValidTimeout,
  noop,
  replaceEqualDeep,
  shallowEqualObjects,
  timeUntilStale,
} from './utils'
import { notifyManager } from './notifyManager'
import type {
  FetchNextPageOptions,
  FetchPreviousPageOptions,
  QueryObserverOptions,
  QueryObserverResult,
  QueryOptions,
  RefetchOptions,
  ResultOptions,
} from './types'
import type { Query, QueryState, Action, FetchOptions } from './query'
import type { QueryClient } from './queryClient'

interface QueryObserverConfig<
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
  listeners?: boolean
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
  private currentResultState?: QueryState<TQueryData, TError>
  private previousQueryResult?: QueryObserverResult<TData, TError>
  private listeners: QueryObserverListener<TData, TError>[]
  private initialDataUpdateCount: number
  private staleTimeoutId?: number
  private refetchIntervalId?: number

  constructor(
    config: QueryObserverConfig<TData, TError, TQueryFnData, TQueryData>
  ) {
    this.client = config.client
    this.options = config.client.defaultQueryObserverOptions(config.options)
    this.listeners = []
    this.initialDataUpdateCount = 0

    // Bind exposed methods
    this.remove = this.remove.bind(this)
    this.refetch = this.refetch.bind(this)
    this.fetchNextPage = this.fetchNextPage.bind(this)
    this.fetchPreviousPage = this.fetchPreviousPage.bind(this)

    // Subscribe to the query
    this.updateQuery()
  }

  subscribe(listener?: QueryObserverListener<TData, TError>): () => void {
    const callback = listener || (() => undefined)
    this.listeners.push(callback)
    if (this.listeners.length === 1) {
      this.onMount()
    }
    return () => {
      this.unsubscribe(callback)
    }
  }

  private unsubscribe(listener: QueryObserverListener<TData, TError>): void {
    this.listeners = this.listeners.filter(x => x !== listener)
    if (!this.listeners.length) {
      this.clear()
    }
  }

  private onMount(): void {
    this.currentQuery.subscribeObserver(this)

    if (this.willFetchOnMount()) {
      this.executeFetch()
    }

    this.updateTimers()
  }

  willFetchOnMount(): boolean {
    return (
      this.options.enabled !== false &&
      (!this.currentQuery.state.updatedAt ||
        this.options.refetchOnMount === 'always' ||
        (this.options.refetchOnMount !== false && this.isStale()))
    )
  }

  willFetchOptionally(): boolean {
    return this.options.enabled !== false && this.isStale()
  }

  private isStale(): boolean {
    return this.currentQuery.isStaleByTime(this.options.staleTime)
  }

  clear(): void {
    this.listeners = []
    this.clearTimers()
    this.currentQuery.unsubscribeObserver(this)
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

  getCurrentOrNextResult(
    options?: ResultOptions
  ): Promise<QueryObserverResult<TData, TError>> {
    if (this.currentQuery.isFetching()) {
      return this.getNextResult(options)
    } else if (this.currentResult.isError && options?.throwOnError) {
      return Promise.reject(this.currentResult.error)
    }
    return Promise.resolve(this.currentResult)
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
    this.currentQuery.remove()
  }

  refetch(
    options?: RefetchOptions
  ): Promise<QueryObserverResult<TData, TError>> {
    return this.fetch(options)
  }

  fetchNextPage(
    options?: FetchNextPageOptions
  ): Promise<QueryObserverResult<TData, TError>> {
    return this.fetch({
      throwOnError: options?.throwOnError,
      fetchMore: { direction: 'forward', pageParam: options?.pageParam },
    })
  }

  fetchPreviousPage(
    options?: FetchPreviousPageOptions
  ): Promise<QueryObserverResult<TData, TError>> {
    return this.fetch({
      throwOnError: options?.throwOnError,
      fetchMore: { direction: 'backward', pageParam: options?.pageParam },
    })
  }

  fetch(
    fetchOptions?: FetchOptions
  ): Promise<QueryObserverResult<TData, TError>> {
    if (!this.canFetch()) {
      return this.getCurrentOrNextResult()
    }
    const promise = this.getNextResult(fetchOptions)
    this.executeFetch(fetchOptions)
    return promise
  }

  private optionalFetch(): void {
    if (this.willFetchOptionally()) {
      this.executeFetch()
    }
  }

  private executeFetch(fetchOptions?: FetchOptions): void {
    if (this.canFetch()) {
      this.currentQuery.fetch(this.getQueryOptions(), fetchOptions).catch(noop)
    }
  }

  private canFetch(): boolean {
    return Boolean(
      this.options.queryFn || this.currentQuery.defaultOptions?.queryFn
    )
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
        this.notify({ listeners: true, cache: true })
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
      if (this.options.refetchIntervalInBackground || isDocumentVisible()) {
        this.executeFetch()
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

  private updateResult(willFetch?: boolean): void {
    const { state } = this.currentQuery
    let { status, isFetching, updatedAt } = state
    let isPreviousData = false
    let data: TData | undefined

    // Already set the status to loading if we are going to fetch
    if (willFetch) {
      isFetching = true
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
      status = this.previousQueryResult.status
      isPreviousData = true
    } else if (this.options.select && typeof state.data !== 'undefined') {
      // Use the previous select result if the query data did not change
      if (this.currentResult && state.data === this.currentResultState?.data) {
        data = this.currentResult.data
      } else {
        data = this.options.select(state.data)
        if (this.options.structuralSharing !== false) {
          data = replaceEqualDeep(this.currentResult?.data, data)
        }
      }
    } else {
      data = (state.data as unknown) as TData
    }

    const result: QueryObserverResult<TData, TError> = {
      ...getStatusProps(status),
      data,
      error: state.error,
      failureCount: state.failureCount,
      fetchNextPage: this.fetchNextPage,
      fetchPreviousPage: this.fetchPreviousPage,
      hasNextPage: state.hasNextPage,
      hasPreviousPage: state.hasPreviousPage,
      isFetched: state.dataUpdateCount > 0,
      isFetchedAfterMount: state.dataUpdateCount > this.initialDataUpdateCount,
      isFetching,
      isFetchingNextPage: state.isFetchingNextPage,
      isFetchingPreviousPage: state.isFetchingPreviousPage,
      isPreviousData,
      isStale: this.isStale(),
      refetch: this.refetch,
      remove: this.remove,
      updatedAt,
    }

    // Keep reference to the current state on which the current result is based on
    this.currentResultState = state

    // Only update if something has changed
    if (
      !this.currentResult ||
      !shallowEqualObjects(this.currentResult, result)
    ) {
      this.currentResult = result
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

    const willFetch = prevQuery
      ? this.willFetchOptionally()
      : this.willFetchOnMount()

    this.updateResult(willFetch)

    if (!this.listeners.length) {
      return
    }

    prevQuery?.unsubscribeObserver(this)
    this.currentQuery.subscribeObserver(this)

    if (this.options.notifyOnStatusChange !== false) {
      this.notify({ listeners: true })
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

    // Do not notify if the nothing has changed
    if (prevResult === currentResult) {
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
      options.notifyOnStatusChange !== false ||
      // Otherwise only notify on data or error change
      currentResult.data !== prevResult.data ||
      currentResult.error !== prevResult.error
    ) {
      notifyOptions.listeners = true
    }

    this.notify(notifyOptions)
  }

  private notify(notifyOptions: NotifyOptions): void {
    const { options, currentResult, currentQuery, listeners } = this
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

      // Then trigger the listeners
      if (notifyOptions.listeners) {
        listeners.forEach(listener => {
          notifyManager.schedule(() => {
            listener(currentResult)
          })
        })
      }

      // Then the cache listeners
      if (notifyOptions.cache) {
        this.client.getCache().notify(currentQuery)
      }
    })
  }
}
