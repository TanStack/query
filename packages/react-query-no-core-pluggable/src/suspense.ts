import { use } from 'react'
import { QueryObserver } from './runtime/queryObserver'
import type {
  DefaultError,
  QueryKey,
  QueryObserverResult,
} from '@tanstack/query-types/bindings'
import type { QueryErrorResetBoundaryValue } from './QueryErrorResetBoundary'
import type { Query } from './runtime/query'
import type { QueryClient } from './runtime/queryClient'
import type { DefaultedQueryObserverOptions } from './runtime/types'

type SuspensePromiseEntry = {
  fetchPromise: Promise<unknown>
  promise: Promise<void>
  settled: boolean
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
export const ensureSuspenseTimers = (
  defaultedOptions: DefaultedQueryObserverOptions<any, any, any, any, any>,
) => {
  if (defaultedOptions.suspense) {
    // Handle staleTime to ensure minimum 1000ms in Suspense mode
    // This prevents unnecessary refetching when components remount after suspending
    const MIN_SUSPENSE_TIME_MS = 1000

    const clamp = (value: number | 'static' | undefined) =>
      value === 'static'
        ? value
        : Math.max(value ?? MIN_SUSPENSE_TIME_MS, MIN_SUSPENSE_TIME_MS)

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
}

/**
 * Decides whether a Suspense query needs to fetch during render.
 * @param result - The result for this render.
 * @param errorResetBoundary - The nearest query error reset boundary.
 * @param query - The query to fetch.
 * @returns `undefined` to skip the fetch, `false` to fetch in the background, or `true` to suspend.
 */
const shouldSuspend = (
  result: QueryObserverResult<any, any>,
  errorResetBoundary: QueryErrorResetBoundaryValue,
  query: Query<any, any, any, any>,
): boolean | undefined => {
  if (
    result.isPending ||
    (query.state.status === 'error' && errorResetBoundary.isReset())
  ) {
    return true
  }

  if (result.isFetching && result.isPlaceholderData) {
    return false
  }

  return undefined
}

/**
 * Starts a fetch during render or reuses a promise for an existing fetch.
 * @param defaultedOptions - The options of the query.
 * @param observer - The observer that starts the fetch.
 * @param errorResetBoundary - The nearest query error reset boundary.
 * @param query - The query used to key the promise cache.
 * @returns A promise that resolves when the fetch settles.
 */
export function getSuspensePromise(
  defaultedOptions: DefaultedQueryObserverOptions<any, any, any, any, any>,
  observer: QueryObserver<any, any, any, any, any>,
  errorResetBoundary: QueryErrorResetBoundaryValue,
  query: Query<any, any, any, any>,
): Promise<void> {
  let entry = suspensePromiseCache.get(query)
  if (!entry || entry.settled) {
    const fetchPromise = observer.fetchOptimistic(defaultedOptions)
    const settle = () => {
      pending.settled = true
    }
    const pending: SuspensePromiseEntry = {
      fetchPromise,
      // Retry the render when the fetch settles, even on failure.
      promise: fetchPromise.then(settle, settle),
      settled: false,
    }
    suspensePromiseCache.set(query, pending)
    entry = pending
  }

  entry.fetchPromise.catch(() => errorResetBoundary.clearReset())
  return entry.promise
}

type SuspenseOptions = DefaultedQueryObserverOptions<any, any, any, any, any>
type SuspenseResult = QueryObserverResult<any, any>
type SnapshotReader<T> = { getSnapshot: () => T }

const useReadSuspenseQuery = (
  defaultedOptions: SuspenseOptions,
  reader: SnapshotReader<SuspenseResult>,
  observer: QueryObserver<any, any, any, any, any>,
  client: QueryClient,
  errorResetBoundary: QueryErrorResetBoundaryValue,
) => {
  if (!defaultedOptions.suspense) return

  const snapshot = reader.getSnapshot()
  const query = client.getQueryCache().build(client, defaultedOptions)
  const suspend = shouldSuspend(snapshot, errorResetBoundary, query)
  if (suspend === undefined) return

  const promise = getSuspensePromise(
    defaultedOptions,
    observer,
    errorResetBoundary,
    query,
  )
  if (suspend) {
    use(promise)
  }
}

/** Supplies Suspense behavior for one query. */
export const suspenseQueryPolicy = {
  prepare: ensureSuspenseTimers,
  readQuery: useReadSuspenseQuery,
}

const useReadSuspenseQueries = (
  defaultedQueries: Array<SuspenseOptions>,
  reader: SnapshotReader<Array<SuspenseResult>>,
  client: QueryClient,
  errorResetBoundary: QueryErrorResetBoundaryValue,
) => {
  const snapshot = reader.getSnapshot()

  const suspensePromises = snapshot.map((result, index) => {
    const opts = defaultedQueries[index]

    if (!opts?.suspense) {
      return undefined
    }

    const query = client.getQueryCache().build(client, opts)
    const suspend = shouldSuspend(result, errorResetBoundary, query)

    if (suspend === undefined) {
      return undefined
    }

    const queryObserver = new QueryObserver(client, opts)
    const promise = getSuspensePromise(
      opts,
      queryObserver,
      errorResetBoundary,
      query,
    )

    return suspend ? promise : undefined
  })

  // Start every fetch before calling use(), because use() suspends immediately.
  for (const promise of suspensePromises) {
    if (promise) {
      use(promise)
    }
  }
}

/** Supplies Suspense behavior for parallel queries. */
export const suspenseQueriesPolicy = {
  prepare: ensureSuspenseTimers,
  readQueries: useReadSuspenseQueries,
}
