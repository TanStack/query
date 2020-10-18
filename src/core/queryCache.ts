import { getQueryKeyHashFn } from './utils'
import { Query, QueryState } from './query'
import type { QueryOptions } from './types'
import { notifyManager } from './notifyManager'
import { Subscribable } from './subscribable'
import type { Environment } from './environment'

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
    environment: Environment,
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
        options: environment.defaultQueryOptions(options),
        state,
        defaultOptions: environment.getQueryDefaults(queryKey),
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

  notify(query?: Query<any, any>) {
    notifyManager.batch(() => {
      this.listeners.forEach(listener => {
        notifyManager.schedule(() => {
          listener(query)
        })
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
