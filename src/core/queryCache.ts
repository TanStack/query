import {
  isServer,
  getQueryArgs,
  deepIncludes,
  Console,
  isObject,
  Updater,
  functionalUpdate,
} from './utils'
import { getDefaultedQueryConfig } from './config'
import { Query } from './query'
import {
  QueryConfig,
  QueryFunction,
  QueryKey,
  ReactQueryConfig,
  TypedQueryFunction,
  TypedQueryFunctionArgs,
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
  queries: QueryHashMap
  isFetching: number

  private config: QueryCacheConfig
  private globalListeners: QueryCacheListener[]

  constructor(config?: QueryCacheConfig) {
    this.config = config || {}

    // A frozen cache does not add new queries to the cache
    this.globalListeners = []

    this.queries = {}
    this.isFetching = 0
  }

  private notifyGlobalListeners(query?: Query<any, any>) {
    this.isFetching = Object.values(this.queries).reduce(
      (acc, query) => (query.state.isFetching ? acc + 1 : acc),
      0
    )

    this.globalListeners.forEach(d => d(this, query))
  }

  getDefaultConfig() {
    return this.config.defaultConfig
  }

  getDefaultedQueryConfig<TResult, TError>(
    config?: QueryConfig<TResult, TError>
  ): QueryConfig<TResult, TError> {
    return getDefaultedQueryConfig(this.getDefaultConfig(), undefined, config, {
      queryCache: this,
    })
  }

  subscribe(listener: QueryCacheListener): () => void {
    this.globalListeners.push(listener)
    return () => {
      this.globalListeners.splice(this.globalListeners.indexOf(listener), 1)
    }
  }

  clear(options?: ClearOptions): void {
    Object.values(this.queries).forEach(query => query.clear())
    this.queries = {}
    if (options?.notify) {
      this.notifyGlobalListeners()
    }
  }

  getQueries<TResult = unknown, TError = unknown>(
    predicate: QueryPredicate,
    options?: QueryPredicateOptions
  ): Query<TResult, TError>[] {
    if (predicate === true) {
      return Object.values(this.queries)
    }

    let predicateFn: QueryPredicateFn

    if (typeof predicate === 'function') {
      predicateFn = predicate as QueryPredicateFn
    } else {
      const config = this.getDefaultedQueryConfig()
      const [queryHash, queryKey] = config.queryKeySerializerFn!(predicate)

      predicateFn = d =>
        options?.exact
          ? d.queryHash === queryHash
          : deepIncludes(d.queryKey, queryKey)
    }

    return Object.values(this.queries).filter(predicateFn)
  }

  getQuery<TResult, TError = unknown>(
    predicate: QueryPredicate
  ): Query<TResult, TError> | undefined {
    return this.getQueries<TResult, TError>(predicate, { exact: true })[0]
  }

  getQueryData<TResult>(predicate: QueryPredicate): TResult | undefined {
    return this.getQuery<TResult>(predicate)?.state.data
  }

  removeQueries(
    predicate: QueryPredicate,
    options?: QueryPredicateOptions
  ): void {
    this.getQueries(predicate, options).forEach(query => query.clear())
  }

  cancelQueries(
    predicate: QueryPredicate,
    options?: QueryPredicateOptions
  ): void {
    this.getQueries(predicate, options).forEach(query => query.cancel())
  }

  async invalidateQueries(
    predicate: QueryPredicate,
    options?: InvalidateQueriesOptions
  ): Promise<void> {
    const { refetchActive = true, refetchInactive = false, throwOnError } =
      options || {}

    try {
      await Promise.all(
        this.getQueries(predicate, options).map(query => {
          if (query.observers.length) {
            if (refetchActive && query.isEnabled()) {
              return query.fetch()
            }
          } else {
            if (refetchInactive) {
              return query.fetch()
            }
          }

          return query.invalidate()
        })
      )
    } catch (err) {
      if (throwOnError) {
        throw err
      }
    }
  }

  resetErrorBoundaries(): void {
    this.getQueries(true).forEach(query => {
      query.state.throwInErrorBoundary = false
    })
  }

  buildQuery<TResult, TError = unknown>(
    userQueryKey: QueryKey,
    queryConfig?: QueryConfig<TResult, TError>
  ): Query<TResult, TError> {
    const config = this.getDefaultedQueryConfig(queryConfig)

    const [queryHash, queryKey] = config.queryKeySerializerFn!(userQueryKey)

    let query

    if (this.queries[queryHash]) {
      query = this.queries[queryHash] as Query<TResult, TError>
      query.updateConfig(config)
    }

    if (!query) {
      query = new Query<TResult, TError>({
        queryCache: this,
        queryKey,
        queryHash,
        config,
        notifyGlobalListeners: query => {
          this.notifyGlobalListeners(query)
        },
      })

      if (!this.config.frozen) {
        this.queries[queryHash] = query
        this.notifyGlobalListeners(query)
      }
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
      isObject(args[1]) &&
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

    // https://github.com/tannerlinsley/react-query/issues/652
    const configWithoutRetry = { retry: false, ...config }

    try {
      const query = this.buildQuery<TResult, TError>(
        queryKey,
        configWithoutRetry
      )
      if (options?.force || query.state.isStale) {
        await query.fetch()
      }
      return query.state.data
    } catch (err) {
      if (options?.throwOnError) {
        throw err
      }
      Console.error(err)
      return
    }
  }

  setQueryData<TResult, TError = unknown>(
    queryKey: QueryKey,
    updater: Updater<TResult | undefined, TResult>,
    config?: QueryConfig<TResult, TError>
  ) {
    const query = this.getQuery<TResult, TError>(queryKey)

    if (query) {
      query.setData(updater)
      return
    }

    this.buildQuery<TResult, TError>(queryKey, {
      initialStale: typeof config?.staleTime === 'undefined',
      initialData: functionalUpdate(updater, undefined),
      ...config,
    })
  }
}

const defaultQueryCache = makeQueryCache({ frozen: isServer })
export { defaultQueryCache as queryCache }
export const queryCaches = [defaultQueryCache]

export function makeQueryCache(config?: QueryCacheConfig) {
  return new QueryCache(config)
}
