import {
  QueryObserver,
  fetchOptimistic,
  getQueryCache,
} from '@tanstack/query-core'
import { use } from 'react'
import { throwOnError } from './throwOnError'
import type {
  DefaultError,
  DefaultedQueryObserverOptions,
  Query,
  QueryClient,
  QueryKey,
  QueryObserverResult,
} from '@tanstack/query-core'
import type { QueryErrorResetBoundaryValue } from './QueryErrorResetBoundary'
import type { QueryRenderPolicy } from './queryDescriptor'

type SuspensePromiseEntry = {
  fetchPromise: Promise<unknown>
  promise: Promise<void>
}

const suspensePromiseCache = new WeakMap<
  Query<any, any, any, any>,
  SuspensePromiseEntry
>()

/**
 * Uses the nearest error boundary when the query has no data to show.
 * @param _error - The query error.
 * @param query - The query that failed.
 * @returns Whether the query has no data.
 */
export const defaultThrowOnError = <
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  _error: TError,
  query: Query<TQueryFnData, TError, TData, TQueryKey>,
) => query.state.data === undefined

/**
 * Raises `staleTime` and a numeric `gcTime` to at least 1000ms when `suspense` is enabled, so a
 * component that remounts after suspending doesn't refetch right away or find the query garbage
 * collected. A `'static'` `staleTime` is kept as is. Mutates the options.
 * @param defaultedOptions - The defaulted query options to adjust.
 */
const ensureSuspenseTimers = (
  defaultedOptions: DefaultedQueryObserverOptions<any, any, any, any, any>,
) => {
  // Handle staleTime to ensure minimum 1000ms in Suspense mode
  // This prevents unnecessary refetching when components remount after suspending
  const MIN_SUSPENSE_TIME_MS = 1000

  const clamp = (value: number | 'static' | undefined) =>
    value === 'static' ? value : Math.max(value ?? 0, MIN_SUSPENSE_TIME_MS)

  const originalStaleTime = defaultedOptions.staleTime
  defaultedOptions.staleTime =
    typeof originalStaleTime === 'function'
      ? (...args) => clamp(originalStaleTime(...args))
      : clamp(originalStaleTime)

  if (typeof defaultedOptions.gcTime === 'number') {
    defaultedOptions.gcTime = Math.max(
      defaultedOptions.gcTime,
      MIN_SUSPENSE_TIME_MS,
    )
  }
}

/**
 * Starts a fetch during render or reuses a promise for an existing fetch.
 * @param client - The client that owns the query.
 * @param defaultedOptions - The options of the query.
 * @param observer - The observer that starts the fetch.
 * @param errorResetBoundary - The nearest query error reset boundary.
 * @param query - The query used to key the promise cache.
 * @returns A promise that resolves when the fetch settles.
 */
export function getSuspensePromise(
  client: QueryClient,
  defaultedOptions: DefaultedQueryObserverOptions<any, any, any, any, any>,
  observer: QueryObserver<any, any, any, any, any>,
  errorResetBoundary: QueryErrorResetBoundaryValue,
  query: Query<any, any, any, any>,
): Promise<void> {
  let entry = suspensePromiseCache.get(query)
  if (!entry) {
    const fetchPromise = fetchOptimistic(client, observer, defaultedOptions)
    const settle = () => {
      suspensePromiseCache.delete(query)
    }
    entry = {
      fetchPromise,
      // Retry the render when the fetch settles, even on failure.
      promise: fetchPromise.then(settle, settle),
    }
    suspensePromiseCache.set(query, entry)
  }

  entry.fetchPromise.catch(() => errorResetBoundary.clearReset())
  return entry.promise
}

type SuspenseOptions = DefaultedQueryObserverOptions<any, any, any, any, any>
type SuspenseResult = QueryObserverResult<any, any>
type SnapshotReader<T> = { getSnapshot: () => T }

/**
 * Starts a pending fetch and returns its shared promise when this render should suspend.
 * @param options - The options selected by the Suspense factory.
 * @param result - The snapshot visible during this render.
 * @param client - The cache owner.
 * @param boundary - The current error reset boundary.
 * @param observer - The existing observer of a single-query reader.
 * @returns A promise to read through React, or undefined for a background fetch.
 */
function getPendingPromise(
  options: SuspenseOptions,
  result: SuspenseResult,
  client: QueryClient,
  boundary: QueryErrorResetBoundaryValue,
  observer?: QueryObserver<any, any, any, any, any>,
) {
  const query = getQueryCache(client).build(client, options)
  const suspend =
    result.status === 'pending' ||
    (query.state.status === 'error' && boundary.isReset())
  if (
    !suspend &&
    !(result.fetchStatus === 'fetching' && result.isPlaceholderData)
  )
    return

  const promise = getSuspensePromise(
    client,
    options,
    observer ?? new QueryObserver(client, options),
    boundary,
    query,
  )
  return suspend ? promise : undefined
}

const useReadSuspenseQuery = (
  options: SuspenseOptions,
  reader: SnapshotReader<SuspenseResult>,
  observer: QueryObserver<any, any, any, any, any>,
  client: QueryClient,
  boundary: QueryErrorResetBoundaryValue,
) => {
  const promise = getPendingPromise(
    options,
    reader.getSnapshot(),
    client,
    boundary,
    observer,
  )
  if (promise) use(promise)
}

const suspensePolicy: QueryRenderPolicy<true> = {
  suspense: true,
  prepare: ensureSuspenseTimers,
  errorBoundary: throwOnError,
}

/** Supplies Suspense behavior for one query. */
export const suspenseQueryPolicy: QueryRenderPolicy<true> = {
  ...suspensePolicy,
  readQuery: useReadSuspenseQuery,
}

const useReadSuspenseQueries = (
  defaultedQueries: Array<SuspenseOptions>,
  reader: SnapshotReader<Array<SuspenseResult>>,
  client: QueryClient,
  errorResetBoundary: QueryErrorResetBoundaryValue,
) => {
  const snapshot = reader.getSnapshot()

  const suspensePromises = snapshot.map((result, index) =>
    getPendingPromise(
      defaultedQueries[index]!,
      result,
      client,
      errorResetBoundary,
    ),
  )

  // Start every fetch before calling use(), because use() suspends immediately.
  for (const promise of suspensePromises) {
    if (promise) {
      use(promise)
    }
  }
}

/** Supplies Suspense behavior for parallel queries. */
export const suspenseQueriesPolicy: QueryRenderPolicy<true> & {
  /** Forces group members to run with the Suspense error rule. */
  readonly defaults: { enabled: true; throwOnError: typeof defaultThrowOnError }
  /** Starts each member fetch before suspending the group. */
  readQueries: typeof useReadSuspenseQueries
} = {
  ...suspensePolicy,
  defaults: { enabled: true, throwOnError: defaultThrowOnError },
  readQueries: useReadSuspenseQueries,
}
