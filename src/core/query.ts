import {
  CancelledError,
  Console,
  Updater,
  functionalUpdate,
  getStatusProps,
  isCancelable,
  isCancelledError,
  isDocumentVisible,
  isOnline,
  isServer,
  replaceEqualDeep,
  sleep,
} from './utils'
import {
  ArrayQueryKey,
  InitialDataFunction,
  IsFetchingMoreValue,
  QueryConfig,
  QueryFunction,
  QueryStatus,
} from './types'
import type { QueryCache } from './queryCache'
import { QueryObserver, UpdateListener } from './queryObserver'

// TYPES

interface QueryInitConfig<TResult, TError> {
  queryCache: QueryCache
  queryKey: ArrayQueryKey
  queryHash: string
  config: QueryConfig<TResult, TError>
  notifyGlobalListeners: (query: Query<TResult, TError>) => void
}

export interface QueryState<TResult, TError> {
  canFetchMore?: boolean
  data?: TResult
  error: TError | null
  failureCount: number
  isError: boolean
  isFetched: boolean
  isFetching: boolean
  isFetchingMore: IsFetchingMoreValue
  isIdle: boolean
  isLoading: boolean
  isSuccess: boolean
  status: QueryStatus
  throwInErrorBoundary?: boolean
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

export enum ActionType {
  Failed = 'Failed',
  Fetch = 'Fetch',
  Success = 'Success',
  Error = 'Error',
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
}

interface ErrorAction<TError> {
  type: ActionType.Error
  error: TError
}

export type Action<TResult, TError> =
  | ErrorAction<TError>
  | FailedAction
  | FetchAction
  | SuccessAction<TResult>

// CLASS

export class Query<TResult, TError> {
  queryKey: ArrayQueryKey
  queryHash: string
  config: QueryConfig<TResult, TError>
  observers: QueryObserver<TResult, TError>[]
  state: QueryState<TResult, TError>
  cacheTime: number

  private queryCache: QueryCache
  private promise?: Promise<TResult | undefined>
  private gcTimeout?: number
  private cancelFetch?: () => void
  private continueFetch?: () => void
  private isTransportCancelable?: boolean
  private notifyGlobalListeners: (query: Query<TResult, TError>) => void

  constructor(init: QueryInitConfig<TResult, TError>) {
    this.config = init.config
    this.queryCache = init.queryCache
    this.queryKey = init.queryKey
    this.queryHash = init.queryHash
    this.notifyGlobalListeners = init.notifyGlobalListeners
    this.observers = []
    this.state = getDefaultState(init.config)
    this.cacheTime = init.config.cacheTime!
    this.scheduleGc()
  }

  private updateConfig(config: QueryConfig<TResult, TError>): void {
    this.config = config
    this.cacheTime = Math.max(this.cacheTime, config.cacheTime || 0)
  }

  private dispatch(action: Action<TResult, TError>): void {
    this.state = queryReducer(this.state, action)
    this.observers.forEach(d => d.onQueryUpdate(this.state, action))
    this.notifyGlobalListeners(this)
  }

  private scheduleGc(): void {
    if (isServer) {
      return
    }

    this.clearGcTimeout()

    if (this.cacheTime === Infinity || this.observers.length > 0) {
      return
    }

    this.gcTimeout = setTimeout(() => {
      this.clear()
    }, this.cacheTime)
  }

  async refetch(
    options?: RefetchOptions,
    config?: QueryConfig<TResult, TError>
  ): Promise<TResult | undefined> {
    try {
      return await this.fetch(undefined, config)
    } catch (error) {
      if (options?.throwOnError === true) {
        throw error
      }
      return undefined
    }
  }

  cancel(): void {
    this.cancelFetch?.()
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

  setData(updater: Updater<TResult | undefined, TResult>): void {
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
    })
  }

  clear(): void {
    this.queryCache.removeQuery(this)
  }

  destroy(): void {
    this.clearGcTimeout()
    this.clearTimersObservers()
    this.cancel()
  }

  isEnabled(): boolean {
    return this.observers.some(observer => observer.config.enabled)
  }

  isStale(): boolean {
    return this.observers.some(observer => observer.isStale())
  }

  isStaleByTime(staleTime = 0): boolean {
    return (
      !this.state.isSuccess || this.state.updatedAt + staleTime <= Date.now()
    )
  }

  onWindowFocus(): void {
    if (
      this.observers.some(
        observer =>
          observer.isStale() &&
          observer.config.enabled &&
          observer.config.refetchOnWindowFocus
      )
    ) {
      this.fetch()
    }
    this.continue()
  }

  onOnline(): void {
    if (
      this.observers.some(
        observer =>
          observer.isStale() &&
          observer.config.enabled &&
          observer.config.refetchOnReconnect
      )
    ) {
      this.fetch()
    }
    this.continue()
  }

  subscribe(
    listener?: UpdateListener<TResult, TError>
  ): QueryObserver<TResult, TError> {
    const observer = new QueryObserver<TResult, TError>({
      queryCache: this.queryCache,
      queryKey: this.queryKey,
      ...this.config,
    })

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
    }

    this.scheduleGc()
  }

  async fetch(
    options?: FetchOptions,
    config?: QueryConfig<TResult, TError>
  ): Promise<TResult | undefined> {
    // If we are already fetching, return current promise
    if (this.promise) {
      return this.promise
    }

    // Update config if passed, otherwise the config from the last execution is used
    if (config) {
      this.updateConfig(config)
    }

    config = this.config

    // Check if there is a query function
    if (!config.queryFn) {
      return
    }

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
        // Set error state
        this.dispatch({
          type: ActionType.Error,
          error,
        })

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

  private async startFetch(
    config: QueryConfig<TResult, TError>,
    params: unknown[],
    _options?: FetchOptions
  ): Promise<TResult> {
    // Create function to fetch the data
    const fetchData = () => config.queryFn!(...params)

    // Set to fetching state if not already in it
    if (!this.state.isFetching) {
      this.dispatch({ type: ActionType.Fetch })
    }

    // Try to fetch the data
    return this.tryFetchData(config, fetchData)
  }

  private async startInfiniteFetch(
    config: QueryConfig<TResult, TError>,
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

      const page = await config.queryFn!(...params, cursor)

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
    if (!this.state.isFetching) {
      this.dispatch({ type: ActionType.Fetch, isFetchingMore })
    }

    // Try to get the data
    return this.tryFetchData(config, fetchData)
  }

  private async tryFetchData<T>(
    config: QueryConfig<TResult, TError>,
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
      this.cancelFetch = () => {
        reject(new CancelledError())
        try {
          cancelTransport?.()
        } catch {}
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
              promiseOrValue.cancel()
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

  fetchMore(
    fetchMoreVariable?: unknown,
    options?: FetchMoreOptions,
    config?: QueryConfig<TResult, TError>
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
}

function getLastPage<TResult>(pages: TResult[], previous?: boolean): TResult {
  return previous ? pages[0] : pages[pages.length - 1]
}

function hasMorePages<TResult, TError>(
  config: QueryConfig<TResult, TError>,
  pages: unknown,
  previous?: boolean
): boolean | undefined {
  if (config.infinite && config.getFetchMore && Array.isArray(pages)) {
    return Boolean(config.getFetchMore(getLastPage(pages, previous), pages))
  }
  return undefined
}

function getDefaultState<TResult, TError>(
  config: QueryConfig<TResult, TError>
): QueryState<TResult, TError> {
  const initialData =
    typeof config.initialData === 'function'
      ? (config.initialData as InitialDataFunction<TResult>)()
      : config.initialData

  const hasInitialData = typeof initialData !== 'undefined'

  const initialStatus = hasInitialData
    ? QueryStatus.Success
    : config.enabled
    ? QueryStatus.Loading
    : QueryStatus.Idle

  return {
    ...getStatusProps(initialStatus),
    error: null,
    isFetched: false,
    isFetching: initialStatus === QueryStatus.Loading,
    isFetchingMore: false,
    failureCount: 0,
    data: initialData,
    updatedAt: Date.now(),
    canFetchMore: hasMorePages(config, initialData),
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
      const status =
        typeof state.data !== 'undefined'
          ? QueryStatus.Success
          : QueryStatus.Loading
      return {
        ...state,
        ...getStatusProps(status),
        isFetching: true,
        isFetchingMore: action.isFetchingMore || false,
        failureCount: 0,
      }
    case ActionType.Success:
      return {
        ...state,
        ...getStatusProps(QueryStatus.Success),
        data: action.data,
        error: null,
        isFetched: true,
        isFetching: false,
        isFetchingMore: false,
        canFetchMore: action.canFetchMore,
        updatedAt: Date.now(),
        failureCount: 0,
      }
    case ActionType.Error:
      return {
        ...state,
        ...getStatusProps(QueryStatus.Error),
        error: action.error,
        isFetched: true,
        isFetching: false,
        isFetchingMore: false,
        failureCount: state.failureCount + 1,
        throwInErrorBoundary: true,
      }
    default:
      return state
  }
}
