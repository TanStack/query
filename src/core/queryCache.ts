import {
  QueryFilters,
  getQueryKeyHashFn,
  matchQuery,
  parseFilterArgs,
} from './utils'
import { Query, QueryState } from './query'
import type { QueryKey, QueryOptions } from './types'
import { notifyManager } from './notifyManager'
import type { QueryClient } from './queryClient'
import { Subscribable } from './subscribable'

// TYPES

interface QueryHashMap {
  [hash: string]: Query<any, any>
}

type QueryCacheListener = (query?: Query) => void

// CLASS

export class QueryCache extends Subscribable<QueryCacheListener> {
  private queries: Query<any, any>[]
  private queriesMap: QueryHashMap

  constructor() {
    super()

    this.queries = []
    this.queriesMap = {}
  }

  build<TData, TError, TQueryFnData>(
    client: QueryClient,
    options: QueryOptions<TData, TError, TQueryFnData>,
    state?: QueryState<TData, TError>
  ): Query<TData, TError, TQueryFnData> {
    const hashFn = getQueryKeyHashFn(options)
    const queryKey = options.queryKey!
    const queryHash = options.queryHash ?? hashFn(queryKey)
    let query = this.get<TData, TError, TQueryFnData>(queryHash)

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

  get<TData = unknown, TError = unknown, TQueryFnData = TData>(
    queryHash: string
  ): Query<TData, TError, TQueryFnData> | undefined {
    return this.queriesMap[queryHash]
  }

  getAll(): Query[] {
    return this.queries
  }

  find<TData = unknown, TError = unknown, TQueryFnData = TData>(
    arg1: QueryKey,
    arg2?: QueryFilters
  ): Query<TData, TError, TQueryFnData> | undefined {
    const [filters] = parseFilterArgs(arg1, arg2)
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
