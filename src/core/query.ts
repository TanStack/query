import {
  CancelledError,
  Console,
  Updater,
  functionalUpdate,
  getStatusProps,
  isCancelable,
  isCancelledError,
  isDocumentVisible,
  isServer,
  replaceEqualDeep,
  sleep,
} from './utils'
import {
  ArrayQueryKey,
  InfiniteQueryConfig,
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
  isStale: boolean
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
  MarkStale = 'MarkStale',
  Fetch = 'Fetch',
  Success = 'Success',
  Error = 'Error',
  SetState = 'SetState',
}

interface FailedAction {
  type: ActionType.Failed
}

interface MarkStaleAction {
  type: ActionType.MarkStale
}

interface FetchAction {
  type: ActionType.Fetch
}

interface SuccessAction<TResult> {
  type: ActionType.Success
  data: TResult | undefined
  isStale: boolean
}

interface ErrorAction<TError> {
  type: ActionType.Error
  error: TError
}

interface SetStateAction<TResult, TError> {
  type: ActionType.SetState
  updater: Updater<QueryState<TResult, TError>, QueryState<TResult, TError>>
}

export type Action<TResult, TError> =
  | ErrorAction<TError>
  | FailedAction
  | FetchAction
  | MarkStaleAction
  | SetStateAction<TResult, TError>
  | SuccessAction<TResult>

// CLASS

export class Query<TResult, TError> {
  queryKey: ArrayQueryKey
  queryHash: string
  config: QueryConfig<TResult, TError>
  observers: QueryObserver<TResult, TError>[]
  state: QueryState<TResult, TError>

  private queryCache: QueryCache
  private promise?: Promise<TResult | undefined>
  private fetchMoreVariable?: unknown
  private pageVariables?: ArrayQueryKey[]
  private cacheTimeout?: number
  private staleTimeout?: number
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

    if (init.config.infinite) {
      const infiniteConfig = init.config as InfiniteQueryConfig<TResult, TError>
      const infiniteData = (this.state.data as unknown) as TResult[] | undefined

      if (typeof infiniteData !== 'undefined') {
        this.fetchMoreVariable = infiniteConfig.getFetchMore(
          infiniteData[infiniteData.length - 1],
          infiniteData
        )
        this.state.canFetchMore = Boolean(this.fetchMoreVariable)
      }

      // Here we seed the pageVariables for the query
      if (!this.pageVariables) {
        this.pageVariables = [[...this.queryKey]]
      }
    }

    // If the query started with data, schedule
    // a stale timeout
    if (!isServer && this.state.data) {
      this.scheduleStaleTimeout()

      // Schedule for garbage collection in case
      // nothing subscribes to this query
      this.scheduleCacheTimeout()
    }
  }

  updateConfig(config: QueryConfig<TResult, TError>): void {
    this.config = config
  }

  private dispatch(action: Action<TResult, TError>): void {
    this.state = queryReducer(this.state, action)
    this.observers.forEach(d => d.onQueryUpdate(this.state, action))
    this.notifyGlobalListeners(this)
  }

  private scheduleStaleTimeout(): void {
    if (isServer) {
      return
    }

    this.clearStaleTimeout()

    if (this.state.isStale || this.config.staleTime === Infinity) {
      return
    }

    this.staleTimeout = setTimeout(() => {
      this.invalidate()
    }, this.config.staleTime)
  }

  invalidate(): void {
    this.clearStaleTimeout()

    if (this.state.isStale) {
      return
    }

    this.dispatch({ type: ActionType.MarkStale })
  }

  private scheduleCacheTimeout(): void {
    if (isServer) {
      return
    }

    this.clearCacheTimeout()

    if (this.config.cacheTime === Infinity) {
      return
    }

    this.cacheTimeout = setTimeout(() => {
      this.clear()
    }, this.config.cacheTime)
  }

  async refetch(options?: RefetchOptions): Promise<TResult | undefined> {
    try {
      return await this.fetch()
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

  continue(): void {
    this.continueFetch?.()
  }

  private clearTimersObservers(): void {
    this.observers.forEach(observer => {
      observer.clearRefetchInterval()
    })
  }

  private clearStaleTimeout() {
    if (this.staleTimeout) {
      clearTimeout(this.staleTimeout)
      this.staleTimeout = undefined
    }
  }

  private clearCacheTimeout() {
    if (this.cacheTimeout) {
      clearTimeout(this.cacheTimeout)
      this.cacheTimeout = undefined
    }
  }

  private setState(
    updater: Updater<QueryState<TResult, TError>, QueryState<TResult, TError>>
  ): void {
    this.dispatch({ type: ActionType.SetState, updater })
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

    const isStale = this.config.staleTime === 0

    // Set data and mark it as cached
    this.dispatch({
      type: ActionType.Success,
      data,
      isStale,
    })

    if (!isStale) {
      // Schedule a fresh invalidation!
      this.scheduleStaleTimeout()
    }
  }

  clear(): void {
    this.clearStaleTimeout()
    this.clearCacheTimeout()
    this.clearTimersObservers()
    this.cancel()
    delete this.queryCache.queries[this.queryHash]
    this.notifyGlobalListeners(this)
  }

  isEnabled(): boolean {
    return this.observers.some(observer => observer.config.enabled)
  }

  shouldRefetchOnWindowFocus(): boolean {
    return (
      this.isEnabled() &&
      this.state.isStale &&
      this.observers.some(observer => observer.config.refetchOnWindowFocus)
    )
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
    this.clearCacheTimeout()
  }

  unsubscribeObserver(
    observer: QueryObserver<TResult, TError>,
    preventGC?: boolean
  ): void {
    this.observers = this.observers.filter(x => x !== observer)

    if (!this.observers.length) {
      // If the transport layer does not support cancellation
      // we'll let the query continue so the result can be cached
      if (this.isTransportCancelable) {
        this.cancel()
      }

      if (!preventGC) {
        // Schedule garbage collection
        this.scheduleCacheTimeout()
      }
    }
  }

  // Set up the core fetcher function
  private async fetchData(
    fn: QueryFunction<TResult>,
    args: ArrayQueryKey
  ): Promise<TResult> {
    return new Promise<TResult>((outerResolve, outerReject) => {
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

      // Filter the query function arguments if needed
      const filter = this.config.queryFnParamsFilter
      args = filter ? filter(args) : args

      // Create loop function
      const run = async () => {
        try {
          // Execute query
          const promiseOrValue = fn(...args)

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
          const { retry, retryDelay } = this.config

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

          // Pause retry if the document is not visible
          if (!isDocumentVisible()) {
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

  async fetch(options?: FetchOptions): Promise<TResult | undefined> {
    // If we are already fetching, return current promise
    if (this.promise) {
      return this.promise
    }

    let queryFn = this.config.queryFn

    if (!queryFn) {
      return
    }

    if (this.config.infinite) {
      const infiniteConfig = this.config as InfiniteQueryConfig<TResult, TError>
      const infiniteData = (this.state.data as unknown) as TResult[] | undefined
      const fetchMore = options?.fetchMore

      const originalQueryFn = queryFn

      queryFn = async () => {
        const data: TResult[] = []
        const pageVariables = this.pageVariables ? [...this.pageVariables] : []
        const rebuiltPageVariables: ArrayQueryKey[] = []

        do {
          const args = pageVariables.shift()!

          if (!data.length) {
            // the first page query doesn't need to be rebuilt
            data.push(await originalQueryFn(...args))
            rebuiltPageVariables.push(args)
          } else {
            // get an up-to-date cursor based on the previous data set

            const nextCursor = infiniteConfig.getFetchMore(
              data[data.length - 1],
              data
            )

            // break early if there's no next cursor
            // otherwise we'll start from the beginning
            // which will cause unwanted duplication
            if (!nextCursor) {
              break
            }

            const pageArgs = [
              // remove the last argument (the previously saved cursor)
              ...args.slice(0, -1),
              nextCursor,
            ] as ArrayQueryKey

            data.push(await originalQueryFn(...pageArgs))
            rebuiltPageVariables.push(pageArgs)
          }
        } while (pageVariables.length)

        this.fetchMoreVariable = infiniteConfig.getFetchMore(
          data[data.length - 1],
          data
        )
        this.state.canFetchMore = Boolean(this.fetchMoreVariable)
        this.pageVariables = rebuiltPageVariables

        return (data as unknown) as TResult
      }

      if (fetchMore) {
        queryFn = async (...args: ArrayQueryKey) => {
          try {
            const { fetchMoreVariable, previous } = fetchMore

            this.setState(old => ({
              ...old,
              isFetchingMore: previous ? 'previous' : 'next',
            }))

            const newArgs = [...args, fetchMoreVariable] as ArrayQueryKey

            if (this.pageVariables) {
              this.pageVariables[previous ? 'unshift' : 'push'](newArgs)
            } else {
              this.pageVariables = [newArgs]
            }

            const newData = await originalQueryFn(...newArgs)

            let data

            if (!infiniteData) {
              data = [newData]
            } else if (previous) {
              data = [newData, ...infiniteData]
            } else {
              data = [...infiniteData, newData]
            }

            this.fetchMoreVariable = infiniteConfig.getFetchMore(newData, data)
            this.state.canFetchMore = Boolean(this.fetchMoreVariable)

            return (data as unknown) as TResult
          } finally {
            this.setState(old => ({
              ...old,
              isFetchingMore: false,
            }))
          }
        }
      }
    }

    this.promise = (async () => {
      try {
        // Set to fetching state if not already in it
        if (!this.state.isFetching) {
          this.dispatch({ type: ActionType.Fetch })
        }

        // Try to get the data
        const data = await this.fetchData(queryFn, this.queryKey)

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

  fetchMore(
    fetchMoreVariable?: unknown,
    options?: FetchMoreOptions
  ): Promise<TResult | undefined> {
    return this.fetch({
      fetchMore: {
        fetchMoreVariable: fetchMoreVariable ?? this.fetchMoreVariable,
        previous: options?.previous || false,
      },
    })
  }
}

function getDefaultState<TResult, TError>(
  config: QueryConfig<TResult, TError>
): QueryState<TResult, TError> {
  const initialData =
    typeof config.initialData === 'function'
      ? (config.initialData as InitialDataFunction<TResult>)()
      : config.initialData

  const hasInitialData = typeof initialData !== 'undefined'

  const isStale =
    !config.enabled ||
    (typeof config.initialStale === 'function'
      ? config.initialStale()
      : config.initialStale ?? !hasInitialData)

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
    isStale,
    data: initialData,
    updatedAt: hasInitialData ? Date.now() : 0,
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
    case ActionType.MarkStale:
      return {
        ...state,
        isStale: true,
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
        failureCount: 0,
      }
    case ActionType.Success:
      return {
        ...state,
        ...getStatusProps(QueryStatus.Success),
        data: action.data,
        error: null,
        isStale: action.isStale,
        isFetched: true,
        isFetching: false,
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
        isStale: true,
        failureCount: state.failureCount + 1,
        throwInErrorBoundary: true,
      }
    case ActionType.SetState:
      return functionalUpdate(action.updater, state)
    default:
      return state
  }
}
