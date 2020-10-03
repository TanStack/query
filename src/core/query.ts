import {
  CancelledError,
  Console,
  Updater,
  functionalUpdate,
  isCancelable,
  isCancelledError,
  isDocumentVisible,
  isOnline,
  isServer,
  isValidTimeout,
  noop,
  replaceEqualDeep,
  sleep,
} from './utils'
import {
  ArrayQueryKey,
  InitialDataFunction,
  IsFetchingMoreValue,
  QueryFunction,
  QueryStatus,
  ResolvedQueryConfig,
} from './types'
import type { QueryCache } from './queryCache'
import { QueryObserver, UpdateListener } from './queryObserver'
import { notifyManager } from './notifyManager'

// TYPES

export interface QueryState<TResult, TError> {
  canFetchMore?: boolean
  data?: TResult
  error: TError | null
  failureCount: number
  isFetching: boolean
  isFetchingMore: IsFetchingMoreValue
  isInitialData: boolean
  isInvalidated: boolean
  status: QueryStatus
  throwInErrorBoundary?: boolean
  updateCount: number
  updatedAt: number
}

interface FetchOptions {
  fetchMore?: FetchMoreOptions
}

export interface FetchMoreOptions {
  fetchMoreVariable?: unknown
  previous: boolean
}

export interface RefetchOptions {
  throwOnError?: boolean
}

const enum ActionType {
  Failed,
  Fetch,
  Success,
  Error,
  Invalidate,
}

interface SetDataOptions {
  updatedAt?: number
}

interface FailedAction {
  type: ActionType.Failed
}

interface FetchAction {
  type: ActionType.Fetch
  isFetchingMore?: IsFetchingMoreValue
}

interface SuccessAction<TResult> {
  type: ActionType.Success
  data: TResult | undefined
  canFetchMore?: boolean
  updatedAt?: number
}

interface ErrorAction<TError> {
  type: ActionType.Error
  error: TError
}

interface InvalidateAction {
  type: ActionType.Invalidate
}

export type Action<TResult, TError> =
  | ErrorAction<TError>
  | FailedAction
  | FetchAction
  | InvalidateAction
  | SuccessAction<TResult>

// CLASS

export class Query<TResult, TError> {
  queryKey: ArrayQueryKey
  queryHash: string
  config: ResolvedQueryConfig<TResult, TError>
  observers: QueryObserver<TResult, TError>[]
  state: QueryState<TResult, TError>
  cacheTime: number

  private queryCache: QueryCache
  private promise?: Promise<TResult>
  private gcTimeout?: number
  private cancelFetch?: (silent?: boolean) => void
  private continueFetch?: () => void
  private isTransportCancelable?: boolean

  constructor(config: ResolvedQueryConfig<TResult, TError>) {
    this.config = config
    this.queryKey = config.queryKey
    this.queryHash = config.queryHash
    this.queryCache = config.queryCache
    this.cacheTime = config.cacheTime
    this.observers = []
    this.state = getDefaultState(config)
    this.scheduleGc()
  }

  private updateConfig(config: ResolvedQueryConfig<TResult, TError>): void {
    this.config = config
    this.cacheTime = Math.max(this.cacheTime, config.cacheTime)
  }

  private dispatch(action: Action<TResult, TError>): void {
    this.state = queryReducer(this.state, action)

    notifyManager.batch(() => {
      this.observers.forEach(observer => {
        observer.onQueryUpdate(action)
      })

      this.queryCache.notifyGlobalListeners(this)
    })
  }

  private scheduleGc(): void {
    if (isServer) {
      return
    }

    this.clearGcTimeout()

    if (this.observers.length > 0 || !isValidTimeout(this.cacheTime)) {
      return
    }

    this.gcTimeout = setTimeout(() => {
      this.remove()
    }, this.cacheTime)
  }

  cancel(silent?: boolean): Promise<undefined> {
    const promise = this.promise

    if (promise && this.cancelFetch) {
      this.cancelFetch(silent)
      return promise.then(noop).catch(noop)
    }

    return Promise.resolve(undefined)
  }

  private continue(): void {
    this.continueFetch?.()
  }

  private clearTimersObservers(): void {
    this.observers.forEach(observer => {
      observer.clearTimers()
    })
  }

  private clearGcTimeout() {
    if (this.gcTimeout) {
      clearTimeout(this.gcTimeout)
      this.gcTimeout = undefined
    }
  }

  setData(
    updater: Updater<TResult | undefined, TResult>,
    options?: SetDataOptions
  ): void {
    const prevData = this.state.data

    // Get the new data
    let data: TResult | undefined = functionalUpdate(updater, prevData)

    // Structurally share data between prev and new data if needed
    if (this.config.structuralSharing) {
      data = replaceEqualDeep(prevData, data)
    }

    // Use prev data if an isDataEqual function is defined and returns `true`
    if (this.config.isDataEqual?.(prevData, data)) {
      data = prevData
    }

    // Try to determine if more data can be fetched
    const canFetchMore = hasMorePages(this.config, data)

    // Set data and mark it as cached
    this.dispatch({
      type: ActionType.Success,
      data,
      canFetchMore,
      updatedAt: options?.updatedAt,
    })
  }

  /**
   * @deprecated
   */
  clear(): void {
    Console.warn(
      'react-query: clear() has been deprecated, please use remove() instead'
    )
    this.remove()
  }

  remove(): void {
    this.queryCache.removeQuery(this)
  }

  destroy(): void {
    this.clearGcTimeout()
    this.clearTimersObservers()
    this.cancel()
  }

  isActive(): boolean {
    return this.observers.some(observer => observer.config.enabled)
  }

  isStale(): boolean {
    return (
      this.state.isInvalidated ||
      this.state.status !== QueryStatus.Success ||
      this.observers.some(observer => observer.getCurrentResult().isStale)
    )
  }

  isStaleByTime(staleTime = 0): boolean {
    return (
      this.state.isInvalidated ||
      this.state.status !== QueryStatus.Success ||
      this.state.updatedAt + staleTime <= Date.now()
    )
  }

  onInteraction(type: 'focus' | 'online'): void {
    // Execute the first observer which is enabled,
    // stale and wants to refetch on this interaction.
    const staleObserver = this.observers.find(observer => {
      const { config } = observer
      const { isStale } = observer.getCurrentResult()
      return (
        config.enabled &&
        ((type === 'focus' &&
          (config.refetchOnWindowFocus === 'always' ||
            (config.refetchOnWindowFocus && isStale))) ||
          (type === 'online' &&
            (config.refetchOnReconnect === 'always' ||
              (config.refetchOnReconnect && isStale))))
      )
    })

    if (staleObserver) {
      staleObserver.fetch()
    }

    // Continue any paused fetch
    this.continue()
  }

  /**
   * @deprectated
   */
  subscribe(
    listener?: UpdateListener<TResult, TError>
  ): QueryObserver<TResult, TError> {
    const observer = new QueryObserver(this.config)
    observer.subscribe(listener)
    return observer
  }

  subscribeObserver(observer: QueryObserver<TResult, TError>): void {
    this.observers.push(observer)

    // Stop the query from being garbage collected
    this.clearGcTimeout()
  }

  unsubscribeObserver(observer: QueryObserver<TResult, TError>): void {
    this.observers = this.observers.filter(x => x !== observer)

    if (!this.observers.length) {
      // If the transport layer does not support cancellation
      // we'll let the query continue so the result can be cached
      if (this.isTransportCancelable) {
        this.cancel()
      }

      this.scheduleGc()
    }
  }

  invalidate(): void {
    if (!this.state.isInvalidated) {
      this.dispatch({ type: ActionType.Invalidate })
    }
  }

  /**
   * @deprectated
   */
  refetch(
    options?: RefetchOptions,
    config?: ResolvedQueryConfig<TResult, TError>
  ): Promise<TResult | undefined> {
    let promise: Promise<TResult | undefined> = this.fetch(undefined, config)

    if (!options?.throwOnError) {
      promise = promise.catch(noop)
    }

    return promise
  }

  /**
   * @deprectated
   */
  fetchMore(
    fetchMoreVariable?: unknown,
    options?: FetchMoreOptions,
    config?: ResolvedQueryConfig<TResult, TError>
  ): Promise<TResult | undefined> {
    return this.fetch(
      {
        fetchMore: {
          fetchMoreVariable,
          previous: options?.previous || false,
        },
      },
      config
    )
  }

  async fetch(
    options?: FetchOptions,
    config?: ResolvedQueryConfig<TResult, TError>
  ): Promise<TResult> {
    if (this.promise) {
      if (options?.fetchMore && this.state.data) {
        // Silently cancel current fetch if the user wants to fetch more
        await this.cancel(true)
      } else {
        // Return current promise if we are already fetching
        return this.promise
      }
    }

    // Update config if passed, otherwise the config from the last execution is used
    if (config) {
      this.updateConfig(config)
    }

    config = this.config

    // Get the query function params
    const filter = config.queryFnParamsFilter
    const params = filter ? filter(this.queryKey) : this.queryKey

    this.promise = (async () => {
      try {
        let data: any

        if (config.infinite) {
          data = await this.startInfiniteFetch(config, params, options)
        } else {
          data = await this.startFetch(config, params, options)
        }

        // Set success state
        this.setData(data)

        // Cleanup
        delete this.promise

        // Return data
        return data
      } catch (error) {
        // Set error state if needed
        if (!(isCancelledError(error) && error.silent)) {
          this.dispatch({
            type: ActionType.Error,
            error,
          })
        }

        // Log error
        if (!isCancelledError(error)) {
          Console.error(error)
        }

        // Cleanup
        delete this.promise

        // Propagate error
        throw error
      }
    })()

    return this.promise
  }

  private startFetch(
    config: ResolvedQueryConfig<TResult, TError>,
    params: unknown[],
    _options?: FetchOptions
  ): Promise<TResult> {
    // Create function to fetch the data
    const fetchData = () => config.queryFn(...params)

    // Set to fetching state if not already in it
    if (!this.state.isFetching) {
      this.dispatch({ type: ActionType.Fetch })
    }

    // Try to fetch the data
    return this.tryFetchData(config, fetchData)
  }

  private startInfiniteFetch(
    config: ResolvedQueryConfig<TResult, TError>,
    params: unknown[],
    options?: FetchOptions
  ): Promise<TResult[]> {
    const fetchMore = options?.fetchMore
    const { previous, fetchMoreVariable } = fetchMore || {}
    const isFetchingMore = fetchMore ? (previous ? 'previous' : 'next') : false
    const prevPages: TResult[] = (this.state.data as any) || []

    // Create function to fetch a page
    const fetchPage = async (
      pages: TResult[],
      prepend?: boolean,
      cursor?: unknown
    ) => {
      const lastPage = getLastPage(pages, prepend)

      if (
        typeof cursor === 'undefined' &&
        typeof lastPage !== 'undefined' &&
        config.getFetchMore
      ) {
        cursor = config.getFetchMore(lastPage, pages)
      }

      if (!Boolean(cursor) && typeof lastPage !== 'undefined') {
        return pages
      }

      const page = await config.queryFn(...params, cursor)

      return prepend ? [page, ...pages] : [...pages, page]
    }

    // Create function to fetch the data
    const fetchData = () => {
      if (isFetchingMore) {
        return fetchPage(prevPages, previous, fetchMoreVariable)
      } else if (!prevPages.length) {
        return fetchPage([])
      } else {
        let promise = fetchPage([])
        for (let i = 1; i < prevPages.length; i++) {
          promise = promise.then(fetchPage)
        }
        return promise
      }
    }

    // Set to fetching state if not already in it
    if (
      !this.state.isFetching ||
      this.state.isFetchingMore !== isFetchingMore
    ) {
      this.dispatch({ type: ActionType.Fetch, isFetchingMore })
    }

    // Try to get the data
    return this.tryFetchData(config, fetchData)
  }

  private tryFetchData<T>(
    config: ResolvedQueryConfig<TResult, TError>,
    fn: QueryFunction<T>
  ): Promise<T> {
    return new Promise<T>((outerResolve, outerReject) => {
      let resolved = false
      let continueLoop: () => void
      let cancelTransport: () => void

      const done = () => {
        resolved = true

        delete this.cancelFetch
        delete this.continueFetch
        delete this.isTransportCancelable

        // End loop if currently paused
        continueLoop?.()
      }

      const resolve = (value: any) => {
        done()
        outerResolve(value)
      }

      const reject = (value: any) => {
        done()
        outerReject(value)
      }

      // Create callback to cancel this fetch
      this.cancelFetch = silent => {
        reject(new CancelledError(silent))
        cancelTransport?.()
      }

      // Create callback to continue this fetch
      this.continueFetch = () => {
        continueLoop?.()
      }

      // Create loop function
      const run = async () => {
        try {
          // Execute query
          const promiseOrValue = fn()

          // Check if the transport layer support cancellation
          if (isCancelable(promiseOrValue)) {
            cancelTransport = () => {
              try {
                promiseOrValue.cancel()
              } catch {}
            }
            this.isTransportCancelable = true
          }

          // Await data
          resolve(await promiseOrValue)
        } catch (error) {
          // Stop if the fetch is already resolved
          if (resolved) {
            return
          }

          // Do we need to retry the request?
          const { failureCount } = this.state
          const { retry, retryDelay } = config

          const shouldRetry =
            retry === true ||
            failureCount < retry! ||
            (typeof retry === 'function' && retry(failureCount, error))

          if (!shouldRetry) {
            // We are done if the query does not need to be retried
            reject(error)
            return
          }

          // Increase the failureCount
          this.dispatch({ type: ActionType.Failed })

          // Delay
          await sleep(functionalUpdate(retryDelay, failureCount) || 0)

          // Pause retry if the document is not visible or when the device is offline
          if (!isDocumentVisible() || !isOnline()) {
            await new Promise(continueResolve => {
              continueLoop = continueResolve
            })
          }

          // Try again if not resolved yet
          if (!resolved) {
            run()
          }
        }
      }

      // Start loop
      run()
    })
  }
}

function getLastPage<TResult>(pages: TResult[], previous?: boolean): TResult {
  return previous ? pages[0] : pages[pages.length - 1]
}

function hasMorePages<TResult, TError>(
  config: ResolvedQueryConfig<TResult, TError>,
  pages: unknown,
  previous?: boolean
): boolean | undefined {
  if (config.infinite && config.getFetchMore && Array.isArray(pages)) {
    return Boolean(config.getFetchMore(getLastPage(pages, previous), pages))
  }
}

function getDefaultState<TResult, TError>(
  config: ResolvedQueryConfig<TResult, TError>
): QueryState<TResult, TError> {
  const data =
    typeof config.initialData === 'function'
      ? (config.initialData as InitialDataFunction<TResult>)()
      : config.initialData

  const status =
    typeof data !== 'undefined'
      ? QueryStatus.Success
      : config.enabled
      ? QueryStatus.Loading
      : QueryStatus.Idle

  return {
    canFetchMore: hasMorePages(config, data),
    data,
    error: null,
    failureCount: 0,
    isFetching: status === QueryStatus.Loading,
    isFetchingMore: false,
    isInitialData: true,
    isInvalidated: false,
    status,
    updateCount: 0,
    updatedAt: Date.now(),
  }
}

export function queryReducer<TResult, TError>(
  state: QueryState<TResult, TError>,
  action: Action<TResult, TError>
): QueryState<TResult, TError> {
  switch (action.type) {
    case ActionType.Failed:
      return {
        ...state,
        failureCount: state.failureCount + 1,
      }
    case ActionType.Fetch:
      return {
        ...state,
        failureCount: 0,
        isFetching: true,
        isFetchingMore: action.isFetchingMore || false,
        status:
          typeof state.data !== 'undefined'
            ? QueryStatus.Success
            : QueryStatus.Loading,
      }
    case ActionType.Success:
      return {
        ...state,
        canFetchMore: action.canFetchMore,
        data: action.data,
        error: null,
        failureCount: 0,
        isFetching: false,
        isFetchingMore: false,
        isInitialData: false,
        isInvalidated: false,
        status: QueryStatus.Success,
        updateCount: state.updateCount + 1,
        updatedAt: action.updatedAt ?? Date.now(),
      }
    case ActionType.Error:
      return {
        ...state,
        error: action.error,
        failureCount: state.failureCount + 1,
        isFetching: false,
        isFetchingMore: false,
        status: QueryStatus.Error,
        throwInErrorBoundary: true,
        updateCount: state.updateCount + 1,
      }
    case ActionType.Invalidate:
      return {
        ...state,
        isInvalidated: true,
      }
    default:
      return state
  }
}
