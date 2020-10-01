import {
  QueryFilters,
  getQueryKeyHashFn,
  matchQuery,
  parseFilterArgs,
} from './utils'
import { Query } from './query'
import type { QueryKey, QueryOptions } from './types'
import { notifyManager } from './notifyManager'

// TYPES

interface QueryHashMap {
  [hash: string]: Query<any, any>
}

type QueryCacheListener = (query?: Query) => void

// CLASS

export class QueryCache {
  private listeners: QueryCacheListener[]
  private queries: Query<any, any>[]
  private queriesMap: QueryHashMap

  constructor() {
    this.listeners = []
    this.queries = []
    this.queriesMap = {}
  }

  build<TData, TError, TQueryFnData>(
    options: QueryOptions<TData, TError, TQueryFnData>
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
        options,
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
    if (this.queriesMap[query.queryHash]) {
      query.destroy()
      delete this.queriesMap[query.queryHash]
      this.queries = this.queries.filter(x => x !== query)
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
    return filters && Object.keys(filters).length > 0
      ? this.queries.filter(query => matchQuery(filters, query))
      : this.queries
  }

  subscribe(listener: QueryCacheListener): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(x => x !== listener)
    }
  }

  notify(query?: Query<any, any>) {
    notifyManager.batch(() => {
      this.listeners.forEach(listener => {
        notifyManager.schedule(() => {
          listener(query)
        })
      })
    })
  }
}
