import type {
  DefaultError,
  DefaultedQueryObserverOptions,
  Query,
  QueryKey,
  QueryObserver,
  QueryObserverResult,
} from '@tanstack/query-core'
import type { QueryErrorResetBoundaryValue } from './QueryErrorResetBoundary'

const resolvedThenable = Promise.resolve()

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
 * @param defaultedOptions - The options of the query.
 * @param result - The result for this render.
 * @param errorResetBoundary - The nearest query error reset boundary.
 * @param query - The query to fetch.
 * @returns `undefined` to skip the fetch, `false` to fetch in the background, or `true` to suspend.
 */
export const shouldSuspend = (
  defaultedOptions:
    | DefaultedQueryObserverOptions<any, any, any, any, any>
    | undefined,
  result: QueryObserverResult<any, any>,
  errorResetBoundary: QueryErrorResetBoundaryValue,
  query: Query<any, any, any, any>,
): boolean | undefined => {
  if (!defaultedOptions?.suspense) {
    return undefined
  }

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
 * @param shouldFetch - Whether to start a fetch when none is pending.
 * @returns A promise that resolves when the fetch settles.
 */
export function getSuspensePromise(
  defaultedOptions: DefaultedQueryObserverOptions<any, any, any, any, any>,
  observer: QueryObserver<any, any, any, any, any>,
  errorResetBoundary: QueryErrorResetBoundaryValue,
  query: Query<any, any, any, any>,
  shouldFetch = true,
): Promise<void> {
  const shouldFetchNow =
    shouldFetch ||
    (query.state.status === 'error' && errorResetBoundary.isReset())

  const cached = suspensePromiseCache.get(query)

  if (cached && (!shouldFetchNow || !cached.settled)) {
    cached.fetchPromise.catch(() => errorResetBoundary.clearReset())
    return cached.promise
  }

  if (!shouldFetchNow) {
    return resolvedThenable
  }

  const fetchPromise = observer.fetchOptimistic(defaultedOptions)
  // The observer result is recalculated after React retries. We only use this
  // promise to tell React when the fetch has settled.
  const entry = {
    fetchPromise,
    promise: undefined as unknown as Promise<void>,
    settled: false,
  }
  const settle = () => {
    entry.settled = true
  }
  entry.promise = fetchPromise.then(settle, settle)

  suspensePromiseCache.set(query, entry)

  fetchPromise.catch(() => errorResetBoundary.clearReset())

  return entry.promise
}
