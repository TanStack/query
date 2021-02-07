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
  QueryObserverBaseResult,
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
import { getLogger } from './logger'

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
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData
> extends Subscribable<QueryObserverListener<TData, TError>> {
  options: QueryObserverOptions<TQueryFnData, TError, TData, TQueryData>

  private client: QueryClient
  private currentQuery!: Query<TQueryFnData, TError, TQueryData>
  private currentResult!: QueryObserverResult<TData, TError>
  private currentResultState?: QueryState<TQueryData, TError>
  private previousOptions?: QueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData
  >
  private previousQueryResult?: QueryObserverResult<TData, TError>
  private initialDataUpdateCount: number
  private initialErrorUpdateCount: number
  private staleTimeoutId?: number
  private refetchIntervalId?: number
  private trackedProps!: Array<keyof QueryObserverResult>
  private trackedCurrentResult!: QueryObserverResult<TData, TError>

  constructor(
    client: QueryClient,
    options: QueryObserverOptions<TQueryFnData, TError, TData, TQueryData>
  ) {
    super()

    this.client = client
    this.options = options
    this.initialDataUpdateCount = 0
    this.initialErrorUpdateCount = 0
    this.trackedProps = []
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

      this.updateResult()
      this.updateTimers()
    }
  }

  protected onUnsubscribe(): void {
    if (!this.listeners.length) {
      this.destroy()
    }
  }

  willLoadOnMount(): boolean {
    return (
      this.options.enabled !== false &&
      !this.currentQuery.state.dataUpdatedAt &&
      !(
        this.currentQuery.state.status === 'error' &&
        this.options.retryOnMount === false
      )
    )
  }

  willRefetchOnMount(): boolean {
    return (
      this.options.enabled !== false &&
      this.currentQuery.state.dataUpdatedAt > 0 &&
      (this.options.refetchOnMount === 'always' ||
        (this.options.refetchOnMount !== false && this.isStale()))
    )
  }

  willFetchOnMount(): boolean {
    return this.willLoadOnMount() || this.willRefetchOnMount()
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
    options?: QueryObserverOptions<TQueryFnData, TError, TData, TQueryData>
  ): void {
    this.previousOptions = this.options
    this.options = this.client.defaultQueryObserverOptions(options)

    if (
      typeof this.options.enabled !== 'undefined' &&
      typeof this.options.enabled !== 'boolean'
    ) {
      throw new Error('Expected enabled to be a boolean')
    }

    // Keep previous query key if the user does not supply one
    if (!this.options.queryKey) {
      this.options.queryKey = this.previousOptions.queryKey
    }

    const didUpdateQuery = this.updateQuery()

    let optionalFetch
    let updateResult
    let updateStaleTimeout
    let updateRefetchInterval

    // If we subscribed to a new query, optionally fetch and update result and timers
    if (didUpdateQuery) {
      optionalFetch = true
      updateResult = true
      updateStaleTimeout = true
      updateRefetchInterval = true
    }

    // Optionally fetch if the query became enabled
    if (
      this.options.enabled !== false &&
      this.previousOptions.enabled === false
    ) {
      optionalFetch = true
    }

    // Update result if the select function changed
    if (this.options.select !== this.previousOptions.select) {
      updateResult = true
    }

    // Update stale interval if needed
    if (
      this.options.enabled !== this.previousOptions.enabled ||
      this.options.staleTime !== this.previousOptions.staleTime
    ) {
      updateStaleTimeout = true
    }

    // Update refetch interval if needed
    if (
      this.options.enabled !== this.previousOptions.enabled ||
      this.options.refetchInterval !== this.previousOptions.refetchInterval
    ) {
      updateRefetchInterval = true
    }

    // Fetch only if there are subscribers
    if (this.hasListeners()) {
      if (optionalFetch) {
        this.optionalFetch()
      }
    }

    if (updateResult) {
      this.updateResult()
    }

    // Update intervals only if there are subscribers
    if (this.hasListeners()) {
      if (updateStaleTimeout) {
        this.updateStaleTimeout()
      }
      if (updateRefetchInterval) {
        this.updateRefetchInterval()
      }
    }

    // Reset previous options after all code related to option changes has run
    this.previousOptions = this.options
  }

  getCurrentResult(): QueryObserverResult<TData, TError> {
    return this.currentResult
  }

  getTrackedCurrentResult(): QueryObserverResult<TData, TError> {
    return this.trackedCurrentResult
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

  getCurrentQuery(): Query<TQueryFnData, TError, TQueryData> {
    return this.currentQuery
  }

  remove(): void {
    this.client.getQueryCache().remove(this.currentQuery)
  }

  refetch(
    options?: RefetchOptions
  ): Promise<QueryObserverResult<TData, TError>> {
    return this.fetch(options)
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
    let promise: Promise<TQueryData | undefined> = this.currentQuery.fetch(
      this.options as QueryOptions<TQueryFnData, TError, TQueryData>,
      fetchOptions
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
      this.options.staleTime
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
    clearTimeout(this.staleTimeoutId)
    this.staleTimeoutId = undefined
  }

  private clearRefetchInterval(): void {
    clearInterval(this.refetchIntervalId)
    this.refetchIntervalId = undefined
  }

  protected getNewResult(): QueryObserverResult<TData, TError> {
    const { state } = this.currentQuery
    let { isFetching, status } = state
    let isPreviousData = false
    let isPlaceholderData = false
    let data: TData | undefined
    let dataUpdatedAt = state.dataUpdatedAt
    let error = state.error
    let errorUpdatedAt = state.errorUpdatedAt

    // Optimistically set status to loading if we will start fetching
    if (!this.hasListeners() && this.willFetchOnMount()) {
      isFetching = true
      if (!dataUpdatedAt) {
        status = 'loading'
      }
    }

    // Keep previous data if needed
    if (
      this.options.keepPreviousData &&
      !state.dataUpdateCount &&
      this.previousQueryResult?.isSuccess &&
      status !== 'error'
    ) {
      data = this.previousQueryResult.data
      dataUpdatedAt = this.previousQueryResult.dataUpdatedAt
      status = this.previousQueryResult.status
      isPreviousData = true
    }
    // Select data if needed
    else if (this.options.select && typeof state.data !== 'undefined') {
      // Use the previous select result if the query data and select function did not change
      if (
        this.currentResult &&
        state.data === this.currentResultState?.data &&
        this.options.select === this.previousOptions?.select
      ) {
        data = this.currentResult.data
      } else {
        try {
          data = this.options.select(state.data)
          if (this.options.structuralSharing !== false) {
            data = replaceEqualDeep(this.currentResult?.data, data)
          }
        } catch (selectError) {
          getLogger().error(selectError)
          error = selectError
          errorUpdatedAt = Date.now()
          status = 'error'
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

    const result: QueryObserverBaseResult<TData, TError> = {
      ...getStatusProps(status),
      data,
      dataUpdatedAt,
      error,
      errorUpdatedAt,
      failureCount: state.fetchFailureCount,
      isFetched: state.dataUpdateCount > 0 || state.errorUpdateCount > 0,
      isFetchedAfterMount:
        state.dataUpdateCount > this.initialDataUpdateCount ||
        state.errorUpdateCount > this.initialErrorUpdateCount,
      isFetching,
      isLoadingError: status === 'error' && state.dataUpdatedAt === 0,
      isPlaceholderData,
      isPreviousData,
      isRefetchError: status === 'error' && state.dataUpdatedAt !== 0,
      isStale: this.isStale(),
      refetch: this.refetch,
      remove: this.remove,
    }

    return result as QueryObserverResult<TData, TError>
  }

  private shouldNotifyListeners(
    prevResult: QueryObserverResult | undefined,
    result: QueryObserverResult
  ): boolean {
    const { notifyOnChangeProps, notifyOnChangePropsExclusions } = this.options

    if (prevResult === result) {
      return false
    }

    if (!prevResult) {
      return true
    }

    if (!notifyOnChangeProps && !notifyOnChangePropsExclusions) {
      return true
    }

    const keys = Object.keys(result)
    const includedProps =
      notifyOnChangeProps === 'tracked'
        ? this.trackedProps
        : notifyOnChangeProps

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i] as keyof QueryObserverResult
      const changed = prevResult[key] !== result[key]
      const isIncluded = includedProps?.some(x => x === key)
      const isExcluded = notifyOnChangePropsExclusions?.some(x => x === key)

      if (changed) {
        if (notifyOnChangePropsExclusions && isExcluded) {
          continue
        }

        if (
          !notifyOnChangeProps ||
          isIncluded ||
          (notifyOnChangeProps === 'tracked' && this.trackedProps.length === 0)
        ) {
          return true
        }
      }
    }

    return false
  }

  private updateResult(action?: Action<TData, TError>): void {
    const prevResult = this.currentResult as
      | QueryObserverResult<TData, TError>
      | undefined

    const result = this.getNewResult()

    // Keep reference to the current state on which the current result is based on
    this.currentResultState = this.currentQuery.state

    // Only update if something has changed
    if (shallowEqualObjects(result, prevResult)) {
      return
    }

    this.currentResult = result

    if (this.options.notifyOnChangeProps === 'tracked') {
      const addTrackedProps = (prop: keyof QueryObserverResult) => {
        if (!this.trackedProps.includes(prop)) {
          this.trackedProps.push(prop)
        }
      }
      this.trackedCurrentResult = {} as QueryObserverResult<TData, TError>

      Object.keys(result).forEach(key => {
        Object.defineProperty(this.trackedCurrentResult, key, {
          configurable: false,
          enumerable: true,
          get() {
            addTrackedProps(key as keyof QueryObserverResult)
            return result[key as keyof QueryObserverResult]
          },
        })
      })
    }

    // Determine which callbacks to trigger
    const notifyOptions: NotifyOptions = { cache: true }

    if (action?.type === 'success') {
      notifyOptions.onSuccess = true
    } else if (action?.type === 'error') {
      notifyOptions.onError = true
    }

    if (this.shouldNotifyListeners(prevResult, result)) {
      notifyOptions.listeners = true
    }

    this.notify(notifyOptions)
  }

  private updateQuery(): boolean {
    const prevQuery = this.currentQuery

    const query = this.client
      .getQueryCache()
      .build(
        this.client,
        this.options as QueryOptions<TQueryFnData, TError, TQueryData>
      )

    if (query === prevQuery) {
      return false
    }

    this.previousQueryResult = this.currentResult
    this.currentQuery = query
    this.initialDataUpdateCount = query.state.dataUpdateCount
    this.initialErrorUpdateCount = query.state.errorUpdateCount

    if (this.hasListeners()) {
      prevQuery?.removeObserver(this)
      this.currentQuery.addObserver(this)
    }

    return true
  }

  onQueryUpdate(action: Action<TData, TError>): void {
    this.updateResult(action)
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
