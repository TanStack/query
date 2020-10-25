import {
  Updater,
  ensureArray,
  functionalUpdate,
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
import { Retryer, CancelOptions, isCancelledError } from './retryer'

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
  dataOrigin?: QueryDataOrigin
  dataUpdateCount: number
  dataUpdatedAt: number
  error: TError | null
  errorOrigin?: QueryErrorOrigin
  errorUpdateCount: number
  errorUpdatedAt: number
  fetchFailureCount: number
  fetchMeta: any
  fetchOrigin?: QueryFetchOrigin
  isFetching: boolean
  isInvalidated: boolean
  isPaused: boolean
  status: QueryStatus
}

export type QueryFetchOrigin =
  | 'clientFetch'
  | 'clientRefetch'
  | 'observerFetch'
  | 'observerRefetch'
  | 'observerRefetchInterval'
  | 'observerRefetchOnMount'
  | 'observerRefetchOnReconnect'
  | 'observerRefetchOnWindowFocus'

export type QueryDataOrigin = QueryFetchOrigin | 'initialData' | 'setData'

export type QueryErrorOrigin = QueryFetchOrigin

export interface FetchContext<TData, TError, TQueryFnData> {
  state: QueryState<TData, TError>
  options: QueryOptions<TData, TError, TQueryFnData>
  params: unknown[]
  fetchOptions?: FetchOptions
  queryFn: QueryFunction
}

export interface QueryBehavior<
  TData = unknown,
  TError = unknown,
  TQueryFnData = TData
> {
  onFetch: (context: FetchContext<TData, TError, TQueryFnData>) => void
}

export interface FetchOptions {
  cancelRefetch?: boolean
  meta?: any
  origin?: QueryFetchOrigin
}

export interface SetDataOptions {
  origin?: QueryDataOrigin
  updatedAt?: number
}

interface FailedAction {
  type: 'failed'
}

interface FetchAction {
  meta?: any
  origin?: QueryFetchOrigin
  type: 'fetch'
}

interface SuccessAction<TData> {
  data: TData | undefined
  origin?: QueryDataOrigin
  type: 'success'
  updatedAt?: number
}

interface ErrorAction<TError> {
  error: TError
  origin?: QueryErrorOrigin
  type: 'error'
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
    this.state = config.state || this.getDefaultState(this.options)
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

  private scheduleGc(): void {
    this.clearGcTimeout()

    if (isValidTimeout(this.cacheTime)) {
      this.gcTimeout = setTimeout(() => {
        if (!this.observers.length) {
          this.cache.remove(this)
        }
      }, this.cacheTime)
    }
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
      origin: options?.origin || 'setData',
      type: 'success',
      updatedAt: options?.updatedAt,
    })

    return data
  }

  setState(state: QueryState<TData, TError>): void {
    this.dispatch({ type: 'setState', state })
  }

  cancel(options?: CancelOptions): Promise<void> {
    const promise = this.promise
    this.retryer?.cancel(options)
    return promise ? promise.then(noop).catch(noop) : Promise.resolve()
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
      !this.state.dataUpdatedAt ||
      this.observers.some(observer => observer.getCurrentResult().isStale)
    )
  }

  isStaleByTime(staleTime = 0): boolean {
    return (
      this.state.isInvalidated ||
      !this.state.dataUpdatedAt ||
      !timeUntilStale(this.state.dataUpdatedAt, staleTime)
    )
  }

  onFocus(): void {
    const observer = this.observers.find(x => x.willFetchOnWindowFocus())

    if (observer) {
      observer.refetch({ origin: 'observerRefetchOnWindowFocus' })
    }

    // Continue fetch if currently paused
    this.retryer?.continue()
  }

  onOnline(): void {
    const observer = this.observers.find(x => x.willFetchOnReconnect())

    if (observer) {
      observer.refetch({ origin: 'observerRefetchOnReconnect' })
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
        if (this.retryer) {
          if (this.retryer.isTransportCancelable) {
            this.retryer.cancel()
          } else {
            this.retryer.cancelRetry()
          }
        }

        if (this.cacheTime) {
          this.scheduleGc()
        } else {
          this.cache.remove(this)
        }
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
      if (this.state.dataUpdatedAt && fetchOptions?.cancelRefetch) {
        // Silently cancel current fetch if the user wants to cancel refetches
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

    // Get query function
    const queryFn = () =>
      this.options.queryFn
        ? this.options.queryFn(...params)
        : Promise.reject('Missing queryFn')

    // Trigger behavior hook
    const context: FetchContext<TData, TError, TQueryFnData> = {
      fetchOptions,
      options: this.options,
      params,
      state: this.state,
      queryFn,
    }

    if (this.options.behavior?.onFetch) {
      this.options.behavior?.onFetch(context)
    }

    // Set to fetching state if not already in it
    if (
      !this.state.isFetching ||
      this.state.fetchMeta !== context.fetchOptions?.meta ||
      this.state.fetchOrigin !== context.fetchOptions?.origin
    ) {
      this.dispatch({
        type: 'fetch',
        meta: context.fetchOptions?.meta,
        origin: context.fetchOptions?.origin,
      })
    }

    // Try to fetch the data
    this.retryer = new Retryer({
      fn: context.queryFn,
      onFail: () => {
        this.dispatch({ type: 'failed' })
      },
      onPause: () => {
        this.dispatch({ type: 'pause' })
      },
      onContinue: () => {
        this.dispatch({ type: 'continue' })
      },
      retry: context.options.retry,
      retryDelay: context.options.retryDelay,
    })

    this.promise = this.retryer.promise
      .then(data =>
        this.setData(data as TData, { origin: fetchOptions?.origin })
      )
      .catch(error => {
        // Set error state if needed
        if (!(isCancelledError(error) && error.silent)) {
          this.dispatch({
            type: 'error',
            origin: fetchOptions?.origin,
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

  private dispatch(action: Action<TData, TError>): void {
    this.state = this.reducer(this.state, action)

    notifyManager.batch(() => {
      this.observers.forEach(observer => {
        observer.onQueryUpdate(action)
      })

      this.cache.notify(this)
    })
  }

  protected getDefaultState(
    options: QueryOptions<TData, TError, TQueryFnData>
  ): QueryState<TData, TError> {
    const data =
      typeof options.initialData === 'function'
        ? (options.initialData as InitialDataFunction<TData>)()
        : options.initialData

    const hasData = typeof data !== 'undefined'

    return {
      data,
      dataOrigin: hasData ? 'initialData' : undefined,
      dataUpdateCount: 0,
      dataUpdatedAt: hasData ? Date.now() : 0,
      error: null,
      errorUpdateCount: 0,
      errorUpdatedAt: 0,
      fetchFailureCount: 0,
      fetchMeta: undefined,
      isFetching: false,
      isInvalidated: false,
      isPaused: false,
      status: hasData ? 'success' : 'idle',
    }
  }

  protected reducer(
    state: QueryState<TData, TError>,
    action: Action<TData, TError>
  ): QueryState<TData, TError> {
    switch (action.type) {
      case 'failed':
        return {
          ...state,
          fetchFailureCount: state.fetchFailureCount + 1,
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
          fetchFailureCount: 0,
          fetchMeta: action.meta,
          fetchOrigin: action.origin,
          isFetching: true,
          isPaused: false,
          status: state.status === 'idle' ? 'loading' : state.status,
        }
      case 'success':
        return {
          ...state,
          data: action.data,
          dataOrigin: action.origin,
          dataUpdateCount: state.dataUpdateCount + 1,
          dataUpdatedAt: action.updatedAt ?? Date.now(),
          error: null,
          fetchFailureCount: 0,
          fetchOrigin: undefined,
          isFetching: false,
          isInvalidated: false,
          isPaused: false,
          status: 'success',
        }
      case 'error':
        const error = action.error as unknown

        if (isCancelledError(error) && error.revert) {
          return {
            ...state,
            fetchFailureCount: 0,
            fetchOrigin: undefined,
            isFetching: false,
            isPaused: false,
            status: state.status === 'loading' ? 'idle' : state.status,
          }
        }

        return {
          ...state,
          error: error as TError,
          errorOrigin: action.origin,
          errorUpdateCount: state.errorUpdateCount + 1,
          errorUpdatedAt: Date.now(),
          fetchFailureCount: state.fetchFailureCount + 1,
          fetchOrigin: undefined,
          isFetching: false,
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
}
