import {
  isServer,
  functionalUpdate,
  cancelledError,
  isDocumentVisible,
  noop,
  Console,
  getStatusProps,
  shallowEqual,
  Updater,
} from './utils'
import { QueryInstance, OnStateUpdateFunction } from './queryInstance'
import {
  ArrayQueryKey,
  InfiniteQueryConfig,
  InitialDataFunction,
  IsFetchingMoreValue,
  QueryConfig,
  QueryFunction,
  QueryStatus,
} from './types'
import { QueryCache } from './queryCache'

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
  isFetchingMore?: IsFetchingMoreValue
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
  updater: Updater<TResult | undefined, TResult>
  isStale: boolean
}

interface ErrorAction<TError> {
  type: ActionType.Error
  cancelled: boolean
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
  queryCache: QueryCache
  queryKey: ArrayQueryKey
  queryHash: string
  config: QueryConfig<TResult, TError>
  instances: QueryInstance<TResult, TError>[]
  state: QueryState<TResult, TError>
  shouldContinueRetryOnFocus?: boolean
  promise?: Promise<TResult | undefined>

  private fetchMoreVariable?: unknown
  private pageVariables?: ArrayQueryKey[]
  private cacheTimeout?: number
  private retryTimeout?: number
  private staleTimeout?: number
  private cancelPromises?: () => void
  private cancelled?: typeof cancelledError | null
  private notifyGlobalListeners: (query: Query<TResult, TError>) => void

  constructor(init: QueryInitConfig<TResult, TError>) {
    this.config = init.config
    this.queryCache = init.queryCache
    this.queryKey = init.queryKey
    this.queryHash = init.queryHash
    this.notifyGlobalListeners = init.notifyGlobalListeners
    this.instances = []
    this.state = getDefaultState(init.config)

    if (init.config.infinite) {
      const infiniteConfig = init.config as InfiniteQueryConfig<TResult, TError>
      const infiniteData = (this.state.data as unknown) as TResult[] | undefined

      if (
        typeof infiniteData !== 'undefined' &&
        typeof this.state.canFetchMore === 'undefined'
      ) {
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
  }

  private dispatch(action: Action<TResult, TError>): void {
    const newState = queryReducer(this.state, action)

    // Only update state if something has changed
    if (!shallowEqual(this.state, newState)) {
      this.state = newState
      this.instances.forEach(d => d.onStateUpdate(newState, action))
      this.notifyGlobalListeners(this)
    }
  }

  scheduleStaleTimeout(): void {
    if (isServer) {
      return
    }

    this.clearStaleTimeout()

    if (this.state.isStale) {
      return
    }

    if (this.config.staleTime === Infinity) {
      return
    }

    this.staleTimeout = setTimeout(() => {
      this.invalidate()
    }, this.config.staleTime)
  }

  invalidate(): void {
    this.clearStaleTimeout()

    if (!this.queryCache.queries[this.queryHash]) {
      return
    }

    if (this.state.isStale) {
      return
    }

    this.dispatch({ type: ActionType.MarkStale })
  }

  scheduleGarbageCollection(): void {
    this.clearCacheTimeout()

    if (!this.queryCache.queries[this.queryHash]) {
      return
    }

    if (this.config.cacheTime === Infinity) {
      return
    }

    this.cacheTimeout = setTimeout(
      () => {
        this.clear()
      },
      typeof this.state.data === 'undefined' &&
        this.state.status !== QueryStatus.Error
        ? 0
        : this.config.cacheTime
    )
  }

  async refetch(): Promise<void> {
    try {
      await this.fetch()
    } catch (error) {
      Console.error(error)
    }
  }

  heal(): void {
    // Stop the query from being garbage collected
    this.clearCacheTimeout()

    // Mark the query as not cancelled
    this.cancelled = null
  }

  cancel(): void {
    this.cancelled = cancelledError

    if (this.cancelPromises) {
      this.cancelPromises()
    }

    delete this.promise
  }

  clearIntervals(): void {
    this.instances.forEach(instance => {
      instance.clearInterval()
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

  private clearRetryTimeout() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
      this.retryTimeout = undefined
    }
  }

  private setState(
    updater: Updater<QueryState<TResult, TError>, QueryState<TResult, TError>>
  ): void {
    this.dispatch({ type: ActionType.SetState, updater })
  }

  setData(updater: Updater<TResult | undefined, TResult>): void {
    const isStale = this.config.staleTime === 0
    // Set data and mark it as cached
    this.dispatch({
      type: ActionType.Success,
      updater,
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
    this.clearRetryTimeout()
    this.clearIntervals()
    this.cancel()
    delete this.queryCache.queries[this.queryHash]
    this.notifyGlobalListeners(this)
  }

  subscribe(
    onStateUpdate?: OnStateUpdateFunction<TResult, TError>
  ): QueryInstance<TResult, TError> {
    const instance = new QueryInstance(this, onStateUpdate)
    this.instances.push(instance)
    this.heal()
    return instance
  }

  // Set up the core fetcher function
  private async tryFetchData(
    fn: QueryFunction<TResult>,
    args: ArrayQueryKey
  ): Promise<TResult> {
    try {
      // Perform the query
      const promiseOrValue = fn(...this.config.queryFnParamsFilter!(args))

      this.cancelPromises = () => (promiseOrValue as any)?.cancel?.()

      const data = await promiseOrValue
      delete this.shouldContinueRetryOnFocus

      delete this.cancelPromises
      if (this.cancelled) throw this.cancelled

      return data
    } catch (error) {
      delete this.cancelPromises
      if (this.cancelled) throw this.cancelled

      // Do we need to retry the request?
      if (
        this.config.retry === true ||
        this.state.failureCount < this.config.retry! ||
        (typeof this.config.retry === 'function' &&
          this.config.retry(this.state.failureCount, error))
      ) {
        // If we retry, increase the failureCount
        this.dispatch({ type: ActionType.Failed })

        // Only retry if the document is visible
        if (!isDocumentVisible()) {
          // set this flag to continue retries on focus
          this.shouldContinueRetryOnFocus = true
          // Resolve a
          return new Promise(noop)
        }

        delete this.shouldContinueRetryOnFocus

        // Determine the retryDelay
        const delay = functionalUpdate(
          this.config.retryDelay,
          this.state.failureCount
        )

        // Return a new promise with the retry
        return await new Promise((resolve, reject) => {
          // Keep track of the retry timeout
          this.retryTimeout = setTimeout(async () => {
            if (this.cancelled) return reject(this.cancelled)

            try {
              const data = await this.tryFetchData(fn, args)
              if (this.cancelled) return reject(this.cancelled)
              resolve(data)
            } catch (error) {
              if (this.cancelled) return reject(this.cancelled)
              reject(error)
            }
          }, delay)
        })
      }

      throw error
    }
  }

  async fetch(options?: FetchOptions): Promise<TResult | undefined> {
    let queryFn = this.config.queryFn

    if (!queryFn) {
      return
    }

    // If we are already fetching, return current promise
    if (this.promise) {
      return this.promise
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
      // If there are any retries pending for this query, kill them
      this.cancelled = null

      try {
        // Set up the query refreshing state
        this.dispatch({ type: ActionType.Fetch })

        // Try to get the data
        const data = await this.tryFetchData(queryFn!, this.queryKey)

        this.setData(old => (this.config.isDataEqual!(old, data) ? old! : data))

        delete this.promise

        return data
      } catch (error) {
        this.dispatch({
          type: ActionType.Error,
          cancelled: error === this.cancelled,
          error,
        })

        delete this.promise

        if (error !== this.cancelled) {
          throw error
        }

        return
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
        data: functionalUpdate(action.updater, state.data),
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
        failureCount: state.failureCount + 1,
        isFetched: true,
        isFetching: false,
        isStale: true,
        ...(!action.cancelled && {
          ...getStatusProps(QueryStatus.Error),
          error: action.error,
          throwInErrorBoundary: true,
        }),
      }
    case ActionType.SetState:
      return functionalUpdate(action.updater, state)
    default:
      return state
  }
}
