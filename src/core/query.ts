import {
  CancelledError,
  Updater,
  defaultRetryDelay,
  ensureArray,
  functionalUpdate,
  hashQueryKey,
  isCancelable,
  isCancelledError,
  isDocumentVisible,
  isOnline,
  isServer,
  isValidTimeout,
  noop,
  replaceEqualDeep,
  sleep,
  timeUntilStale,
} from './utils'
import type {
  FetchMoreOptions,
  InitialDataFunction,
  IsFetchingMoreValue,
  QueryFunction,
  QueryKey,
  QueryOptions,
  QueryStatus,
} from './types'
import type { QueryCache } from './queryCache'
import type { QueryObserver } from './queryObserver'
import { notifyManager } from './notifyManager'
import { getConsole } from './setConsole'

// TYPES

export interface QueryConfig<TData, TError, TQueryFnData> {
  cache: QueryCache
  queryKey: QueryKey
  queryHash?: string
  options?: QueryOptions<TData, TError, TQueryFnData>
}

export interface QueryState<TData, TError> {
  canFetchMore?: boolean
  data?: TData
  dataUpdateCount: number
  error: TError | null
  errorUpdateCount: number
  failureCount: number
  isFetching: boolean
  isFetchingMore: IsFetchingMoreValue
  isInvalidated: boolean
  status: QueryStatus
  updatedAt: number
}

export interface FetchOptions {
  fetchMore?: FetchMoreOptions
  throwOnError?: boolean
}

interface SetDataOptions {
  updatedAt?: number
}

interface FailedAction {
  type: 'failed'
}

interface FetchAction {
  type: 'fetch'
  isFetchingMore?: IsFetchingMoreValue
}

interface SuccessAction<TData> {
  type: 'success'
  data: TData | undefined
  canFetchMore?: boolean
  updatedAt?: number
}

interface ErrorAction<TError> {
  type: 'error'
  error: TError
}

interface InvalidateAction {
  type: 'invalidate'
}

export type Action<TData, TError> =
  | ErrorAction<TError>
  | FailedAction
  | FetchAction
  | InvalidateAction
  | SuccessAction<TData>

// CLASS

export class Query<TData = unknown, TError = unknown, TQueryFnData = TData> {
  queryKey: QueryKey
  queryHash: string
  options!: QueryOptions<TData, TError, TQueryFnData>
  defaultOptions?: QueryOptions<TData, TError, TQueryFnData>
  observers: QueryObserver<any, any, any, any>[]
  state: QueryState<TData, TError>
  cacheTime!: number

  private cache: QueryCache
  private promise?: Promise<TData>
  private gcTimeout?: number
  private cancelFetch?: (silent?: boolean) => void
  private continueFetch?: () => void
  private isTransportCancelable?: boolean

  constructor(config: QueryConfig<TData, TError, TQueryFnData>) {
    this.setOptions(config.options)
    this.observers = []
    this.cache = config.cache
    this.queryKey = config.queryKey
    this.queryHash =
      config.queryHash ?? hashQueryKey(config.queryKey, this.options)
    this.state = getDefaultState(this.options)
    this.scheduleGc()
  }

  private setOptions(
    options?: QueryOptions<TData, TError, TQueryFnData>
  ): void {
    this.options = { ...this.defaultOptions, ...options }

    // Default to 5 minutes if not cache time is set
    this.cacheTime = Math.max(
      this.cacheTime || 0,
      this.options.cacheTime ?? 5 * 60 * 1000
    )
  }

  setDefaultOptions(options: QueryOptions<TData, TError, TQueryFnData>): void {
    this.defaultOptions = options
  }

  private dispatch(action: Action<TData, TError>): void {
    this.state = queryReducer(this.state, action)

    notifyManager.batch(() => {
      this.observers.forEach(observer => {
        observer.onQueryUpdate(action)
      })

      this.cache.notify(this)
    })
  }

  private scheduleGc(): void {
    this.clearGcTimeout()

    if (
      isServer ||
      this.observers.length > 0 ||
      !isValidTimeout(this.cacheTime)
    ) {
      return
    }

    this.gcTimeout = setTimeout(() => {
      this.remove()
    }, this.cacheTime)
  }

  cancel(silent?: boolean): Promise<void> {
    const promise = this.promise

    if (promise && this.cancelFetch) {
      this.cancelFetch(silent)
      return promise.then(noop).catch(noop)
    }

    return Promise.resolve(undefined)
  }

  private clearTimersObservers(): void {
    this.observers.forEach(observer => {
      observer.clearTimers()
    })
  }

  private clearGcTimeout() {
    clearTimeout(this.gcTimeout)
    this.gcTimeout = undefined
  }

  setData(
    updater: Updater<TData | undefined, TData>,
    options?: SetDataOptions
  ): TData {
    const prevData = this.state.data

    // Get the new data
    let data = functionalUpdate(updater, prevData)

    // Structurally share data between prev and new data if needed
    if (this.options.structuralSharing !== false) {
      data = replaceEqualDeep(prevData, data)
    }

    // Use prev data if an isDataEqual function is defined and returns `true`
    if (this.options.isDataEqual?.(prevData, data)) {
      data = prevData as TData
    }

    // Try to determine if more data can be fetched
    const canFetchMore = hasMorePages(this.options, data)

    // Set data and mark it as cached
    this.dispatch({
      type: 'success',
      data,
      canFetchMore,
      updatedAt: options?.updatedAt,
    })

    return data
  }

  remove(): void {
    this.cache.remove(this)
  }

  destroy(): void {
    this.clearGcTimeout()
    this.clearTimersObservers()
    this.cancel()
  }

  isActive(): boolean {
    return this.observers.some(observer => observer.options.enabled !== false)
  }

  isFetching(): boolean {
    return Boolean(this.promise)
  }

  isStale(): boolean {
    return (
      this.state.isInvalidated ||
      !this.state.updatedAt ||
      this.observers.some(observer => observer.getCurrentResult().isStale)
    )
  }

  isStaleByTime(staleTime = 0): boolean {
    return (
      this.state.isInvalidated ||
      !this.state.updatedAt ||
      !timeUntilStale(this.state.updatedAt, staleTime)
    )
  }

  onFocus(): void {
    this.onExternalEvent('focus')
  }

  onOnline(): void {
    this.onExternalEvent('online')
  }

  private onExternalEvent(type: 'focus' | 'online'): void {
    // Execute the first observer that wants to fetch on this event
    const fetchObserver = this.observers.find(observer => {
      const {
        enabled,
        refetchOnWindowFocus,
        refetchOnReconnect,
      } = observer.options

      const { isStale } = observer.getCurrentResult()

      return (
        enabled !== false &&
        ((type === 'focus' &&
          (refetchOnWindowFocus === 'always' ||
            (refetchOnWindowFocus !== false && isStale))) ||
          (type === 'online' &&
            (refetchOnReconnect === 'always' ||
              (refetchOnReconnect !== false && isStale))))
      )
    })

    if (fetchObserver) {
      fetchObserver.fetch()
    }

    // Continue any paused fetch
    this.continueFetch?.()
  }

  subscribeObserver(observer: QueryObserver<any, any, any, any>): void {
    if (this.observers.indexOf(observer) !== -1) {
      return
    }

    this.observers.push(observer)

    // Stop the query from being garbage collected
    this.clearGcTimeout()

    this.cache.notify(this)
  }

  unsubscribeObserver(observer: QueryObserver<any, any, any, any>): void {
    this.observers = this.observers.filter(x => x !== observer)

    if (!this.observers.length) {
      // If the transport layer does not support cancellation
      // we'll let the query continue so the result can be cached
      if (this.isTransportCancelable) {
        this.cancel()
      }

      this.scheduleGc()
    }

    this.cache.notify(this)
  }

  invalidate(): void {
    if (!this.state.isInvalidated) {
      this.dispatch({ type: 'invalidate' })
    }
  }

  async fetch(
    options?: QueryOptions<TData, TError, TQueryFnData>,
    fetchOptions?: FetchOptions
  ): Promise<TData> {
    if (this.promise) {
      if (fetchOptions?.fetchMore && this.state.data) {
        // Silently cancel current fetch if the user wants to fetch more
        await this.cancel(true)
      } else {
        // Return current promise if we are already fetching
        return this.promise
      }
    }

    // Update config if passed, otherwise the config from the last execution is used
    if (options) {
      this.setOptions(options)
    }

    // Use the options from the first observer with a query function if no function is found.
    // This can happen when the query is hydrated or created with setQueryData.
    if (!this.options.queryFn) {
      const observer = this.observers.find(x => x.options.queryFn)
      if (observer) {
        this.setOptions(observer.options)
      }
    }

    options = this.options

    // Get the query function params
    let params = ensureArray(this.queryKey)

    const filter = options.queryFnParamsFilter
    params = filter ? filter(params) : params

    this.promise = (async () => {
      try {
        let data: any

        if (options.infinite) {
          data = await this.startInfiniteFetch(options, params, fetchOptions)
        } else {
          data = await this.startFetch(options, params)
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
            type: 'error',
            error,
          })
        }

        // Log error
        if (!isCancelledError(error)) {
          getConsole().error(error)
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
    options: QueryOptions<TData, TError, TQueryFnData>,
    params: unknown[]
  ): Promise<TData> {
    // Create function to fetch the data
    const queryFn = options.queryFn || defaultQueryFn
    const fetchData = () => queryFn(...params)

    // Set to fetching state if not already in it
    if (!this.state.isFetching) {
      this.dispatch({ type: 'fetch' })
    }

    // Try to fetch the data
    return this.tryFetchData(options, fetchData)
  }

  private startInfiniteFetch(
    options: QueryOptions<TData, TError, TQueryFnData>,
    params: unknown[],
    fetchOptions?: FetchOptions
  ): Promise<TData> {
    const fetchMore = fetchOptions?.fetchMore
    const { previous, fetchMoreVariable } = fetchMore || {}
    const isFetchingMore = fetchMore ? (previous ? 'previous' : 'next') : false
    const prevPages: TQueryFnData[] = (this.state.data as any) || []

    // Create function to fetch a page
    const fetchPage = async (
      pages: TQueryFnData[],
      prepend?: boolean,
      cursor?: unknown
    ) => {
      const lastPage = getLastPage(pages, prepend)

      if (
        typeof cursor === 'undefined' &&
        typeof lastPage !== 'undefined' &&
        options.getFetchMore
      ) {
        cursor = options.getFetchMore(lastPage, pages)
      }

      const queryFn = options.queryFn || defaultQueryFn
      const page = await queryFn(...params, cursor)

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
      this.dispatch({ type: 'fetch', isFetchingMore })
    }

    // Try to get the data
    return this.tryFetchData(options, fetchData)
  }

  private tryFetchData(
    options: QueryOptions<TData, TError, TQueryFnData>,
    fn: QueryFunction
  ): Promise<TData> {
    return new Promise<TData>((outerResolve, outerReject) => {
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
          const data = await promiseOrValue

          // Resolve with data
          resolve(data)
        } catch (error) {
          // Stop if the fetch is already resolved
          if (resolved) {
            return
          }

          // Do we need to retry the request?
          const { failureCount } = this.state
          const retry = options.retry ?? 3
          const retryDelay = options.retryDelay ?? defaultRetryDelay

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
          this.dispatch({ type: 'failed' })

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

function defaultQueryFn() {
  return Promise.reject()
}

function getLastPage<TQueryFnData>(
  pages: TQueryFnData[],
  previous?: boolean
): TQueryFnData {
  return previous ? pages[0] : pages[pages.length - 1]
}

function hasMorePages<TData, TError, TQueryFnData>(
  options: QueryOptions<TData, TError, TQueryFnData>,
  pages: unknown,
  previous?: boolean
): boolean | undefined {
  if (options.infinite && options.getFetchMore && Array.isArray(pages)) {
    return Boolean(options.getFetchMore(getLastPage(pages, previous), pages))
  }
}

function getDefaultState<TData, TError, TQueryFnData>(
  options: QueryOptions<TData, TError, TQueryFnData>
): QueryState<TData, TError> {
  const data =
    typeof options.initialData === 'function'
      ? (options.initialData as InitialDataFunction<TData>)()
      : options.initialData

  const hasData = typeof data !== 'undefined'

  return {
    canFetchMore: hasMorePages(options, data),
    data,
    dataUpdateCount: 0,
    error: null,
    errorUpdateCount: 0,
    failureCount: 0,
    isFetching: false,
    isFetchingMore: false,
    isInvalidated: false,
    status: hasData ? 'success' : 'idle',
    updatedAt: hasData ? Date.now() : 0,
  }
}

export function queryReducer<TData, TError>(
  state: QueryState<TData, TError>,
  action: Action<TData, TError>
): QueryState<TData, TError> {
  switch (action.type) {
    case 'failed':
      return {
        ...state,
        failureCount: state.failureCount + 1,
      }
    case 'fetch':
      return {
        ...state,
        failureCount: 0,
        isFetching: true,
        isFetchingMore: action.isFetchingMore || false,
        status: typeof state.data === 'undefined' ? 'loading' : 'success',
      }
    case 'success':
      return {
        ...state,
        canFetchMore: action.canFetchMore,
        data: action.data,
        dataUpdateCount: state.dataUpdateCount + 1,
        error: null,
        failureCount: 0,
        isFetching: false,
        isFetchingMore: false,
        isInvalidated: false,
        status: 'success',
        updatedAt: action.updatedAt ?? Date.now(),
      }
    case 'error':
      return {
        ...state,
        error: action.error,
        errorUpdateCount: state.errorUpdateCount + 1,
        failureCount: state.failureCount + 1,
        isFetching: false,
        isFetchingMore: false,
        status: 'error',
      }
    case 'invalidate':
      return {
        ...state,
        isInvalidated: true,
      }
    default:
      return state
  }
}
