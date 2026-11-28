import { notifyManager } from './notifyManager'
import { invalidateCachedQuery, resetCachedQuery } from './query'
import { findCachedQueries } from './queryCacheOperations'
import { getQueryCache, setQueryData } from './queryClient'
import { isQueryDisabled, isQueryStatic } from './queryPredicates'
import { noop } from './utils'
import type { QueryClient } from './queryClient'
import type {
  CancelOptions,
  InvalidateOptions,
  InvalidateQueryFilters,
  QueryKey,
  RefetchOptions,
  RefetchQueryFilters,
  ResetOptions,
  SetDataOptions,
} from './types'
import type { QueryFilters, Updater } from './utils'

/**
 * Imperative (non-reactive) way to retrieve the cached data of multiple queries at once.
 * Only queries matching the given filters are returned; if none match, an empty array is
 * returned.
 *
 * Because the matched queries can hold data of different shapes (e.g. a broad filter can match
 * queries with unrelated data types), the `TQueryFnData` generic defaults to `unknown` rather
 * than being inferred. Passing a more specific type is a convenience for call sites that know
 * every matched query holds the same shape — it is not checked against the actual cache
 * contents.
 * @param client - The client that owns the query cache.
 * @param filters - The filters that select which queries to read.
 * @returns An array of query key and data pairs. The data is `undefined` for a query with no cached data.
 * @see {@link getQueryData}
 * @example
 * ```ts
 * const data = getQueriesData(queryClient, { queryKey: ['posts'] })
 * ```
 */
export function getQueriesData<
  TQueryFnData = unknown,
  TQueryFilters extends QueryFilters<any> = QueryFilters,
>(
  client: QueryClient,
  filters: TQueryFilters,
): Array<[QueryKey, TQueryFnData | undefined]> {
  return findCachedQueries(getQueryCache(client), filters).map(
    ({ queryKey, state }) => {
      const data = state.data as TQueryFnData | undefined
      return [queryKey, data]
    },
  )
}

/**
 * Synchronous way to immediately update the cached data of multiple queries at once, using
 * filters or partial query key matching. Only queries that already exist and match the given
 * filters are updated; no new cache entries are created. Internally this calls
 * {@link setQueryData} for each matching query.
 * @param client - The client that owns the query cache.
 * @param filters - The filters that select which existing queries to update.
 * @param updater - Either the new data, or a function that receives each matched query's current
 * data (which may be `undefined`) and returns the new data.
 * @param options - Set `updatedAt` to override the timestamp the written data is recorded with.
 * @returns One `[queryKey, data]` tuple per matched query, in the same shape and with the same
 * `undefined` case as {@link setQueryData}.
 * @example
 * ```ts
 * setQueriesData(queryClient, { queryKey: ['posts'] }, (oldPosts) =>
 *   oldPosts ? oldPosts.filter((post) => post.id !== deletedId) : oldPosts)
 * ```
 */
export function setQueriesData<
  TQueryFnData,
  TQueryFilters extends QueryFilters<any> = QueryFilters,
>(
  client: QueryClient,
  filters: TQueryFilters,
  updater: Updater<
    NoInfer<TQueryFnData> | undefined,
    NoInfer<TQueryFnData> | undefined
  >,
  options?: SetDataOptions,
): Array<[QueryKey, TQueryFnData | undefined]> {
  return notifyManager.batch(() =>
    findCachedQueries(getQueryCache(client), filters).map(({ queryKey }) => [
      queryKey,
      setQueryData<TQueryFnData>(client, queryKey, updater, options),
    ]),
  )
}

/**
 * Removes queries from the cache that match the given filters. Unlike
 * {@link invalidateQueries} or {@link refetchQueries}, this removes
 * matching queries from the cache instead of refetching them. Without filters, every query in
 * the cache is removed.
 * @param client - The client that owns the query cache.
 * @param filters - The filters that select which queries to remove. Without filters, every query
 * is removed.
 * @example
 * ```ts
 * removeQueries(queryClient, { queryKey: ['posts'], exact: true })
 * ```
 */
export function removeQueries<TTaggedQueryKey extends QueryKey = QueryKey>(
  client: QueryClient,
  filters?: QueryFilters<TTaggedQueryKey>,
): void {
  const queryCache = getQueryCache(client)
  notifyManager.batch(() => {
    findCachedQueries(queryCache, filters).forEach((query) => {
      queryCache.remove(query)
    })
  })
}

/**
 * Resets queries matching the given filters back to their initial state (e.g. any
 * `initialData`), notifying subscribers rather than removing them. Active queries among the
 * matched set are then refetched, and the returned promise resolves once that refetch settles.
 * @param client - The client that owns the query cache.
 * @param filters - The filters that select which queries to reset. Without filters, every query
 * is reset.
 * @param options - Passed to the refetch of the active matched queries, e.g. `cancelRefetch` and
 * `throwOnError`.
 * @returns A promise that resolves once the refetch of the active matched queries settles.
 * @example
 * ```ts
 * await resetQueries(queryClient, { queryKey: ['posts'], exact: true })
 * ```
 */
export function resetQueries<TTaggedQueryKey extends QueryKey = QueryKey>(
  client: QueryClient,
  filters?: QueryFilters<TTaggedQueryKey>,
  options?: ResetOptions,
): Promise<void> {
  const queryCache = getQueryCache(client)

  return notifyManager.batch(() => {
    const matched = findCachedQueries(queryCache, filters)
    const queriesToRefetch = new Set(matched)
    matched.forEach((query) => {
      resetCachedQuery(query)
    })
    return refetchQueries(
      client,
      {
        type: 'active',
        predicate: (query) => queriesToRefetch.has(query),
      },
      options,
    )
  })
}

/**
 * Cancels outgoing fetches for queries matching the given filters. Most useful when performing
 * optimistic updates, since any outgoing refetch that resolves afterwards would otherwise
 * overwrite the optimistic update. By default (`revert: true`), a cancelled query's data is
 * reverted to its state before the outgoing fetch started.
 *
 * The returned promise never rejects, even if individual cancellations fail.
 * @param client - The client that owns the query cache.
 * @param filters - The filters that select which queries to cancel. Without filters, every query
 * is cancelled.
 * @param cancelOptions - Passed to each matched query's cancellation. `revert` defaults to
 * `true`.
 * @returns A promise that resolves once every cancellation has settled.
 * @example
 * ```ts
 * await cancelQueries(queryClient, { queryKey: ['posts'], exact: true })
 * ```
 */
export function cancelQueries<TTaggedQueryKey extends QueryKey = QueryKey>(
  client: QueryClient,
  filters?: QueryFilters<TTaggedQueryKey>,
  cancelOptions: CancelOptions = {},
): Promise<void> {
  const defaultedCancelOptions = { revert: true, ...cancelOptions }

  const promises = notifyManager.batch(() =>
    findCachedQueries(getQueryCache(client), filters).map((query) =>
      query.cancel(defaultedCancelOptions),
    ),
  )

  return Promise.all(promises).then(noop, noop)
}

/**
 * Marks queries matching the given filters as invalidated. Unlike
 * {@link removeQueries}, invalidated queries stay in the cache.
 *
 * Unless `filters.refetchType` is `'none'`, matching queries are then refetched via
 * {@link refetchQueries}, using `filters.refetchType` if set, otherwise
 * `filters.type`, otherwise `'active'`.
 * @param client - The client that owns the query cache.
 * @param filters - The filters that select which queries to invalidate, plus `refetchType` to
 * control which of them to refetch afterwards. Without filters, every query is invalidated.
 * @param options - Passed to {@link refetchQueries}, e.g. `cancelRefetch` and
 * `throwOnError`.
 * @returns A promise that resolves once the refetch settles, or immediately if `refetchType` is
 * `'none'`.
 * @example
 * ```ts
 * await invalidateQueries(queryClient, { queryKey: ['posts'], refetchType: 'active' })
 * ```
 */
export function invalidateQueries<TTaggedQueryKey extends QueryKey = QueryKey>(
  client: QueryClient,
  filters?: InvalidateQueryFilters<TTaggedQueryKey>,
  options?: InvalidateOptions,
): Promise<void> {
  return notifyManager.batch(() => {
    findCachedQueries(getQueryCache(client), filters).forEach((query) => {
      invalidateCachedQuery(query)
    })

    if (filters?.refetchType === 'none') {
      return Promise.resolve()
    }
    return refetchQueries(
      client,
      {
        ...filters,
        type: filters?.refetchType ?? filters?.type ?? 'active',
      },
      options,
    )
  })
}

/**
 * Refetches queries matching the given filters, regardless of whether they are stale. Without
 * filters, every query in the cache is refetched. Queries that are disabled, or static (only
 * have observers with a static `staleTime`), are never refetched.
 *
 * By default (`cancelRefetch: true`), a currently running fetch is cancelled before the new
 * one starts. The returned promise does not reject on individual query failures unless
 * `throwOnError` is `true`.
 *
 * Initially paused fetches do not delay the returned promise. Their later errors are handled
 * even when `throwOnError` is `true`.
 * @param client - The client that owns the query cache.
 * @param filters - The filters that select which queries to refetch. Without filters, every query
 * in the cache is included.
 * @param options - Set `cancelRefetch` to `false` to keep a running fetch instead of cancelling
 * it, and `throwOnError` to `true` to reject when a refetch that was not initially paused fails.
 * @returns A promise that resolves once all matching refetches that were not initially paused
 * have settled.
 * @example
 * ```ts
 * // refetch all active queries partially matching a query key:
 * await refetchQueries(queryClient, { queryKey: ['posts'], type: 'active' })
 * ```
 */
export function refetchQueries<TTaggedQueryKey extends QueryKey = QueryKey>(
  client: QueryClient,
  filters?: RefetchQueryFilters<TTaggedQueryKey>,
  options?: RefetchOptions,
): Promise<void> {
  const fetchOptions = {
    ...options,
    cancelRefetch: options?.cancelRefetch ?? true,
  }
  const promises = notifyManager.batch(() =>
    findCachedQueries(getQueryCache(client), filters)
      .filter((query) => !isQueryDisabled(query) && !isQueryStatic(query))
      .map((query) => {
        let promise = query.fetch(undefined, fetchOptions)
        const isPaused = query.state.fetchStatus === 'paused'
        if (!fetchOptions.throwOnError || isPaused) {
          promise = promise.catch(noop)
        }
        return isPaused ? Promise.resolve() : promise
      }),
  )

  return Promise.all(promises).then(noop)
}
