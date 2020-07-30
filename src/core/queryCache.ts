import {
  isServer,
  getQueryArgs,
  deepIncludes,
  Console,
  isObject,
  Updater,
} from './utils'
import { defaultConfigRef, ReactQueryConfigRef } from './config'
import { Query } from './query'
import {
  QueryConfig,
  QueryKey,
  QueryKeyWithoutObject,
  ReactQueryConfig,
  QueryKeyWithoutArray,
  QueryKeyWithoutObjectAndArray,
  TupleQueryFunction,
  TupleQueryKey,
} from './types'
import { QueryInstance } from './queryInstance'

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

export interface PrefetchQueryObjectConfig<
  TResult,
  TError,
  TKey extends TupleQueryKey
> {
  queryKey: QueryKey
  queryFn?: TupleQueryFunction<TResult, TKey>
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
  private configRef: ReactQueryConfigRef
  private globalListeners: QueryCacheListener[]

  constructor(config?: QueryCacheConfig) {
    this.config = config || {}

    // A frozen cache does not add new queries to the cache
    this.globalListeners = []

    this.configRef = this.config.defaultConfig
      ? {
          current: {
            shared: {
              ...defaultConfigRef.current.shared,
              ...this.config.defaultConfig.shared,
            },
            queries: {
              ...defaultConfigRef.current.queries,
              ...this.config.defaultConfig.queries,
            },
            mutations: {
              ...defaultConfigRef.current.mutations,
              ...this.config.defaultConfig.mutations,
            },
          },
        }
      : defaultConfigRef

    this.queries = {}
    this.isFetching = 0
  }

  private notifyGlobalListeners(query?: Query<any, any>) {
    this.isFetching = Object.values(this.queries).reduce(
      (acc, query) => (query.state.isFetching ? acc + 1 : acc),
      0
    )

    this.globalListeners.forEach(d => d(queryCache, query))
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
      const [queryHash, queryKey] = this.configRef.current.queries!
        .queryKeySerializerFn!(predicate)

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
          if (query.instances.length) {
            if (
              refetchActive &&
              query.instances.some(instance => instance.config.enabled)
            ) {
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
    queryConfig: QueryConfig<TResult, TError> = {}
  ): Query<TResult, TError> {
    const config = {
      ...this.configRef.current.shared!,
      ...this.configRef.current.queries!,
      ...queryConfig,
    } as QueryConfig<TResult, TError>

    const [queryHash, queryKey] = config.queryKeySerializerFn!(userQueryKey)

    let query

    if (this.queries[queryHash]) {
      query = this.queries[queryHash] as Query<TResult, TError>
      query.config = config
    }

    if (!query) {
      query = new Query<TResult, TError>({
        queryCache,
        queryKey,
        queryHash,
        config,
        notifyGlobalListeners: query => {
          this.notifyGlobalListeners(query)
        },
      })

      // If the query started with data, schedule
      // a stale timeout
      if (!isServer && query.state.data) {
        query.scheduleStaleTimeout()

        // Simulate a query healing process
        query.heal()
        // Schedule for garbage collection in case
        // nothing subscribes to this query
        query.scheduleGarbageCollection()
      }

      if (!this.config.frozen) {
        this.queries[queryHash] = query

        if (isServer) {
          this.notifyGlobalListeners()
        } else {
          // Here, we setTimeout so as to not trigger
          // any setState's in parent components in the
          // middle of the render phase.
          setTimeout(() => {
            this.notifyGlobalListeners()
          })
        }
      }
    }

    query.fallbackInstance = {
      config: {
        onSuccess: query.config.onSuccess,
        onError: query.config.onError,
        onSettled: query.config.onSettled,
      },
    } as QueryInstance<TResult, TError>

    return query
  }

  // Parameter syntax with optional prefetch options
  async prefetchQuery<TResult, TError, TKey extends QueryKeyWithoutObject>(
    queryKey: TKey,
    options?: PrefetchQueryOptions
  ): Promise<TResult | undefined>

  // Parameter syntax with config and optional prefetch options
  async prefetchQuery<TResult, TError, TKey extends QueryKeyWithoutObject>(
    queryKey: TKey,
    config: QueryConfig<TResult, TError>,
    options?: PrefetchQueryOptions
  ): Promise<TResult | undefined>

  // Parameter syntax with query function and optional prefetch options
  async prefetchQuery<
    TResult,
    TError,
    TKey extends QueryKeyWithoutObjectAndArray
  >(
    queryKey: TKey,
    queryFn: TupleQueryFunction<TResult, [TKey]>,
    options?: PrefetchQueryOptions
  ): Promise<TResult | undefined>

  async prefetchQuery<TResult, TError, TKey extends TupleQueryKey>(
    queryKey: TKey,
    queryFn: TupleQueryFunction<TResult, TKey>,
    options?: PrefetchQueryOptions
  ): Promise<TResult | undefined>

  // Parameter syntax with query function, config and optional prefetch options
  async prefetchQuery<
    TResult,
    TError,
    TKey extends QueryKeyWithoutObjectAndArray
  >(
    queryKey: TKey,
    queryFn: TupleQueryFunction<TResult, [TKey]>,
    queryConfig: QueryConfig<TResult, TError>,
    options?: PrefetchQueryOptions
  ): Promise<TResult | undefined>

  async prefetchQuery<TResult, TError, TKey extends TupleQueryKey>(
    queryKey: TKey,
    queryFn: TupleQueryFunction<TResult, TKey>,
    queryConfig: QueryConfig<TResult, TError>,
    options?: PrefetchQueryOptions
  ): Promise<TResult | undefined>

  // Object syntax
  async prefetchQuery<TResult, TError, TKey extends QueryKeyWithoutArray>(
    config: PrefetchQueryObjectConfig<TResult, TError, [TKey]>
  ): Promise<TResult | undefined>

  async prefetchQuery<TResult, TError, TKey extends TupleQueryKey>(
    config: PrefetchQueryObjectConfig<TResult, TError, TKey>
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
    config: QueryConfig<TResult, TError> = {}
  ) {
    let query = this.getQuery<TResult, TError>(queryKey)

    if (!query) {
      query = this.buildQuery<TResult, TError>(queryKey, config)
    }

    query.setData(updater)
  }
}

export const queryCache = makeQueryCache({ frozen: isServer })

export const queryCaches = [queryCache]

export function makeQueryCache(config?: QueryCacheConfig) {
  return new QueryCache(config)
}
