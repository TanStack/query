import {
  Updater,
  deepIncludes,
  getQueryArgs,
  isDocumentVisible,
  isOnline,
  isPlainObject,
  isServer,
  noop,
} from './utils'
import { getResolvedQueryConfig } from './config'
import { Query } from './query'
import {
  QueryConfig,
  QueryFunction,
  QueryKey,
  ReactQueryConfig,
  TypedQueryFunction,
  TypedQueryFunctionArgs,
  ResolvedQueryConfig,
} from './types'
import { notifyManager } from './notifyManager'
import { QueryObserver } from './queryObserver'

// TYPES

interface QueryCacheConfig {
  frozen?: boolean
  defaultConfig?: ReactQueryConfig
}

interface ClearOptions {
  notify?: boolean
}

interface PrefetchQueryOptions {
  force?: boolean
  throwOnError?: boolean
}

interface RefetchQueriesOptions extends QueryPredicateOptions {
  throwOnError?: boolean
}

interface InvalidateQueriesOptions extends RefetchQueriesOptions {
  refetchActive?: boolean
  refetchInactive?: boolean
}

interface QueryPredicateOptions {
  active?: boolean
  exact?: boolean
  stale?: boolean
}

type QueryPredicate = QueryKey | QueryPredicateFn | true

type QueryPredicateFn = (query: Query<unknown, unknown>) => boolean

export interface FetchQueryObjectConfig<TResult, TError> {
  queryKey: QueryKey
  queryFn?: QueryFunction<TResult>
  config?: QueryConfig<TResult, TError>
}

export interface PrefetchQueryObjectConfig<TResult, TError> {
  queryKey: QueryKey
  queryFn?: QueryFunction<TResult>
  config?: QueryConfig<TResult, TError>
  options?: PrefetchQueryOptions
}

interface QueryHashMap {
  [hash: string]: Query<any, any>
}

type QueryCacheListener = (
  cache: QueryCache,
  query?: Query<unknown, unknown>
) => void

// CLASS

export class QueryCache {
  isFetching: number

  private config: QueryCacheConfig
  private globalListeners: QueryCacheListener[]
  private queries: QueryHashMap
  private queriesArray: Query<any, any>[]

  constructor(config?: QueryCacheConfig) {
    this.config = config || {}
    this.globalListeners = []
    this.queries = {}
    this.queriesArray = []
    this.isFetching = 0
  }

  notifyGlobalListeners(query?: Query<any, any>) {
    this.isFetching = this.getQueries().reduce(
      (acc, q) => (q.state.isFetching ? acc + 1 : acc),
      0
    )

    notifyManager.batch(() => {
      this.globalListeners.forEach(listener => {
        notifyManager.schedule(() => {
          listener(this, query)
        })
      })
    })
  }

  getDefaultConfig() {
    return this.config.defaultConfig
  }

  getResolvedQueryConfig<TResult, TError>(
    queryKey: QueryKey,
    config?: QueryConfig<TResult, TError>
  ): ResolvedQueryConfig<TResult, TError> {
    return getResolvedQueryConfig(this, queryKey, undefined, config)
  }

  subscribe(listener: QueryCacheListener): () => void {
    this.globalListeners.push(listener)
    return () => {
      this.globalListeners = this.globalListeners.filter(x => x !== listener)
    }
  }

  clear(options?: ClearOptions): void {
    this.removeQueries()
    if (options?.notify) {
      this.notifyGlobalListeners()
    }
  }

  getQueries<TResult = unknown, TError = unknown>(
    predicate?: QueryPredicate,
    options?: QueryPredicateOptions
  ): Query<TResult, TError>[] {
    const anyKey = predicate === true || typeof predicate === 'undefined'

    if (anyKey && !options) {
      return this.queriesArray
    }

    let predicateFn: QueryPredicateFn

    if (typeof predicate === 'function') {
      predicateFn = predicate as QueryPredicateFn
    } else {
      const { exact, active, stale } = options || {}
      const resolvedConfig = this.getResolvedQueryConfig(predicate)

      predicateFn = query => {
        // Check query key if needed
        if (!anyKey) {
          if (exact) {
            // Check if the query key matches exactly
            if (query.queryHash !== resolvedConfig.queryHash) {
              return false
            }
          } else {
            // Check if the query key matches partially
            if (!deepIncludes(query.queryKey, resolvedConfig.queryKey)) {
              return false
            }
          }
        }

        // Check active state if needed
        if (typeof active === 'boolean' && query.isActive() !== active) {
          return false
        }

        // Check stale state if needed
        if (typeof stale === 'boolean' && query.isStale() !== stale) {
          return false
        }

        return true
      }
    }

    return this.queriesArray.filter(predicateFn)
  }

  getQuery<TResult, TError = unknown>(
    predicate: QueryPredicate
  ): Query<TResult, TError> | undefined {
    return this.getQueries<TResult, TError>(predicate, { exact: true })[0]
  }

  getQueryByHash<TResult, TError = unknown>(
    queryHash: string
  ): Query<TResult, TError> | undefined {
    return this.queries[queryHash]
  }

  getQueryData<TResult>(predicate: QueryPredicate): TResult | undefined {
    return this.getQuery<TResult>(predicate)?.state.data
  }

  removeQuery(query: Query<any, any>): void {
    if (this.queries[query.queryHash]) {
      query.destroy()
      delete this.queries[query.queryHash]
      this.queriesArray = this.queriesArray.filter(x => x !== query)
      this.notifyGlobalListeners(query)
    }
  }

  removeQueries(
    predicate?: QueryPredicate,
    options?: QueryPredicateOptions
  ): void {
    this.getQueries(predicate, options).forEach(query => {
      this.removeQuery(query)
    })
  }

  cancelQueries(
    predicate?: QueryPredicate,
    options?: QueryPredicateOptions
  ): void {
    this.getQueries(predicate, options).forEach(query => {
      query.cancel()
    })
  }

  /**
   * @return Promise resolving to an array with the invalidated queries.
   */
  invalidateQueries(
    predicate?: QueryPredicate,
    options?: InvalidateQueriesOptions
  ): Promise<Query<unknown, unknown>[]> {
    const queries = this.getQueries(predicate, options)

    notifyManager.batch(() => {
      queries.forEach(query => {
        query.invalidate()
      })
    })

    const { refetchActive = true, refetchInactive = false } = options || {}

    if (!refetchInactive && !refetchActive) {
      return Promise.resolve(queries)
    }

    const refetchOptions: RefetchQueriesOptions = { ...options }

    if (refetchActive && !refetchInactive) {
      refetchOptions.active = true
    } else if (refetchInactive && !refetchActive) {
      refetchOptions.active = false
    }

    let promise = this.refetchQueries(predicate, refetchOptions)

    if (!options?.throwOnError) {
      promise = promise.catch(() => queries)
    }

    return promise.then(() => queries)
  }

  /**
   * @return Promise resolving to an array with the refetched queries.
   */
  refetchQueries(
    predicate?: QueryPredicate,
    options?: RefetchQueriesOptions
  ): Promise<Query<unknown, unknown>[]> {
    const promises: Promise<Query<unknown, unknown>>[] = []

    notifyManager.batch(() => {
      this.getQueries(predicate, options).forEach(query => {
        let promise = query.fetch().then(() => query)

        if (!options?.throwOnError) {
          promise = promise.catch(() => query)
        }

        promises.push(promise)
      })
    })

    return Promise.all(promises)
  }

  resetErrorBoundaries(): void {
    this.getQueries().forEach(query => {
      query.state.throwInErrorBoundary = false
    })
  }

  buildQuery<TResult, TError = unknown>(
    queryKey: QueryKey,
    config?: QueryConfig<TResult, TError>
  ): Query<TResult, TError> {
    const resolvedConfig = this.getResolvedQueryConfig(queryKey, config)
    let query = this.getQueryByHash<TResult, TError>(resolvedConfig.queryHash)

    if (!query) {
      query = this.createQuery(resolvedConfig)
    }

    return query
  }

  createQuery<TResult, TError = unknown>(
    config: ResolvedQueryConfig<TResult, TError>
  ): Query<TResult, TError> {
    const query = new Query(config)

    // A frozen cache does not add new queries to the cache
    if (!this.config.frozen) {
      this.queries[query.queryHash] = query
      this.queriesArray.push(query)
      this.notifyGlobalListeners(query)
    }

    return query
  }

  // Parameter syntax
  fetchQuery<TResult = unknown, TError = unknown>(
    queryKey: QueryKey,
    queryConfig?: QueryConfig<TResult, TError>
  ): Promise<TResult>

  // Parameter syntax with query function
  fetchQuery<TResult, TError, TArgs extends TypedQueryFunctionArgs>(
    queryKey: QueryKey,
    queryFn: TypedQueryFunction<TResult, TArgs>,
    queryConfig?: QueryConfig<TResult, TError>
  ): Promise<TResult>

  fetchQuery<TResult = unknown, TError = unknown>(
    queryKey: QueryKey,
    queryFn: QueryFunction<TResult>,
    queryConfig?: QueryConfig<TResult, TError>
  ): Promise<TResult>

  // Object syntax
  fetchQuery<TResult = unknown, TError = unknown>(
    config: FetchQueryObjectConfig<TResult, TError>
  ): Promise<TResult>

  // Implementation
  fetchQuery<TResult, TError>(
    arg1: any,
    arg2?: any,
    arg3?: any
  ): Promise<TResult> {
    const [queryKey, config] = getQueryArgs<TResult, TError>(arg1, arg2, arg3)

    const resolvedConfig = this.getResolvedQueryConfig(queryKey, {
      // https://github.com/tannerlinsley/react-query/issues/652
      retry: false,
      ...config,
    })

    let query = this.getQueryByHash<TResult, TError>(resolvedConfig.queryHash)

    if (!query) {
      query = this.createQuery(resolvedConfig)
    }

    if (!query.isStaleByTime(config.staleTime)) {
      return Promise.resolve(query.state.data as TResult)
    }

    return query.fetch(undefined, resolvedConfig)
  }

  // Parameter syntax with optional prefetch options
  prefetchQuery<TResult = unknown, TError = unknown>(
    queryKey: QueryKey,
    options?: PrefetchQueryOptions
  ): Promise<TResult | undefined>

  // Parameter syntax with query function and optional prefetch options
  prefetchQuery<TResult, TError, TArgs extends TypedQueryFunctionArgs>(
    queryKey: QueryKey,
    queryFn: TypedQueryFunction<TResult, TArgs>,
    options?: PrefetchQueryOptions
  ): Promise<TResult | undefined>

  prefetchQuery<TResult = unknown, TError = unknown>(
    queryKey: QueryKey,
    queryFn: QueryFunction<TResult>,
    options?: PrefetchQueryOptions
  ): Promise<TResult | undefined>

  // Parameter syntax with query function, config and optional prefetch options
  prefetchQuery<TResult, TError, TArgs extends TypedQueryFunctionArgs>(
    queryKey: QueryKey,
    queryFn: TypedQueryFunction<TResult, TArgs>,
    queryConfig: QueryConfig<TResult, TError>,
    options?: PrefetchQueryOptions
  ): Promise<TResult | undefined>

  prefetchQuery<TResult = unknown, TError = unknown>(
    queryKey: QueryKey,
    queryFn: QueryFunction<TResult>,
    queryConfig: QueryConfig<TResult, TError>,
    options?: PrefetchQueryOptions
  ): Promise<TResult | undefined>

  // Object syntax
  prefetchQuery<TResult = unknown, TError = unknown>(
    config: PrefetchQueryObjectConfig<TResult, TError>
  ): Promise<TResult | undefined>

  // Implementation
  prefetchQuery<TResult, TError>(
    arg1: any,
    arg2?: any,
    arg3?: any,
    arg4?: any
  ): Promise<TResult | undefined> {
    if (
      isPlainObject(arg2) &&
      (arg2.hasOwnProperty('throwOnError') || arg2.hasOwnProperty('force'))
    ) {
      arg4 = arg2
      arg2 = undefined
      arg3 = undefined
    }

    const [queryKey, config, options] = getQueryArgs<
      TResult,
      TError,
      PrefetchQueryOptions | undefined
    >(arg1, arg2, arg3, arg4)

    if (options?.force) {
      config.staleTime = 0
    }

    let promise: Promise<TResult | undefined> = this.fetchQuery(
      queryKey,
      config
    )

    if (!options?.throwOnError) {
      promise = promise.catch(noop)
    }

    return promise
  }

  // Parameter syntax
  watchQuery<TResult = unknown, TError = unknown>(
    queryKey: QueryKey,
    queryConfig?: QueryConfig<TResult, TError>
  ): QueryObserver<TResult, TError>

  // Parameter syntax with query function
  watchQuery<TResult, TError, TArgs extends TypedQueryFunctionArgs>(
    queryKey: QueryKey,
    queryFn: TypedQueryFunction<TResult, TArgs>,
    queryConfig?: QueryConfig<TResult, TError>
  ): QueryObserver<TResult, TError>

  watchQuery<TResult = unknown, TError = unknown>(
    queryKey: QueryKey,
    queryFn: QueryFunction<TResult>,
    queryConfig?: QueryConfig<TResult, TError>
  ): QueryObserver<TResult, TError>

  // Implementation
  watchQuery<TResult, TError>(
    arg1: any,
    arg2?: any,
    arg3?: any
  ): QueryObserver<TResult, TError> {
    const [queryKey, config] = getQueryArgs<TResult, TError>(arg1, arg2, arg3)
    const resolvedConfig = this.getResolvedQueryConfig(queryKey, config)
    return new QueryObserver(resolvedConfig)
  }

  setQueryData<TResult, TError = unknown>(
    queryKey: QueryKey,
    updater: Updater<TResult | undefined, TResult>,
    config?: QueryConfig<TResult, TError>
  ) {
    this.buildQuery(queryKey, config).setData(updater)
  }
}

const defaultQueryCache = new QueryCache({ frozen: isServer })
export { defaultQueryCache as queryCache }
export const queryCaches = [defaultQueryCache]

/**
 * @deprecated
 */
export function makeQueryCache(config?: QueryCacheConfig) {
  return new QueryCache(config)
}

export function onVisibilityOrOnlineChange(type: 'focus' | 'online') {
  if (isDocumentVisible() && isOnline()) {
    notifyManager.batch(() => {
      queryCaches.forEach(queryCache => {
        queryCache.getQueries().forEach(query => {
          query.onInteraction(type)
        })
      })
    })
  }
}
