import type { QueryObserverOf, QueryOf, RuntimeBinding } from './binding'
import type { QueryAction } from './query'
import type {
  CacheKeyConfig,
  DefaultError,
  NotifyEvent,
  QueryKey,
} from './types'

/**
 * Global callbacks that fire for every query handled by a `QueryCache`, regardless of which
 * component or observer triggered it. Unlike `QueryClient`'s `defaultOptions`, which a query can
 * override, these callbacks are always called. Unlike `MutationCacheConfig`'s callbacks, these
 * are fire-and-forget: their return value is not awaited before the query settles.
 */
export interface QueryCacheConfig<TRuntime extends RuntimeBinding> {
  /**
   * Configures query key comparison and hashing globally.
   * `equalityFn` compares individual values during partial matching and defaults to strict equality.
   * `hashFn` hashes query keys and defaults to `hashKey`.
   */
  queryKey?: CacheKeyConfig<QueryKey>
  /** Called when any query in the cache encounters an error. */
  onError?: (
    error: DefaultError,
    query: QueryOf<TRuntime, unknown, unknown, unknown>,
  ) => void
  /** Called when any query in the cache is successful. */
  onSuccess?: (
    data: unknown,
    query: QueryOf<TRuntime, unknown, unknown, unknown>,
  ) => void
  /** Called when any query in the cache is settled, either successfully or with an error. */
  onSettled?: (
    data: unknown | undefined,
    error: DefaultError | null,
    query: QueryOf<TRuntime, unknown, unknown, unknown>,
  ) => void
}

export interface NotifyEventQueryAdded<
  TRuntime extends RuntimeBinding,
> extends NotifyEvent {
  type: 'added'
  query: QueryOf<TRuntime, any, any, any, any>
}

export interface NotifyEventQueryRemoved<
  TRuntime extends RuntimeBinding,
> extends NotifyEvent {
  type: 'removed'
  query: QueryOf<TRuntime, any, any, any, any>
}

export interface NotifyEventQueryUpdated<
  TRuntime extends RuntimeBinding,
> extends NotifyEvent {
  type: 'updated'
  query: QueryOf<TRuntime, any, any, any, any>
  action: QueryAction<any, any>
}

export interface NotifyEventQueryObserverAdded<
  TRuntime extends RuntimeBinding,
> extends NotifyEvent {
  type: 'observerAdded'
  query: QueryOf<TRuntime, any, any, any, any>
  observer: QueryObserverOf<TRuntime, any, any, any, any, any>
}

export interface NotifyEventQueryObserverRemoved<
  TRuntime extends RuntimeBinding,
> extends NotifyEvent {
  type: 'observerRemoved'
  query: QueryOf<TRuntime, any, any, any, any>
  observer: QueryObserverOf<TRuntime, any, any, any, any, any>
}

export interface NotifyEventQueryObserverResultsUpdated<
  TRuntime extends RuntimeBinding,
> extends NotifyEvent {
  type: 'observerResultsUpdated'
  query: QueryOf<TRuntime, any, any, any, any>
}

export interface NotifyEventQueryObserverOptionsUpdated<
  TRuntime extends RuntimeBinding,
> extends NotifyEvent {
  type: 'observerOptionsUpdated'
  query: QueryOf<TRuntime, any, any, any, any>
  observer: QueryObserverOf<TRuntime, any, any, any, any, any>
}

/**
 * The event passed to a `QueryCache` subscriber. Fired whenever a query is added or removed from
 * the cache, its state is updated (e.g. via `query.setState` or `queryClient.removeQueries`), or
 * one of its observers is added, removed, or has its results or options updated.
 */
export type QueryCacheNotifyEvent<TRuntime extends RuntimeBinding> =
  | NotifyEventQueryAdded<TRuntime>
  | NotifyEventQueryRemoved<TRuntime>
  | NotifyEventQueryUpdated<TRuntime>
  | NotifyEventQueryObserverAdded<TRuntime>
  | NotifyEventQueryObserverRemoved<TRuntime>
  | NotifyEventQueryObserverResultsUpdated<TRuntime>
  | NotifyEventQueryObserverOptionsUpdated<TRuntime>

export type QueryCacheListener<TRuntime extends RuntimeBinding> = (
  event: QueryCacheNotifyEvent<TRuntime>,
) => void

/**
 * The store a `QueryCache` keeps its queries in, keyed by query hash.
 */
export interface QueryStore<TRuntime extends RuntimeBinding> {
  /**
   * Returns whether a query with the given hash is stored.
   */
  has: (queryHash: string) => boolean
  /**
   * Stores a query under its hash.
   */
  set: (queryHash: string, query: QueryOf<TRuntime>) => void
  /**
   * Returns the query with the given hash, if any.
   */
  get: (queryHash: string) => QueryOf<TRuntime> | undefined
  /**
   * Removes the query with the given hash.
   */
  delete: (queryHash: string) => void
  /**
   * Returns an iterator over all stored queries.
   */
  values: () => IterableIterator<QueryOf<TRuntime>>
}
