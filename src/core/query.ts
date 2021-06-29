import {
  Updater,
  functionalUpdate,
  isValidTimeout,
  noop,
  replaceEqualDeep,
  timeUntilStale,
  ensureQueryKeyArray,
} from './utils'
import type {
  InitialDataFunction,
  QueryKey,
  QueryOptions,
  QueryStatus,
  QueryFunctionContext,
  EnsuredQueryKey,
} from './types'
import type { QueryCache } from './queryCache'
import type { QueryObserver } from './queryObserver'
import { notifyManager } from './notifyManager'
import { getLogger } from './logger'
import { Retryer, CancelOptions, isCancelledError } from './retryer'

// TYPES

interface QueryConfig<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey = QueryKey
> {
  cache: QueryCache
  queryKey: TQueryKey
  queryHash: string
  options?: QueryOptions<TQueryFnData, TError, TData, TQueryKey>
  defaultOptions?: QueryOptions<TQueryFnData, TError, TData, TQueryKey>
  state?: QueryState<TData, TError>
}

export interface QueryState<TData = unknown, TError = unknown> {
  data: TData | undefined
  dataUpdateCount: number
  dataUpdatedAt: number
  error: TError | null
  errorUpdateCount: number
  errorUpdatedAt: number
  fetchFailureCount: number
  fetchMeta: any
  isFetching: boolean
  isInvalidated: boolean
  isPaused: boolean
  status: QueryStatus
}

export interface FetchContext<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey = QueryKey
> {
  fetchFn: () => unknown | Promise<unknown>
  fetchOptions?: FetchOptions
  options: QueryOptions<TQueryFnData, TError, TData, any>
  queryKey: EnsuredQueryKey<TQueryKey>
  state: QueryState<TData, TError>
}

export interface QueryBehavior<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
> {
  onFetch: (
    context: FetchContext<TQueryFnData, TError, TData, TQueryKey>
  ) => void
}

export interface FetchOptions {
  cancelRefetch?: boolean
  meta?: any
}

export interface SetDataOptions {
  updatedAt?: number
}

interface FailedAction {
  type: 'failed'
}

interface FetchAction {
  type: 'fetch'
  meta?: any
}

interface SuccessAction<TData> {
  data: TData | undefined
  type: 'success'
  dataUpdatedAt?: number
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
  setStateOptions?: SetStateOptions
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

export interface SetStateOptions {
  meta?: any
}

// CLASS

export class Query<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
> {
  queryKey: TQueryKey
  queryHash: string
  options!: QueryOptions<TQueryFnData, TError, TData, TQueryKey>
  initialState: QueryState<TData, TError>
  revertState?: QueryState<TData, TError>
  state: QueryState<TData, TError>
  cacheTime!: number

  private cache: QueryCache
  private promise?: Promise<TData>
  private gcTimeout?: number
  private retryer?: Retryer<TData, TError>
  private observers: QueryObserver<any, any, any, any, any>[]
  private defaultOptions?: QueryOptions<TQueryFnData, TError, TData, TQueryKey>

  constructor(config: QueryConfig<TQueryFnData, TError, TData, TQueryKey>) {
    this.defaultOptions = config.defaultOptions
    this.setOptions(config.options)
    this.observers = []
    this.cache = config.cache
    this.queryKey = config.queryKey
    this.queryHash = config.queryHash
    this.initialState = config.state || this.getDefaultState(this.options)
    this.state = this.initialState
    this.scheduleGc()
  }

  private setOptions(
    options?: QueryOptions<TQueryFnData, TError, TData, TQueryKey>
  ): void {
    this.options = { ...this.defaultOptions, ...options }

    // Default to 5 minutes if not cache time is set
    this.cacheTime = Math.max(
      this.cacheTime || 0,
      this.options.cacheTime ?? 5 * 60 * 1000
    )
  }

  setDefaultOptions(
    options: QueryOptions<TQueryFnData, TError, TData, TQueryKey>
  ): void {
    this.defaultOptions = options
  }

  private scheduleGc(): void {
    this.clearGcTimeout()

    if (isValidTimeout(this.cacheTime)) {
      this.gcTimeout = setTimeout(() => {
        this.optionalRemove()
      }, this.cacheTime)
    }
  }

  private clearGcTimeout() {
    clearTimeout(this.gcTimeout)
    this.gcTimeout = undefined
  }

  private optionalRemove() {
    if (!this.observers.length && !this.state.isFetching) {
      this.cache.remove(this)
    }
  }

  setData(
    updater: Updater<TData | undefined, TData>,
    options?: SetDataOptions
  ): TData {
    const prevData = this.state.data

    // Get the new data
    let data = functionalUpdate(updater, prevData)

    // Use prev data if an isDataEqual function is defined and returns `true`
    if (this.options.isDataEqual?.(prevData, data)) {
      data = prevData as TData
    } else if (this.options.structuralSharing !== false) {
      // Structurally share data between prev and new data if needed
      data = replaceEqualDeep(prevData, data)
    }

    // Set data and mark it as cached
    this.dispatch({
      data,
      type: 'success',
      dataUpdatedAt: options?.updatedAt,
    })

    return data
  }

  setState(
    state: QueryState<TData, TError>,
    setStateOptions?: SetStateOptions
  ): void {
    this.dispatch({ type: 'setState', state, setStateOptions })
  }

  cancel(options?: CancelOptions): Promise<void> {
    const promise = this.promise
    this.retryer?.cancel(options)
    return promise ? promise.then(noop).catch(noop) : Promise.resolve()
  }

  destroy(): void {
    this.clearGcTimeout()
    this.cancel({ silent: true })
  }

  reset(): void {
    this.destroy()
    this.setState(this.initialState)
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
    const observer = this.observers.find(x => x.shouldFetchOnWindowFocus())

    if (observer) {
      observer.refetch()
    }

    // Continue fetch if currently paused
    this.retryer?.continue()
  }

  onOnline(): void {
    const observer = this.observers.find(x => x.shouldFetchOnReconnect())

    if (observer) {
      observer.refetch()
    }

    // Continue fetch if currently paused
    this.retryer?.continue()
  }

  addObserver(observer: QueryObserver<any, any, any, any, any>): void {
    if (this.observers.indexOf(observer) === -1) {
      this.observers.push(observer)

      // Stop the query from being garbage collected
      this.clearGcTimeout()

      this.cache.notify({ type: 'observerAdded', query: this, observer })
    }
  }

  removeObserver(observer: QueryObserver<any, any, any, any, any>): void {
    if (this.observers.indexOf(observer) !== -1) {
      this.observers = this.observers.filter(x => x !== observer)

      if (!this.observers.length) {
        // If the transport layer does not support cancellation
        // we'll let the query continue so the result can be cached
        if (this.retryer) {
          if (this.retryer.isTransportCancelable) {
            this.retryer.cancel({ revert: true })
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

      this.cache.notify({ type: 'observerRemoved', query: this, observer })
    }
  }

  getObserversCount(): number {
    return this.observers.length
  }

  invalidate(): void {
    if (!this.state.isInvalidated) {
      this.dispatch({ type: 'invalidate' })
    }
  }

  fetch(
    options?: QueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    fetchOptions?: FetchOptions
  ): Promise<TData> {
    if (this.state.isFetching) {
      if (this.state.dataUpdatedAt && fetchOptions?.cancelRefetch) {
        // Silently cancel current fetch if the user wants to cancel refetches
        this.cancel({ silent: true })
      } else if (this.promise) {
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

    const queryKey = ensureQueryKeyArray(this.queryKey)

    // Create query function context
    const queryFnContext: QueryFunctionContext<TQueryKey> = {
      queryKey,
      pageParam: undefined,
    }

    // Create fetch function
    const fetchFn = () =>
      this.options.queryFn
        ? this.options.queryFn(queryFnContext)
        : Promise.reject('Missing queryFn')

    // Trigger behavior hook
    const context: FetchContext<TQueryFnData, TError, TData, TQueryKey> = {
      fetchOptions,
      options: this.options,
      queryKey: queryKey,
      state: this.state,
      fetchFn,
    }

    if (this.options.behavior?.onFetch) {
      this.options.behavior?.onFetch(context)
    }

    // Store state in case the current fetch needs to be reverted
    this.revertState = this.state

    // Set to fetching state if not already in it
    if (
      !this.state.isFetching ||
      this.state.fetchMeta !== context.fetchOptions?.meta
    ) {
      this.dispatch({ type: 'fetch', meta: context.fetchOptions?.meta })
    }

    // Try to fetch the data
    this.retryer = new Retryer({
      fn: context.fetchFn as () => TData,
      onSuccess: data => {
        this.setData(data as TData)

        // Remove query after fetching if cache time is 0
        if (this.cacheTime === 0) {
          this.optionalRemove()
        }
      },
      onError: (error: TError | { silent?: boolean }) => {
        // Optimistically update state if needed
        if (!(isCancelledError(error) && error.silent)) {
          this.dispatch({
            type: 'error',
            error: error as TError,
          })
        }

        if (!isCancelledError(error)) {
          // Notify cache callback
          if (this.cache.config.onError) {
            this.cache.config.onError(error, this as Query<any, any, any, any>)
          }

          // Log error
          getLogger().error(error)
        }

        // Remove query after fetching if cache time is 0
        if (this.cacheTime === 0) {
          this.optionalRemove()
        }
      },
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

    return this.promise
  }

  private dispatch(action: Action<TData, TError>): void {
    this.state = this.reducer(this.state, action)

    notifyManager.batch(() => {
      this.observers.forEach(observer => {
        observer.onQueryUpdate(action)
      })

      this.cache.notify({ query: this, type: 'queryUpdated', action })
    })
  }

  protected getDefaultState(
    options: QueryOptions<TQueryFnData, TError, TData, TQueryKey>
  ): QueryState<TData, TError> {
    const data =
      typeof options.initialData === 'function'
        ? (options.initialData as InitialDataFunction<TData>)()
        : options.initialData

    const hasInitialData = typeof options.initialData !== 'undefined'

    const initialDataUpdatedAt = hasInitialData
      ? typeof options.initialDataUpdatedAt === 'function'
        ? (options.initialDataUpdatedAt as () => number | undefined)()
        : options.initialDataUpdatedAt
      : 0

    const hasData = typeof data !== 'undefined'

    return {
      data,
      dataUpdateCount: 0,
      dataUpdatedAt: hasData ? initialDataUpdatedAt ?? Date.now() : 0,
      error: null,
      errorUpdateCount: 0,
      errorUpdatedAt: 0,
      fetchFailureCount: 0,
      fetchMeta: null,
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
          fetchMeta: action.meta ?? null,
          isFetching: true,
          isPaused: false,
          status: !state.dataUpdatedAt ? 'loading' : state.status,
        }
      case 'success':
        return {
          ...state,
          data: action.data,
          dataUpdateCount: state.dataUpdateCount + 1,
          dataUpdatedAt: action.dataUpdatedAt ?? Date.now(),
          error: null,
          fetchFailureCount: 0,
          isFetching: false,
          isInvalidated: false,
          isPaused: false,
          status: 'success',
        }
      case 'error':
        const error = action.error as unknown

        if (isCancelledError(error) && error.revert && this.revertState) {
          return { ...this.revertState }
        }

        return {
          ...state,
          error: error as TError,
          errorUpdateCount: state.errorUpdateCount + 1,
          errorUpdatedAt: Date.now(),
          fetchFailureCount: state.fetchFailureCount + 1,
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
