import { notifyManager } from './notifyManager'
import { Query } from './query'
import { defaultQueryOptions, getQueryDefaults } from './queryClient'
import { Subscribable } from './subscribable'
import { hashKeyByOptions } from './utils'
import type { Action as QueryAction, QueryState } from './query'
import type { QueryClient } from './queryClient'
import type { QueryObserver } from './queryObserver'
import type {
  CacheKeyConfig,
  DefaultError,
  NotifyEvent,
  QueryKey,
  QueryOptions,
  WithRequired,
} from './types'

/**
 * Global callbacks that fire for every query handled by a `QueryCache`, regardless of which
 * component or observer triggered it. Unlike `QueryClient`'s `defaultOptions`, which a query can
 * override, these callbacks are always called. Unlike `MutationCacheConfig`'s callbacks, these
 * are fire-and-forget: their return value is not awaited before the query settles.
 */
export interface QueryCacheConfig {
  /**
   * Configures query key comparison and hashing globally.
   * `equalityFn` compares individual values during partial matching and defaults to strict equality.
   * `hashFn` hashes query keys and defaults to `hashKey`.
   */
  queryKey?: CacheKeyConfig<QueryKey>
  /** Called when any query in the cache encounters an error. */
  onError?: (
    error: DefaultError,
    query: Query<unknown, unknown, unknown>,
  ) => void
  /** Called when any query in the cache is successful. */
  onSuccess?: (data: unknown, query: Query<unknown, unknown, unknown>) => void
  /** Called when any query in the cache is settled, either successfully or with an error. */
  onSettled?: (
    data: unknown | undefined,
    error: DefaultError | null,
    query: Query<unknown, unknown, unknown>,
  ) => void
}

/**
 * The event passed to a `QueryCache` subscriber. Fired whenever a query is added or removed from
 * the cache, its state is updated (e.g. via `query.setState` or `removeQueries`), or
 * one of its observers is added, removed, or has its results or options updated.
 */
export type QueryCacheNotifyEvent =
  | NotifyEventQueryAdded
  | NotifyEventQueryRemoved
  | NotifyEventQueryUpdated
  | NotifyEventQueryObserverAdded
  | NotifyEventQueryObserverRemoved
  | NotifyEventQueryObserverResultsUpdated
  | NotifyEventQueryObserverOptionsUpdated

type QueryCacheListener = (event: QueryCacheNotifyEvent) => void

/**
 * The store a `QueryCache` keeps its queries in, keyed by query hash.
 */
export interface QueryStore {
  /**
   * Returns whether a query with the given hash is stored.
   */
  has: (queryHash: string) => boolean
  /**
   * Stores a query under its hash.
   */
  set: (queryHash: string, query: Query) => void
  /**
   * Returns the query with the given hash, if any.
   */
  get: (queryHash: string) => Query | undefined
  /**
   * Removes the query with the given hash.
   */
  delete: (queryHash: string) => void
  /**
   * Returns an iterator over all stored queries.
   */
  values: () => IterableIterator<Query>
}

interface NotifyEventQueryAdded extends NotifyEvent {
  type: 'added'
  query: Query<any, any, any, any>
}

interface NotifyEventQueryRemoved extends NotifyEvent {
  type: 'removed'
  query: Query<any, any, any, any>
}

interface NotifyEventQueryUpdated extends NotifyEvent {
  type: 'updated'
  query: Query<any, any, any, any>
  action: QueryAction<any, any>
}

interface NotifyEventQueryObserverAdded extends NotifyEvent {
  type: 'observerAdded'
  query: Query<any, any, any, any>
  observer: QueryObserver<any, any, any, any, any>
}

interface NotifyEventQueryObserverRemoved extends NotifyEvent {
  type: 'observerRemoved'
  query: Query<any, any, any, any>
  observer: QueryObserver<any, any, any, any, any>
}

interface NotifyEventQueryObserverResultsUpdated extends NotifyEvent {
  type: 'observerResultsUpdated'
  query: Query<any, any, any, any>
}

interface NotifyEventQueryObserverOptionsUpdated extends NotifyEvent {
  type: 'observerOptionsUpdated'
  query: Query<any, any, any, any>
  observer: QueryObserver<any, any, any, any, any>
}

// CLASS

/**
 * The `QueryCache` is the storage mechanism for TanStack Query. It stores all the data, meta
 * information, and state of the queries it contains.
 *
 * Normally, you will not interact with the `QueryCache` directly and instead use a `QueryClient`
 * for a specific cache. You can subscribe to it (inherited from `Subscribable`) to be informed of
 * safe/known updates to the cache, such as queries being added, removed, or updated — updates made
 * outside of the cache's own tracked mechanisms (e.g. mutating a query's state object directly) do
 * not notify subscribers.
 * @example
 * ```ts
 * const unsubscribe = queryCache.subscribe((event) => {
 *   console.log(event.type, event.query)
 * })
 * ```
 */
export class QueryCache extends Subscribable<QueryCacheListener> {
  #queries: QueryStore

  constructor(public config: QueryCacheConfig = {}) {
    super()
    this.#queries = new Map<string, Query>()
  }

  /**
   * Returns the existing `Query` instance for the given options' `queryKey`/`queryHash`, or
   * builds and adds a new one to the cache if none exists yet. Used by framework adapters and
   * plugins (e.g. broadcast/persistence) that need to get-or-create a `Query` directly, bypassing
   * the reactive `QueryObserver` machinery.
   * @param client - The client the query belongs to, used to default its options.
   * @param options - The query options, including the `queryKey`. A new query is created with the
   * options defaulted by {@link defaultQueryOptions}.
   * @param state - The initial state of a newly created query, e.g. when hydrating. Ignored if the
   * query already exists.
   * @returns The existing or newly created query.
   * @example
   * ```ts
   * const queryCache = getQueryCache(queryClient)
   *
   * const query = queryCache.build(queryClient, {
   *   queryKey: ['posts'],
   *   queryFn: fetchPosts,
   * })
   * ```
   */
  build<
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    client: QueryClient,
    options: WithRequired<
      QueryOptions<TQueryFnData, TError, TData, TQueryKey>,
      'queryKey'
    >,
    state?: QueryState<TData, TError>,
  ): Query<TQueryFnData, TError, TData, TQueryKey> {
    const queryKey = options.queryKey
    const queryHash =
      options.queryHash ?? hashKeyByOptions(queryKey, this.config.queryKey)
    let query = this.get<TQueryFnData, TError, TData, TQueryKey>(queryHash)

    if (!query) {
      query = new Query({
        client,
        queryKey,
        queryHash,
        options: defaultQueryOptions(client, options),
        state,
        defaultOptions: getQueryDefaults(client, queryKey),
      })
      this.add(query)
    }

    return query
  }

  /**
   * Adds a query to the cache.
   * @internal
   * @param query - The query to add. If a query with the same hash is already cached, nothing
   * happens.
   */
  add(query: Query<any, any, any, any>): void {
    if (!this.#queries.has(query.queryHash)) {
      this.#queries.set(query.queryHash, query)

      this.notify({
        type: 'added',
        query,
      })
    }
  }

  /**
   * Destroys the given `Query` and removes it from the cache, notifying subscribers with a
   * `'removed'` event. A no-op if the query is no longer the one currently stored under its hash
   * (e.g. it was already replaced). Used by plugins (e.g. the broadcast client) that mirror
   * removals across `QueryCache` instances.
   * @param query - The query to remove.
   * @example
   * ```ts
   * const queryCache = getQueryCache(queryClient)
   * const query = findCachedQuery(queryCache, { queryKey: ['posts'] })
   *
   * if (query) {
   *   queryCache.remove(query)
   * }
   * ```
   */
  remove(query: Query<any, any, any, any>): void {
    const queryInMap = this.#queries.get(query.queryHash)

    if (queryInMap === query) {
      query.destroy()
      this.#queries.delete(query.queryHash)
      this.notify({ type: 'removed', query })
    }
  }

  /**
   * Returns the `Query` instance stored under the given `queryHash`, or `undefined` if none
   * exists. Unlike {@link findCachedQuery}, this looks up by the already-computed hash rather
   * than by `QueryFilters`. Used by plugins (e.g. broadcast/hydration) that already have a hash
   * to look up directly.
   * @param queryHash - The hash of the query to look up.
   * @returns The query stored under the hash, or `undefined`.
   * @example
   * ```ts
   * const queryCache = getQueryCache(queryClient)
   * const queryHash = hashKey(['posts'])
   *
   * const query = queryCache.get(queryHash)
   * ```
   */
  get<
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    queryHash: string,
  ): Query<TQueryFnData, TError, TData, TQueryKey> | undefined {
    return this.#queries.get(queryHash) as
      | Query<TQueryFnData, TError, TData, TQueryKey>
      | undefined
  }

  /**
   * Returns all queries within the cache.
   * @returns Every query in the cache.
   * @example
   * ```ts
   * const queryCache = getQueryCache(queryClient)
   *
   * const queries = queryCache.getAll()
   * ```
   */
  getAll(): Array<Query> {
    return [...this.#queries.values()]
  }

  /**
   * Notifies every cache listener of an event, in one batch.
   * @internal
   * @param event - The event passed to every listener.
   */
  notify(event: QueryCacheNotifyEvent): void {
    notifyManager.batch(() => {
      this.listeners.forEach((listener) => {
        listener(event)
      })
    })
  }

  /**
   * Calls {@link Query#onFocus} on every cached query, in one batch.
   * @internal
   */
  onFocus(): void {
    this.#resume('onFocus')
  }

  /**
   * Calls {@link Query#onOnline} on every cached query, in one batch.
   * @internal
   */
  onOnline(): void {
    this.#resume('onOnline')
  }

  #resume(event: 'onFocus' | 'onOnline'): void {
    notifyManager.batch(() => this.getAll().forEach((query) => query[event]()))
  }
}
