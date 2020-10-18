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
  QueryObserverOptions,
  QueryObserverResult,
  QueryOptions,
  RefetchOptions,
  ResultOptions,
} from './types'
import type { Query, QueryState, Action, FetchOptions } from './query'
import type { Environment } from './environment'
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

  private environment: Environment
  private currentQuery!: Query<TQueryData, TError, TQueryFnData>
  private currentResult!: QueryObserverResult<TData, TError>
  private currentResultState?: QueryState<TQueryData, TError>
  private previousQueryResult?: QueryObserverResult<TData, TError>
  private initialDataUpdateCount: number
  private staleTimeoutId?: number
  private refetchIntervalId?: number

  constructor(
    environment: Environment,
    options: QueryObserverOptions<TData, TError, TQueryFnData, TQueryData>
  ) {
    super()
    this.environment = environment
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
      (!this.currentQuery.state.updatedAt ||
        this.options.refetchOnMount === 'always' ||
        (this.options.refetchOnMount !== false && this.isStale()))
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

    this.options = this.environment.defaultQueryObserverOptions(options)

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

  protected fetch(
    fetchOptions?: ObserverFetchOptions
  ): Promise<QueryObserverResult<TData, TError>> {
    const promise = this.getNextResult(fetchOptions)
    this.executeFetch(fetchOptions)
    return promise
  }

  private optionalFetch(): void {
    if (this.willFetchOptionally()) {
      this.executeFetch()
    }
  }

  private executeFetch(fetchOptions?: ObserverFetchOptions): void {
    // Make sure we reference the latest query as the current one might have been removed
    this.updateQuery()

    // Fetch
    this.currentQuery
      .fetch(
        this.options as QueryOptions<TQueryData, TError, TQueryFnData>,
        fetchOptions
      )
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
      if (
        this.options.refetchIntervalInBackground ||
        focusManager.isFocused()
      ) {
        this.executeFetch()
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
    let { status, isFetching, updatedAt } = state
    let isPreviousData = false
    let data: TData | undefined

    // Optimistically set status to loading if we will start fetching
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

    return {
      ...getStatusProps(status),
      data,
      error: state.error,
      failureCount: state.failureCount,
      isFetched: state.dataUpdateCount > 0,
      isFetchedAfterMount: state.dataUpdateCount > this.initialDataUpdateCount,
      isFetching,
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

    const query = this.environment
      .getQueryCache()
      .build(
        this.environment,
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

    if (!this.listeners.length) {
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
    const { currentResult, currentQuery, listeners } = this
    const { onSuccess, onSettled, onError } = this.options

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
        this.environment.getQueryCache().notify(currentQuery)
      }
    })
  }
}
