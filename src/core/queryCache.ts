import {
  QueryFilters,
  hashQueryKeyByOptions,
  matchQuery,
  parseFilterArgs,
} from './utils'
import { Query, QueryState } from './query'
import type { QueryKey, QueryOptions } from './types'
import { notifyManager } from './notifyManager'
import type { QueryClient } from './queryClient'
import { Subscribable } from './subscribable'

// TYPES

interface QueryCacheConfig {
  onError?: (error: unknown, query: Query<unknown, unknown, unknown>) => void
}

interface QueryHashMap {
  [hash: string]: Query<any, any>
}

type QueryCacheListener = (query?: Query) => void

// CLASS

export class QueryCache extends Subscribable<QueryCacheListener> {
  config: QueryCacheConfig

  private queries: Query<any, any>[]
  private queriesMap: QueryHashMap

  constructor(config?: QueryCacheConfig) {
    super()
    this.config = config || {}
    this.queries = []
    this.queriesMap = {}
  }

  build<TQueryFnData, TError, TData>(
    client: QueryClient,
    options: QueryOptions<TQueryFnData, TError, TData>,
    state?: QueryState<TData, TError>
  ): Query<TQueryFnData, TError, TData> {
    const queryKey = options.queryKey!
    const queryHash =
      options.queryHash ?? hashQueryKeyByOptions(queryKey, options)
    let query = this.get<TQueryFnData, TError, TData>(queryHash)

    if (!query) {
      query = new Query({
        cache: this,
        queryKey,
        queryHash,
        options: client.defaultQueryOptions(options),
        state,
        defaultOptions: client.getQueryDefaults(queryKey),
      })
      this.add(query)
    }

    return query
  }

  add(query: Query<any, any>): void {
    if (!this.queriesMap[query.queryHash]) {
      this.queriesMap[query.queryHash] = query
      this.queries.push(query)
      this.notify(query)
    }
  }

  remove(query: Query<any, any>): void {
    const queryInMap = this.queriesMap[query.queryHash]

    if (queryInMap) {
      query.destroy()

      this.queries = this.queries.filter(x => x !== query)

      if (queryInMap === query) {
        delete this.queriesMap[query.queryHash]
      }

      this.notify(query)
    }
  }

  clear(): void {
    notifyManager.batch(() => {
      this.queries.forEach(query => {
        this.remove(query)
      })
    })
  }

  get<TQueryFnData = unknown, TError = unknown, TData = TQueryFnData>(
    queryHash: string
  ): Query<TQueryFnData, TError, TData> | undefined {
    return this.queriesMap[queryHash]
  }

  getAll(): Query[] {
    return this.queries
  }

  find<TQueryFnData = unknown, TError = unknown, TData = TQueryFnData>(
    arg1: QueryKey,
    arg2?: QueryFilters
  ): Query<TQueryFnData, TError, TData> | undefined {
    const [filters] = parseFilterArgs(arg1, arg2)

    if (typeof filters.exact === 'undefined') {
      filters.exact = true
    }

    return this.queries.find(query => matchQuery(filters, query))
  }

  findAll(queryKey?: QueryKey, filters?: QueryFilters): Query[]
  findAll(filters?: QueryFilters): Query[]
  findAll(arg1?: QueryKey | QueryFilters, arg2?: QueryFilters): Query[]
  findAll(arg1?: QueryKey | QueryFilters, arg2?: QueryFilters): Query[] {
    const [filters] = parseFilterArgs(arg1, arg2)
    return filters
      ? this.queries.filter(query => matchQuery(filters, query))
      : this.queries
  }

  notify(query?: Query<any, any>) {
    notifyManager.batch(() => {
      this.listeners.forEach(listener => {
        listener(query)
      })
    })
  }

  onFocus(): void {
    notifyManager.batch(() => {
      this.queries.forEach(query => {
        query.onFocus()
      })
    })
  }

  onOnline(): void {
    notifyManager.batch(() => {
      this.queries.forEach(query => {
        query.onOnline()
      })
    })
  }
}
