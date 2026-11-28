import {
  findCachedQueries as coreFindCachedQueries,
  findCachedQuery as coreFindCachedQuery,
} from '@tanstack/query-core'
import { cloneDeepUnref } from './utils'
import type {
  DefaultError,
  Query,
  QueryCache,
  QueryFilters,
  WithRequired,
} from '@tanstack/query-core'
import type { MaybeRefDeep } from './types'

export { QueryCache } from '@tanstack/query-core'

/**
 * Returns the first matching query after unwrapping its filters, or undefined if none match.
 * @param cache - The query cache to search.
 * @param filters - Reactive criteria for matching cache entries.
 * @returns The matching query, or undefined.
 */
export function findCachedQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
>(
  cache: QueryCache,
  filters: MaybeRefDeep<WithRequired<QueryFilters, 'queryKey'>>,
): Query<TQueryFnData, TError, TData> | undefined {
  return coreFindCachedQuery(cache, cloneDeepUnref(filters))
}

/**
 * Returns all cached queries matching the unwrapped filters. Omitting filters returns all queries.
 * @param cache - The query cache to search.
 * @param filters - Reactive criteria for matching cache entries.
 * @returns The matching cached queries.
 */
export function findCachedQueries(
  cache: QueryCache,
  filters: MaybeRefDeep<QueryFilters> = {},
): Array<Query> {
  return coreFindCachedQueries(cache, cloneDeepUnref(filters))
}
