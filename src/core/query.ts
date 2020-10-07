import {
  CancelOptions,
  CancelledError,
  Updater,
  defaultRetryDelay,
  ensureArray,
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
  timeUntilStale,
} from './utils'
import type {
  InitialDataFunction,
  QueryFunction,
  QueryKey,
  QueryOptions,
  QueryStatus,
} from './types'
import type { QueryCache } from './queryCache'
import type { QueryObserver } from './queryObserver'
import { notifyManager } from './notifyManager'
import { getLogger } from './logger'

// TYPES

interface QueryConfig<TData, TError, TQueryFnData> {
  cache: QueryCache
  queryKey: QueryKey
  queryHash: string
  options?: QueryOptions<TData, TError, TQueryFnData>
}

export interface QueryState<TData, TError> {
  data: TData | undefined
  dataUpdateCount: number
  error: TError | null
  errorUpdateCount: number
  failureCount: number
  hasNextPage: boolean | undefined
  hasPreviousPage: boolean | undefined
  isFetching: boolean
  isFetchingNextPage: boolean
  isFetchingPreviousPage: boolean
  isInvalidated: boolean
  pageParams: unknown[] | undefined
  status: QueryStatus
  updatedAt: number
}

export interface FetchOptions {
  fetchMore?: FetchMoreOptions
  throwOnError?: boolean
}

interface FetchMoreOptions {
  pageParam?: unknown
  direction: 'forward' | 'backward'
}

export interface SetDataOptions {
  pageParams?: unknown[]
  updatedAt?: number
}

interface FailedAction {
  type: 'failed'
}

interface FetchAction {
  type: 'fetch'
  isFetchingNextPage?: boolean
  isFetchingPreviousPage?: boolean
}

interface SuccessAction<TData> {
  data: TData | undefined
  hasNextPage?: boolean
  hasPreviousPage?: boolean
  pageParams?: unknown[]
  type: 'success'
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
  state: QueryState<TData, TError>
  cacheTime!: number

  private cache: QueryCache
  private promise?: Promise<TData>
  private gcTimeout?: number
  private cancelFetch?: (options?: CancelOptions) => void
  private continueFetch?: () => void
  private isTransportCancelable?: boolean
  private observers: QueryObserver<any, any, any, any>[]

  constructor(config: QueryConfig<TData, TError, TQueryFnData>) {
    this.setOptions(config.options)
    this.observers = []
    this.cache = config.cache
    this.queryKey = config.queryKey
    this.queryHash = config.queryHash
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

  cancel(options?: CancelOptions): Promise<void> {
    const promise: Promise<any> = this.promise || Promise.resolve()
    this.cancelFetch?.(options)
    return promise.then(noop).catch(noop)
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

    // Set data and mark it as cached
    this.dispatch({
      data,
      hasNextPage: hasNextPage(this.options, data),
      hasPreviousPage: hasPreviousPage(this.options, data),
      pageParams: options?.pageParams,
      type: 'success',
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
    return this.state.isFetching
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
      fetchObserver.refetch()
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

  fetch(
    options?: QueryOptions<TData, TError, TQueryFnData>,
    fetchOptions?: FetchOptions
  ): Promise<TData> {
    if (this.state.isFetching)
      if (fetchOptions?.fetchMore && this.state.updatedAt) {
        // Silently cancel current fetch if the user wants to fetch more
        this.cancel({ silent: true })
      } else if (this.promise) {
        // Return current promise if we are already fetching
        return this.promise
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

    // Get the query function params
    let params = ensureArray(this.queryKey)

    const filter = this.options.queryFnParamsFilter
    params = filter ? filter(params) : params

    const promise = this.options.infinite
      ? this.startInfiniteFetch(this.options, params, fetchOptions)
      : this.startFetch(this.options, params)

    this.promise = promise.catch(error => {
      // Set error state if needed
      if (!(isCancelledError(error) && error.silent)) {
        this.dispatch({
          type: 'error',
          error,
        })
      }

      // Log error
      if (!isCancelledError(error)) {
        getLogger().error(error)
      }

      // Propagate error
      throw error
    })

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
    return this.tryFetchData(options, fetchData).then(data =>
      this.setData(data)
    )
  }

  private startInfiniteFetch(
    options: QueryOptions<TData, TError, TQueryFnData>,
    params: unknown[],
    fetchOptions?: FetchOptions
  ): Promise<TData> {
    const queryFn = options.queryFn || defaultQueryFn
    const fetchMore = fetchOptions?.fetchMore
    const pageParam = fetchMore?.pageParam
    const isFetchingNextPage = fetchMore?.direction === 'forward'
    const isFetchingPreviousPage = fetchMore?.direction === 'backward'
    const oldPages = (this.state.data || []) as TQueryFnData[]
    const oldPageParams = this.state.pageParams || []
    let newPageParams = oldPageParams

    // Create function to fetch a page
    const fetchPage = (
      pages: TQueryFnData[],
      manual?: boolean,
      param?: unknown,
      previous?: boolean
    ): Promise<TQueryFnData[]> => {
      if (typeof param === 'undefined' && !manual && pages.length) {
        return Promise.resolve(pages)
      }

      return Promise.resolve()
        .then(() => queryFn(...params, param))
        .then(page => {
          newPageParams = previous
            ? [param, ...newPageParams]
            : [...newPageParams, param]
          return previous ? [page, ...pages] : [...pages, page]
        })
    }

    // Create function to fetch the data
    const fetchData = (): Promise<TQueryFnData[]> => {
      // Reset new page params
      newPageParams = oldPageParams

      // Fetch first page?
      if (!oldPages.length) {
        return fetchPage([])
      }

      // Fetch next page?
      if (isFetchingNextPage) {
        const manual = typeof pageParam !== 'undefined'
        const param = manual ? pageParam : getNextPageParam(options, oldPages)
        return fetchPage(oldPages, manual, param)
      }

      // Fetch previous page?
      if (isFetchingPreviousPage) {
        const manual = typeof pageParam !== 'undefined'
        const param = manual
          ? pageParam
          : getPreviousPageParam(options, oldPages)
        return fetchPage(oldPages, manual, param, true)
      }

      // Refetch pages
      newPageParams = []

      const manual = typeof options.getNextPageParam === 'undefined'

      // Fetch first page
      let promise = fetchPage([], manual, oldPageParams[0])

      // Fetch remaining pages
      for (let i = 1; i < oldPages.length; i++) {
        promise = promise.then(pages => {
          const param = manual
            ? oldPageParams[i]
            : getNextPageParam(options, pages)
          return fetchPage(pages, manual, param)
        })
      }

      return promise
    }

    // Set to fetching state if not already in it
    if (
      !this.state.isFetching ||
      this.state.isFetchingNextPage !== isFetchingNextPage ||
      this.state.isFetchingPreviousPage !== isFetchingPreviousPage
    ) {
      this.dispatch({
        type: 'fetch',
        isFetchingNextPage,
        isFetchingPreviousPage,
      })
    }

    // Try to get the data
    return this.tryFetchData(options, fetchData).then(data =>
      this.setData(data, { pageParams: newPageParams })
    )
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
      this.cancelFetch = cancelOptions => {
        reject(new CancelledError(cancelOptions))
        cancelTransport?.()
      }

      // Create callback to continue this fetch
      this.continueFetch = () => {
        continueLoop?.()
      }

      // Create loop function
      const run = () => {
        // Do nothing if already resolved
        if (resolved) {
          return
        }

        let promiseOrValue: any

        // Execute query
        try {
          promiseOrValue = fn()
        } catch (error) {
          promiseOrValue = Promise.reject(error)
        }

        // Check if the transport layer support cancellation
        if (isCancelable(promiseOrValue)) {
          cancelTransport = () => {
            try {
              promiseOrValue.cancel()
            } catch {}
          }
          this.isTransportCancelable = true
        }

        Promise.resolve(promiseOrValue)
          .then(data => {
            // Resolve with data
            resolve(data)
          })
          .catch(error => {
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
              (typeof retry === 'number' && failureCount < retry) ||
              (typeof retry === 'function' && retry(failureCount, error))

            if (!shouldRetry) {
              // We are done if the query does not need to be retried
              reject(error)
              return
            }

            // Increase the failureCount
            this.dispatch({ type: 'failed' })

            // Delay
            sleep(functionalUpdate(retryDelay, failureCount) || 0)
              // Pause if needed
              .then(() => {
                // Pause retry if the document is not visible or when the device is offline
                if (!isDocumentVisible() || !isOnline()) {
                  return new Promise(continueResolve => {
                    continueLoop = continueResolve
                  })
                }
              })
              // Try again
              .then(run)
          })
      }

      // Start loop
      run()
    })
  }
}

function defaultQueryFn() {
  return Promise.reject()
}

function getNextPageParam<TData, TError, TQueryFnData>(
  options: QueryOptions<TData, TError, TQueryFnData>,
  pages: TQueryFnData[]
): unknown | undefined {
  return options.getNextPageParam?.(pages[pages.length - 1], pages)
}

function getPreviousPageParam<TData, TError, TQueryFnData>(
  options: QueryOptions<TData, TError, TQueryFnData>,
  pages: TQueryFnData[]
): unknown | undefined {
  return options.getPreviousPageParam?.(pages[0], pages)
}

/**
 * Checks if there is a next page.
 * Returns `undefined` if it cannot be determined.
 */
function hasNextPage<TData, TError, TQueryFnData>(
  options: QueryOptions<TData, TError, TQueryFnData>,
  pages: unknown
): boolean | undefined {
  return options.getNextPageParam && Array.isArray(pages)
    ? typeof getNextPageParam(options, pages) !== 'undefined'
    : undefined
}

/**
 * Checks if there is a previous page.
 * Returns `undefined` if it cannot be determined.
 */
function hasPreviousPage<TData, TError, TQueryFnData>(
  options: QueryOptions<TData, TError, TQueryFnData>,
  pages: unknown
): boolean | undefined {
  return options.getPreviousPageParam && Array.isArray(pages)
    ? typeof getPreviousPageParam(options, pages) !== 'undefined'
    : undefined
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
    data,
    dataUpdateCount: 0,
    error: null,
    errorUpdateCount: 0,
    failureCount: 0,
    hasNextPage: hasNextPage(options, data),
    hasPreviousPage: hasPreviousPage(options, data),
    isFetching: false,
    isFetchingNextPage: false,
    isFetchingPreviousPage: false,
    isInvalidated: false,
    pageParams: undefined,
    status: hasData ? 'success' : 'idle',
    updatedAt: hasData ? Date.now() : 0,
  }
}

function queryReducer<TData, TError>(
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
        isFetchingNextPage: action.isFetchingNextPage || false,
        isFetchingPreviousPage: action.isFetchingPreviousPage || false,
        status: state.updatedAt ? 'success' : 'loading',
      }
    case 'success':
      return {
        ...state,
        data: action.data,
        dataUpdateCount: state.dataUpdateCount + 1,
        error: null,
        failureCount: 0,
        hasNextPage: action.hasNextPage,
        hasPreviousPage: action.hasPreviousPage,
        pageParams: action.pageParams,
        isFetching: false,
        isFetchingNextPage: false,
        isFetchingPreviousPage: false,
        isInvalidated: false,
        status: 'success',
        updatedAt: action.updatedAt ?? Date.now(),
      }
    case 'error':
      const error = action.error as unknown

      if (isCancelledError(error) && error.revert) {
        return {
          ...state,
          failureCount: 0,
          isFetching: false,
          isFetchingNextPage: false,
          isFetchingPreviousPage: false,
          status: state.error ? 'error' : state.updatedAt ? 'success' : 'idle',
        }
      }

      return {
        ...state,
        error: error as TError,
        errorUpdateCount: state.errorUpdateCount + 1,
        failureCount: state.failureCount + 1,
        isFetching: false,
        isFetchingNextPage: false,
        isFetchingPreviousPage: false,
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
