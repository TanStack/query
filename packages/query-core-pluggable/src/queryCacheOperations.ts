import { notifyManager } from './notifyManager'
import { matchQuery } from './utils'
import type { Query } from './query'
import type { QueryCache } from './queryCache'
import type { DefaultError, WithRequired } from './types'
import type { QueryFilters } from './utils'

/**
 * Looks up the first query matching the supplied key and filters.
 * @param cache - The cache to search.
 * @param filters - The filters to match, including the required `queryKey`. `exact` defaults to
 * `true`.
 * @returns The first matching query, or `undefined`.
 * @see {@link findCachedQueries}
 * @example
 * ```ts
 * const queryCache = getQueryCache(queryClient)
 *
 * const query = findCachedQuery(queryCache, { queryKey: ['posts'] })
 * ```
 */
export function findCachedQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
>(
  cache: QueryCache,
  filters: WithRequired<QueryFilters, 'queryKey'>,
): Query<TQueryFnData, TError, TData> | undefined {
  const defaultedFilters = { exact: true, ...filters }

  return cache
    .getAll()
    .find((query) =>
      matchQuery(defaultedFilters, query, cache.config.queryKey),
    ) as Query<TQueryFnData, TError, TData> | undefined
}

/**
 * Returns every matching query in cache order. Keys match by prefix unless
 * `exact` is enabled.
 * @param cache - The cache to search.
 * @param filters - The filters to match. Without filters, every query is returned.
 * @returns The matching queries.
 * @see {@link findCachedQuery}
 * @example
 * ```ts
 * const queryCache = getQueryCache(queryClient)
 *
 * const queries = findCachedQueries(queryCache, { queryKey: ['posts'] })
 * ```
 */
export function findCachedQueries(
  cache: QueryCache,
  filters: QueryFilters<any> = {},
): Array<Query> {
  const queries = cache.getAll()
  return Object.keys(filters).length > 0
    ? queries.filter((query) =>
        matchQuery(filters, query, cache.config.queryKey),
      )
    : queries
}

/**
 * Removes all queries from the cache.
 * @param cache - The cache to empty.
 * @example
 * ```ts
 * const queryCache = getQueryCache(queryClient)
 *
 * clearQueryCache(queryCache)
 * ```
 */
export function clearQueryCache(cache: QueryCache): void {
  notifyManager.batch(() => {
    cache.getAll().forEach((query) => {
      cache.remove(query)
    })
  })
}
