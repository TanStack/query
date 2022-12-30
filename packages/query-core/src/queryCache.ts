import type { QueryFilters } from './utils'
import { hashQueryKeyByOptions, matchQuery, parseFilterArgs } from './utils'
import type { Action, QueryState } from './query'
import { Query } from './query'
import type { QueryKey, QueryOptions } from './types'
import { notifyManager } from './notifyManager'
import type { QueryClient } from './queryClient'
import { Subscribable } from './subscribable'
import type { QueryObserver } from './queryObserver'

// TYPES

export interface QueryStore {
  has: (queryKey: string) => boolean
  set: (queryKey: string, query: Query) => void
  get: (queryKey: string) => Query | undefined
  delete: (queryKey: string) => void
  values: () => IterableIterator<Query>
}

interface QueryCacheConfig {
  experimental_createStore?: (c: QueryCache) => QueryStore
  onError?: (error: unknown, query: Query<unknown, unknown, unknown>) => void
  onSuccess?: (data: unknown, query: Query<unknown, unknown, unknown>) => void
}

interface NotifyEventQueryAdded {
  type: 'added'
  query: Query<any, any, any, any>
}

interface NotifyEventQueryRemoved {
  type: 'removed'
  query: Query<any, any, any, any>
}

interface NotifyEventQueryUpdated {
  type: 'updated'
  query: Query<any, any, any, any>
  action: Action<any, any>
}

interface NotifyEventQueryObserverAdded {
  type: 'observerAdded'
  query: Query<any, any, any, any>
  observer: QueryObserver<any, any, any, any, any>
}

interface NotifyEventQueryObserverRemoved {
  type: 'observerRemoved'
  query: Query<any, any, any, any>
  observer: QueryObserver<any, any, any, any, any>
}

interface NotifyEventQueryObserverResultsUpdated {
  type: 'observerResultsUpdated'
  query: Query<any, any, any, any>
}

interface NotifyEventQueryObserverOptionsUpdated {
  type: 'observerOptionsUpdated'
  query: Query<any, any, any, any>
  observer: QueryObserver<any, any, any, any, any>
}

type QueryCacheNotifyEvent =
  | NotifyEventQueryAdded
  | NotifyEventQueryRemoved
  | NotifyEventQueryUpdated
  | NotifyEventQueryObserverAdded
  | NotifyEventQueryObserverRemoved
  | NotifyEventQueryObserverResultsUpdated
  | NotifyEventQueryObserverOptionsUpdated

type QueryCacheListener = (event: QueryCacheNotifyEvent) => void

// CLASS

export class QueryCache extends Subscribable<QueryCacheListener> {
  private queries: QueryStore

  constructor(public config: QueryCacheConfig = {}) {
    super()
    this.queries =
      config.experimental_createStore?.(this) ?? new Map<string, Query>()

    new Map().set('a', 1)
  }

  build<TQueryFnData, TError, TData, TQueryKey extends QueryKey>(
    client: QueryClient,
    options: QueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    state?: QueryState<TData, TError>,
  ): Query<TQueryFnData, TError, TData, TQueryKey> {
    const queryKey = options.queryKey!
    const queryHash =
      options.queryHash ?? hashQueryKeyByOptions(queryKey, options)
    let query = this.get<TQueryFnData, TError, TData, TQueryKey>(queryHash)

    if (!query) {
      query = new Query({
        cache: this,
        logger: client.getLogger(),
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

  add(query: Query<any, any, any, any>): void {
    if (!this.queries.has(query.queryHash)) {
      this.queries.set(query.queryHash, query)

      this.notify({
        type: 'added',
        query,
      })
    }
  }

  remove(query: Query<any, any, any, any>): void {
    const queryInMap = this.queries.get(query.queryHash)

    if (queryInMap) {
      query.destroy()

      if (queryInMap === query) {
        this.queries.delete(query.queryHash)
      }

      this.notify({ type: 'removed', query })
    }
  }

  clear(): void {
    notifyManager.batch(() => {
      this.getAll().forEach((query) => {
        this.remove(query)
      })
    })
  }

  get<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    queryHash: string,
  ): Query<TQueryFnData, TError, TData, TQueryKey> | undefined {
    return this.queries.get(queryHash) as
      | Query<TQueryFnData, TError, TData, TQueryKey>
      | undefined
  }

  getAll(): Query[] {
    return [...this.queries.values()]
  }

  find<TQueryFnData = unknown, TError = unknown, TData = TQueryFnData>(
    arg1: QueryKey,
    arg2?: QueryFilters,
  ): Query<TQueryFnData, TError, TData> | undefined {
    const [filters] = parseFilterArgs(arg1, arg2)

    if (typeof filters.exact === 'undefined') {
      filters.exact = true
    }

    return this.getAll().find((query) => matchQuery(filters, query)) as
      | Query<TQueryFnData, TError, TData>
      | undefined
  }

  findAll(queryKey?: QueryKey, filters?: QueryFilters): Query[]
  findAll(filters?: QueryFilters): Query[]
  findAll(arg1?: QueryKey | QueryFilters, arg2?: QueryFilters): Query[]
  findAll(arg1?: QueryKey | QueryFilters, arg2?: QueryFilters): Query[] {
    const [filters] = parseFilterArgs(arg1, arg2)
    const queries = this.getAll()
    return Object.keys(filters).length > 0
      ? queries.filter((query) => matchQuery(filters, query))
      : queries
  }

  notify(event: QueryCacheNotifyEvent) {
    notifyManager.batch(() => {
      this.listeners.forEach((listener) => {
        listener(event)
      })
    })
  }

  onFocus(): void {
    notifyManager.batch(() => {
      this.getAll().forEach((query) => {
        query.onFocus()
      })
    })
  }

  onOnline(): void {
    notifyManager.batch(() => {
      this.getAll().forEach((query) => {
        query.onOnline()
      })
    })
  }
}
