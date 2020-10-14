import {
  CancelOptions,
  Updater,
  ensureArray,
  functionalUpdate,
  isCancelledError,
  isValidTimeout,
  noop,
  replaceEqualDeep,
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
import { Retryer } from './retryer'

// TYPES

interface QueryConfig<TData, TError, TQueryFnData> {
  cache: QueryCache
  queryKey: QueryKey
  queryHash: string
  options?: QueryOptions<TData, TError, TQueryFnData>
  defaultOptions?: QueryOptions<TData, TError, TQueryFnData>
  state?: QueryState<TData, TError>
}

export interface QueryState<TData = unknown, TError = unknown> {
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
  isPaused: boolean
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

interface PauseAction {
  type: 'pause'
}

interface ContinueAction {
  type: 'continue'
}

interface SetStateAction<TData, TError> {
  type: 'setState'
  state: QueryState<TData, TError>
}

export type Action<TData, TError> =
  | ContinueAction
  | ErrorAction<TError>
  | FailedAction
  | FetchAction
  | InvalidateAction
  | PauseAction
  | SetStateAction<TData, TError>
  | SuccessAction<TData>

// CLASS

export class Query<TData = unknown, TError = unknown, TQueryFnData = TData> {
  queryKey: QueryKey
  queryHash: string
  options!: QueryOptions<TData, TError, TQueryFnData>
  state: QueryState<TData, TError>
  cacheTime!: number

  private cache: QueryCache
  private promise?: Promise<TData>
  private gcTimeout?: number
  private retryer?: Retryer<unknown, TError>
  private observers: QueryObserver<any, any, any, any>[]
  private defaultOptions?: QueryOptions<TData, TError, TQueryFnData>

  constructor(config: QueryConfig<TData, TError, TQueryFnData>) {
    this.defaultOptions = config.defaultOptions
    this.setOptions(config.options)
    this.observers = []
    this.cache = config.cache
    this.queryKey = config.queryKey
    this.queryHash = config.queryHash
    this.state = config.state || getDefaultState(this.options)
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
    this.state = reducer(this.state, action)

    notifyManager.batch(() => {
      this.observers.forEach(observer => {
        observer.onQueryUpdate(action)
      })

      this.cache.notify(this)
    })
  }

  private scheduleGc(): void {
    this.clearGcTimeout()

    if (!this.observers.length && isValidTimeout(this.cacheTime)) {
      this.gcTimeout = setTimeout(() => {
        this.remove()
      }, this.cacheTime)
    }
  }

  cancel(options?: CancelOptions): Promise<void> {
    const promise = this.promise
    this.retryer?.cancel(options)
    return promise ? promise.then(noop).catch(noop) : Promise.resolve()
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

  setState(state: QueryState<TData, TError>): void {
    this.dispatch({ type: 'setState', state })
  }

  remove(): void {
    this.cache.remove(this)
  }

  destroy(): void {
    this.clearGcTimeout()
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

    // Continue fetch if currently paused
    this.retryer?.continue()
  }

  addObserver(observer: QueryObserver<any, any, any, any>): void {
    if (this.observers.indexOf(observer) === -1) {
      this.observers.push(observer)

      // Stop the query from being garbage collected
      this.clearGcTimeout()

      this.cache.notify(this)
    }
  }

  removeObserver(observer: QueryObserver<any, any, any, any>): void {
    if (this.observers.indexOf(observer) !== -1) {
      this.observers = this.observers.filter(x => x !== observer)

      if (!this.observers.length) {
        // If the transport layer does not support cancellation
        // we'll let the query continue so the result can be cached
        if (this.retryer && this.retryer.isTransportCancelable) {
          this.retryer.cancel()
        }

        this.scheduleGc()
      }

      this.cache.notify(this)
    }
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
    const fetchData = () => this.executeQueryFn(options, params)

    // Set to fetching state if not already in it
    if (!this.state.isFetching) {
      this.dispatch({ type: 'fetch' })
    }

    // Try to fetch the data
    return this.executeFetch(options, fetchData).then(data =>
      this.setData(data as TData)
    )
  }

  private startInfiniteFetch(
    options: QueryOptions<TData, TError, TQueryFnData>,
    params: unknown[],
    fetchOptions?: FetchOptions
  ): Promise<TData> {
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

      return this.executeQueryFn(options, [...params, param]).then(page => {
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
    return this.executeFetch(options, fetchData).then(data =>
      this.setData(data as TData, { pageParams: newPageParams })
    )
  }

  private executeQueryFn(
    options: QueryOptions<TData, TError, TQueryFnData>,
    params: unknown[]
  ): Promise<TQueryFnData> {
    return options.queryFn
      ? Promise.resolve(options.queryFn(...params))
      : Promise.reject('No queryFn found')
  }

  private executeFetch(
    options: QueryOptions<TData, TError, TQueryFnData>,
    queryFn: QueryFunction
  ): Promise<unknown> {
    this.retryer = new Retryer({
      fn: queryFn,
      onFail: () => {
        this.dispatch({ type: 'failed' })
      },
      onPause: () => {
        this.dispatch({ type: 'pause' })
      },
      onContinue: () => {
        this.dispatch({ type: 'continue' })
      },
      retry: options.retry,
      retryDelay: options.retryDelay,
    })

    return this.retryer.promise
  }
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
    isPaused: false,
    pageParams: undefined,
    status: hasData ? 'success' : 'idle',
    updatedAt: hasData ? Date.now() : 0,
  }
}

function reducer<TData, TError>(
  state: QueryState<TData, TError>,
  action: Action<TData, TError>
): QueryState<TData, TError> {
  switch (action.type) {
    case 'failed':
      return {
        ...state,
        failureCount: state.failureCount + 1,
      }
    case 'pause':
      return {
        ...state,
        isPaused: true,
      }
    case 'continue':
      return {
        ...state,
        isPaused: false,
      }
    case 'fetch':
      return {
        ...state,
        failureCount: 0,
        isFetching: true,
        isFetchingNextPage: action.isFetchingNextPage || false,
        isFetchingPreviousPage: action.isFetchingPreviousPage || false,
        isPaused: false,
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
        isPaused: false,
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
          isPaused: false,
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
        isPaused: false,
        status: 'error',
      }
    case 'invalidate':
      return {
        ...state,
        isInvalidated: true,
      }
    case 'setState':
      return {
        ...state,
        ...action.state,
      }
    default:
      return state
  }
}
