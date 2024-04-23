import { noop, replaceData, skipToken, timeUntilStale } from './utils'
import { notifyManager } from './notifyManager'
import { canFetch, createRetryer, isCancelledError } from './retryer'
import { Removable } from './removable'
import type {
  CancelOptions,
  DefaultError,
  FetchStatus,
  InitialDataFunction,
  OmitKeyof,
  QueryFunctionContext,
  QueryKey,
  QueryMeta,
  QueryOptions,
  QueryStatus,
  SetDataOptions,
} from './types'
import type { QueryCache } from './queryCache'
import type { QueryObserver } from './queryObserver'
import type { Retryer } from './retryer'

// TYPES

interface QueryConfig<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey = QueryKey,
> {
  cache: QueryCache
  queryKey: TQueryKey
  queryHash: string
  options?: QueryOptions<TQueryFnData, TError, TData, TQueryKey>
  defaultOptions?: QueryOptions<TQueryFnData, TError, TData, TQueryKey>
  state?: QueryState<TData, TError>
}

export interface QueryState<TData = unknown, TError = DefaultError> {
  data: TData | undefined
  dataUpdateCount: number
  dataUpdatedAt: number
  error: TError | null
  errorUpdateCount: number
  errorUpdatedAt: number
  fetchFailureCount: number
  fetchFailureReason: TError | null
  fetchMeta: FetchMeta | null
  isInvalidated: boolean
  status: QueryStatus
  fetchStatus: FetchStatus
}

export interface FetchContext<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey = QueryKey,
> {
  fetchFn: () => unknown | Promise<unknown>
  fetchOptions?: FetchOptions
  signal: AbortSignal
  options: QueryOptions<TQueryFnData, TError, TData, any>
  queryKey: TQueryKey
  state: QueryState<TData, TError>
}

export interface QueryBehavior<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> {
  onFetch: (
    context: FetchContext<TQueryFnData, TError, TData, TQueryKey>,
    query: Query,
  ) => void
}

export type FetchDirection = 'forward' | 'backward'

export interface FetchMeta {
  fetchMore?: { direction: FetchDirection }
}

export interface FetchOptions {
  cancelRefetch?: boolean
  meta?: FetchMeta
}

interface FailedAction<TError> {
  type: 'failed'
  failureCount: number
  error: TError
}

interface FetchAction {
  type: 'fetch'
  meta?: FetchMeta
}

interface SuccessAction<TData> {
  data: TData | undefined
  type: 'success'
  dataUpdatedAt?: number
  manual?: boolean
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
  state: Partial<QueryState<TData, TError>>
  setStateOptions?: SetStateOptions
}

export type Action<TData, TError> =
  | ContinueAction
  | ErrorAction<TError>
  | FailedAction<TError>
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
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends Removable {
  queryKey: TQueryKey
  queryHash: string
  options!: QueryOptions<TQueryFnData, TError, TData, TQueryKey>
  state: QueryState<TData, TError>
  isFetchingOptimistic?: boolean

  #initialState: QueryState<TData, TError>
  #revertState?: QueryState<TData, TError>
  #cache: QueryCache
  #retryer?: Retryer<TData>
  observers: Array<QueryObserver<any, any, any, any, any>>
  #defaultOptions?: QueryOptions<TQueryFnData, TError, TData, TQueryKey>
  #abortSignalConsumed: boolean

  constructor(config: QueryConfig<TQueryFnData, TError, TData, TQueryKey>) {
    super()

    this.#abortSignalConsumed = false
    this.#defaultOptions = config.defaultOptions
    this.setOptions(config.options)
    this.observers = []
    this.#cache = config.cache
    this.queryKey = config.queryKey
    this.queryHash = config.queryHash
    this.#initialState = config.state || getDefaultState(this.options)
    this.state = this.#initialState
    this.scheduleGc()
  }
  get meta(): QueryMeta | undefined {
    return this.options.meta
  }

  setOptions(
    options?: QueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  ): void {
    this.options = { ...this.#defaultOptions, ...options }

    this.updateGcTime(this.options.gcTime)
  }

  protected optionalRemove() {
    if (!this.observers.length && this.state.fetchStatus === 'idle') {
      this.#cache.remove(this)
    }
  }

  setData(
    newData: TData,
    options?: SetDataOptions & { manual: boolean },
  ): TData {
    const data = replaceData(this.state.data, newData, this.options)

    // Set data and mark it as cached
    this.#dispatch({
      data,
      type: 'success',
      dataUpdatedAt: options?.updatedAt,
      manual: options?.manual,
    })

    return data
  }

  setState(
    state: Partial<QueryState<TData, TError>>,
    setStateOptions?: SetStateOptions,
  ): void {
    this.#dispatch({ type: 'setState', state, setStateOptions })
  }

  cancel(options?: CancelOptions): Promise<void> {
    const promise = this.#retryer?.promise
    this.#retryer?.cancel(options)
    return promise ? promise.then(noop).catch(noop) : Promise.resolve()
  }

  destroy(): void {
    super.destroy()

    this.cancel({ silent: true })
  }

  reset(): void {
    this.destroy()
    this.setState(this.#initialState)
  }

  isActive(): boolean {
    return this.observers.some((observer) => observer.options.enabled !== false)
  }

  isDisabled(): boolean {
    return this.getObserversCount() > 0 && !this.isActive()
  }

  isStale(): boolean {
    if (this.state.isInvalidated) {
      return true
    }

    if (this.getObserversCount() > 0) {
      return this.observers.some(
        (observer) => observer.getCurrentResult().isStale,
      )
    }

    return this.state.data === undefined
  }

  isStaleByTime(staleTime = 0): boolean {
    return (
      this.state.isInvalidated ||
      this.state.data === undefined ||
      !timeUntilStale(this.state.dataUpdatedAt, staleTime)
    )
  }

  onFocus(): void {
    const observer = this.observers.find((x) => x.shouldFetchOnWindowFocus())

    observer?.refetch({ cancelRefetch: false })

    // Continue fetch if currently paused
    this.#retryer?.continue()
  }

  onOnline(): void {
    const observer = this.observers.find((x) => x.shouldFetchOnReconnect())

    observer?.refetch({ cancelRefetch: false })

    // Continue fetch if currently paused
    this.#retryer?.continue()
  }

  addObserver(observer: QueryObserver<any, any, any, any, any>): void {
    if (!this.observers.includes(observer)) {
      this.observers.push(observer)

      // Stop the query from being garbage collected
      this.clearGcTimeout()

      this.#cache.notify({ type: 'observerAdded', query: this, observer })
    }
  }

  removeObserver(observer: QueryObserver<any, any, any, any, any>): void {
    if (this.observers.includes(observer)) {
      this.observers = this.observers.filter((x) => x !== observer)

      if (!this.observers.length) {
        // If the transport layer does not support cancellation
        // we'll let the query continue so the result can be cached
        if (this.#retryer) {
          if (this.#abortSignalConsumed) {
            this.#retryer.cancel({ revert: true })
          } else {
            this.#retryer.cancelRetry()
          }
        }

        this.scheduleGc()
      }

      this.#cache.notify({ type: 'observerRemoved', query: this, observer })
    }
  }

  getObserversCount(): number {
    return this.observers.length
  }

  invalidate(): void {
    if (!this.state.isInvalidated) {
      this.#dispatch({ type: 'invalidate' })
    }
  }

  fetch(
    options?: QueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    fetchOptions?: FetchOptions,
  ): Promise<TData> {
    if (this.state.fetchStatus !== 'idle') {
      if (this.state.data !== undefined && fetchOptions?.cancelRefetch) {
        // Silently cancel current fetch if the user wants to cancel refetch
        this.cancel({ silent: true })
      } else if (this.#retryer) {
        // make sure that retries that were potentially cancelled due to unmounts can continue
        this.#retryer.continueRetry()
        // Return current promise if we are already fetching
        return this.#retryer.promise
      }
    }

    // Update config if passed, otherwise the config from the last execution is used
    if (options) {
      this.setOptions(options)
    }

    // Use the options from the first observer with a query function if no function is found.
    // This can happen when the query is hydrated or created with setQueryData.
    if (!this.options.queryFn) {
      const observer = this.observers.find((x) => x.options.queryFn)
      if (observer) {
        this.setOptions(observer.options)
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      if (!Array.isArray(this.options.queryKey)) {
        console.error(
          `As of v4, queryKey needs to be an Array. If you are using a string like 'repoData', please change it to an Array, e.g. ['repoData']`,
        )
      }
    }

    const abortController = new AbortController()

    // Create query function context
    const queryFnContext: OmitKeyof<
      QueryFunctionContext<TQueryKey>,
      'signal'
    > = {
      queryKey: this.queryKey,
      meta: this.meta,
    }

    // Adds an enumerable signal property to the object that
    // which sets abortSignalConsumed to true when the signal
    // is read.
    const addSignalProperty = (object: unknown) => {
      Object.defineProperty(object, 'signal', {
        enumerable: true,
        get: () => {
          this.#abortSignalConsumed = true
          return abortController.signal
        },
      })
    }

    addSignalProperty(queryFnContext)

    // Create fetch function
    const fetchFn = () => {
      if (process.env.NODE_ENV !== 'production') {
        if (this.options.queryFn === skipToken) {
          console.error(
            `Attempted to invoke queryFn when set to skipToken. This is likely a configuration error. Query hash: '${this.options.queryHash}'`,
          )
        }
      }

      if (!this.options.queryFn || this.options.queryFn === skipToken) {
        return Promise.reject(
          new Error(`Missing queryFn: '${this.options.queryHash}'`),
        )
      }

      this.#abortSignalConsumed = false
      if (this.options.persister) {
        return this.options.persister(
          this.options.queryFn,
          queryFnContext as QueryFunctionContext<TQueryKey>,
          this as unknown as Query,
        )
      }

      return this.options.queryFn(
        queryFnContext as QueryFunctionContext<TQueryKey>,
      )
    }

    // Trigger behavior hook
    const context: OmitKeyof<
      FetchContext<TQueryFnData, TError, TData, TQueryKey>,
      'signal'
    > = {
      fetchOptions,
      options: this.options,
      queryKey: this.queryKey,
      state: this.state,
      fetchFn,
    }

    addSignalProperty(context)

    this.options.behavior?.onFetch(
      context as FetchContext<TQueryFnData, TError, TData, TQueryKey>,
      this as unknown as Query,
    )

    // Store state in case the current fetch needs to be reverted
    this.#revertState = this.state

    // Set to fetching state if not already in it
    if (
      this.state.fetchStatus === 'idle' ||
      this.state.fetchMeta !== context.fetchOptions?.meta
    ) {
      this.#dispatch({ type: 'fetch', meta: context.fetchOptions?.meta })
    }

    const onError = (error: TError | { silent?: boolean }) => {
      // Optimistically update state if needed
      if (!(isCancelledError(error) && error.silent)) {
        this.#dispatch({
          type: 'error',
          error: error as TError,
        })
      }

      if (!isCancelledError(error)) {
        // Notify cache callback
        this.#cache.config.onError?.(
          error as any,
          this as Query<any, any, any, any>,
        )
        this.#cache.config.onSettled?.(
          this.state.data,
          error as any,
          this as Query<any, any, any, any>,
        )
      }

      if (!this.isFetchingOptimistic) {
        // Schedule query gc after fetching
        this.scheduleGc()
      }
      this.isFetchingOptimistic = false
    }

    // Try to fetch the data
    this.#retryer = createRetryer({
      fn: context.fetchFn as () => Promise<TData>,
      abort: abortController.abort.bind(abortController),
      onSuccess: (data) => {
        if (data === undefined) {
          if (process.env.NODE_ENV !== 'production') {
            console.error(
              `Query data cannot be undefined. Please make sure to return a value other than undefined from your query function. Affected query key: ${this.queryHash}`,
            )
          }
          onError(new Error(`${this.queryHash} data is undefined`) as any)
          return
        }

        this.setData(data)

        // Notify cache callback
        this.#cache.config.onSuccess?.(data, this as Query<any, any, any, any>)
        this.#cache.config.onSettled?.(
          data,
          this.state.error as any,
          this as Query<any, any, any, any>,
        )

        if (!this.isFetchingOptimistic) {
          // Schedule query gc after fetching
          this.scheduleGc()
        }
        this.isFetchingOptimistic = false
      },
      onError,
      onFail: (failureCount, error) => {
        this.#dispatch({ type: 'failed', failureCount, error })
      },
      onPause: () => {
        this.#dispatch({ type: 'pause' })
      },
      onContinue: () => {
        this.#dispatch({ type: 'continue' })
      },
      retry: context.options.retry,
      retryDelay: context.options.retryDelay,
      networkMode: context.options.networkMode,
      canRun: () => true,
    })

    return this.#retryer.start()
  }

  #dispatch(action: Action<TData, TError>): void {
    const reducer = (
      state: QueryState<TData, TError>,
    ): QueryState<TData, TError> => {
      switch (action.type) {
        case 'failed':
          return {
            ...state,
            fetchFailureCount: action.failureCount,
            fetchFailureReason: action.error,
          }
        case 'pause':
          return {
            ...state,
            fetchStatus: 'paused',
          }
        case 'continue':
          return {
            ...state,
            fetchStatus: 'fetching',
          }
        case 'fetch':
          return {
            ...state,
            ...fetchState(state.data, this.options),
            fetchMeta: action.meta ?? null,
          }
        case 'success':
          return {
            ...state,
            data: action.data,
            dataUpdateCount: state.dataUpdateCount + 1,
            dataUpdatedAt: action.dataUpdatedAt ?? Date.now(),
            error: null,
            isInvalidated: false,
            status: 'success',
            ...(!action.manual && {
              fetchStatus: 'idle',
              fetchFailureCount: 0,
              fetchFailureReason: null,
            }),
          }
        case 'error':
          const error = action.error as unknown

          if (isCancelledError(error) && error.revert && this.#revertState) {
            return { ...this.#revertState, fetchStatus: 'idle' }
          }

          return {
            ...state,
            error: error as TError,
            errorUpdateCount: state.errorUpdateCount + 1,
            errorUpdatedAt: Date.now(),
            fetchFailureCount: state.fetchFailureCount + 1,
            fetchFailureReason: error as TError,
            fetchStatus: 'idle',
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
      }
    }

    this.state = reducer(this.state)

    notifyManager.batch(() => {
      this.observers.forEach((observer) => {
        observer.onQueryUpdate()
      })

      this.#cache.notify({ query: this, type: 'updated', action })
    })
  }
}

export function fetchState<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey,
>(
  data: TData | undefined,
  options: QueryOptions<TQueryFnData, TError, TData, TQueryKey>,
) {
  return {
    fetchFailureCount: 0,
    fetchFailureReason: null,
    fetchStatus: canFetch(options.networkMode) ? 'fetching' : 'paused',
    ...(data === undefined &&
      ({
        error: null,
        status: 'pending',
      } as const)),
  } as const
}

function getDefaultState<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey,
>(
  options: QueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): QueryState<TData, TError> {
  const data =
    typeof options.initialData === 'function'
      ? (options.initialData as InitialDataFunction<TData>)()
      : options.initialData

  const hasData = data !== undefined

  const initialDataUpdatedAt = hasData
    ? typeof options.initialDataUpdatedAt === 'function'
      ? (options.initialDataUpdatedAt as () => number | undefined)()
      : options.initialDataUpdatedAt
    : 0

  return {
    data,
    dataUpdateCount: 0,
    dataUpdatedAt: hasData ? initialDataUpdatedAt ?? Date.now() : 0,
    error: null,
    errorUpdateCount: 0,
    errorUpdatedAt: 0,
    fetchFailureCount: 0,
    fetchFailureReason: null,
    fetchMeta: null,
    isInvalidated: false,
    status: hasData ? 'success' : 'pending',
    fetchStatus: 'idle',
  }
}
