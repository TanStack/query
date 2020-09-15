import {
  Updater,
  deepIncludes,
  getQueryArgs,
  isDocumentVisible,
  isPlainObject,
  isOnline,
  isServer,
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

interface InvalidateQueriesOptions extends QueryPredicateOptions {
  refetchActive?: boolean
  refetchInactive?: boolean
  throwOnError?: boolean
}

interface QueryPredicateOptions {
  exact?: boolean
}

type QueryPredicate = QueryKey | QueryPredicateFn | true

type QueryPredicateFn = (query: Query<unknown, unknown>) => boolean

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

    this.globalListeners.forEach(listener => {
      listener(this, query)
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
    if (predicate === true || typeof predicate === 'undefined') {
      return this.queriesArray
    }

    let predicateFn: QueryPredicateFn

    if (typeof predicate === 'function') {
      predicateFn = predicate as QueryPredicateFn
    } else {
      const resolvedConfig = this.getResolvedQueryConfig(predicate)

      predicateFn = d =>
        options?.exact
          ? d.queryHash === resolvedConfig.queryHash
          : deepIncludes(d.queryKey, resolvedConfig.queryKey)
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

  async invalidateQueries(
    predicate?: QueryPredicate,
    options?: InvalidateQueriesOptions
  ): Promise<void> {
    const { refetchActive = true, refetchInactive = false, throwOnError } =
      options || {}

    try {
      await Promise.all(
        this.getQueries(predicate, options).map(query => {
          const enabled = query.isEnabled()

          if ((enabled && refetchActive) || (!enabled && refetchInactive)) {
            return query.fetch()
          }

          return undefined
        })
      )
    } catch (err) {
      if (throwOnError) {
        throw err
      }
    }
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

  // Parameter syntax with optional prefetch options
  async prefetchQuery<TResult = unknown, TError = unknown>(
    queryKey: QueryKey,
    options?: PrefetchQueryOptions
  ): Promise<TResult | undefined>

  // Parameter syntax with query function and optional prefetch options
  async prefetchQuery<TResult, TError, TArgs extends TypedQueryFunctionArgs>(
    queryKey: QueryKey,
    queryFn: TypedQueryFunction<TResult, TArgs>,
    options?: PrefetchQueryOptions
  ): Promise<TResult | undefined>

  async prefetchQuery<TResult = unknown, TError = unknown>(
    queryKey: QueryKey,
    queryFn: QueryFunction<TResult>,
    options?: PrefetchQueryOptions
  ): Promise<TResult | undefined>

  // Parameter syntax with query function, config and optional prefetch options
  async prefetchQuery<TResult, TError, TArgs extends TypedQueryFunctionArgs>(
    queryKey: QueryKey,
    queryFn: TypedQueryFunction<TResult, TArgs>,
    queryConfig: QueryConfig<TResult, TError>,
    options?: PrefetchQueryOptions
  ): Promise<TResult | undefined>

  async prefetchQuery<TResult = unknown, TError = unknown>(
    queryKey: QueryKey,
    queryFn: QueryFunction<TResult>,
    queryConfig: QueryConfig<TResult, TError>,
    options?: PrefetchQueryOptions
  ): Promise<TResult | undefined>

  // Object syntax
  async prefetchQuery<TResult = unknown, TError = unknown>(
    config: PrefetchQueryObjectConfig<TResult, TError>
  ): Promise<TResult | undefined>

  // Implementation
  async prefetchQuery<TResult, TError>(
    ...args: any[]
  ): Promise<TResult | undefined> {
    if (
      isPlainObject(args[1]) &&
      (args[1].hasOwnProperty('throwOnError') ||
        args[1].hasOwnProperty('force'))
    ) {
      args[3] = args[1]
      args[1] = undefined
      args[2] = undefined
    }

    const [queryKey, config, options] = getQueryArgs<
      TResult,
      TError,
      PrefetchQueryOptions | undefined
    >(args)

    const resolvedConfig = this.getResolvedQueryConfig(queryKey, {
      // https://github.com/tannerlinsley/react-query/issues/652
      retry: false,
      ...config,
    })

    let query = this.getQueryByHash<TResult, TError>(resolvedConfig.queryHash)

    if (!query) {
      query = this.createQuery(resolvedConfig)
    }

    try {
      if (options?.force || query.isStaleByTime(config.staleTime)) {
        await query.fetch(undefined, resolvedConfig)
      }
      return query.state.data
    } catch (error) {
      if (options?.throwOnError) {
        throw error
      }
    }
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
    queryCaches.forEach(queryCache => {
      queryCache.getQueries().forEach(query => {
        query.onInteraction(type)
      })
    })
  }
}
