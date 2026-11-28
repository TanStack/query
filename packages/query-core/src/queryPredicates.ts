import { resolveQueryValue, skipToken } from './utils'
import type { Query } from './query'

/**
 * Counts observers currently subscribed to a cache entry.
 * @param query - The cached query to inspect.
 * @returns The number of subscribed observers, including disabled observers.
 */
export function getQueryObserverCount(
  query: Query<any, any, any, any>,
): number {
  return query.observers.length
}

/**
 * Checks whether a cache entry has received a data or error update.
 * @param query - The cached query to inspect.
 * @returns Whether data or an error has been recorded since the initial state.
 */
export function isQueryFetched(query: Query<any, any, any, any>): boolean {
  return query.state.dataUpdateCount + query.state.errorUpdateCount > 0
}

/**
 * Returns `true` if the query has at least one observer for which `enabled`
 * does not resolve to `false`.
 * @param query - The cached query to inspect.
 * @returns `true` if the query has an enabled observer.
 */
export function isQueryActive(query: Query<any, any, any, any>): boolean {
  return query.observers.some(
    (observer) => resolveQueryValue(observer.options.enabled, query) !== false,
  )
}

/**
 * Returns `true` if the query is disabled, meaning it will not fetch
 * automatically.
 * - If the query has observers, it is disabled when none of them are active
 *   (see {@link isQueryActive}).
 * - If the query has no observers, it is disabled when its `queryFn` is
 *   `skipToken` or it has never been fetched.
 * @param query - The cached query to inspect.
 * @returns `true` if the query is disabled.
 */
export function isQueryDisabled(query: Query<any, any, any, any>): boolean {
  if (getQueryObserverCount(query) > 0) {
    return !isQueryActive(query)
  }
  // if a query has no observers, it should still be considered disabled if it never attempted a fetch
  return query.options.queryFn === skipToken || !isQueryFetched(query)
}

/**
 * Returns `true` if the query has data and at least one observer configured with
 * `staleTime: 'static'`, meaning it is treated as never stale.
 * @param query - The cached query to inspect.
 * @returns `true` if the query is static.
 */
export function isQueryStatic(query: Query<any, any, any, any>): boolean {
  return (
    query.state.data !== undefined &&
    query.observers.some(
      (observer) =>
        resolveQueryValue(observer.options.staleTime, query) === 'static',
    )
  )
}

/**
 * Returns `true` if the query is stale.
 * - If the query has observers, defers to whether any observer's current
 *   result reports `isStale` (which accounts for each observer's own
 *   `staleTime` and `enabled` state).
 * - If the query has no observers, it is considered stale when it has no
 *   data or has been invalidated.
 * @param query - The cached query to inspect.
 * @returns `true` if the query is stale.
 * @see {@link Query#isStaleByTime}
 * @example
 * ```ts
 * if (isQueryStale(query)) {
 *   // refetch or otherwise treat the cached data as outdated
 * }
 * ```
 */
export function isQueryStale(query: Query<any, any, any, any>): boolean {
  // check observers first, their `isStale` has the source of truth
  // calculated with `isStaleByTime` and it takes `enabled` into account
  if (getQueryObserverCount(query) > 0) {
    return query.observers.some(
      (observer) => observer.getCurrentResult().isStale,
    )
  }

  return query.state.data === undefined || query.state.isInvalidated
}
