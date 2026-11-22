import { QueryObserver } from '@tanstack/query-core'
import { use } from 'preact/compat'
import type {
  DefaultError,
  DefaultedQueryObserverOptions,
  Query,
  QueryClient,
  QueryKey,
  QueryObserverResult,
} from '@tanstack/query-core'
import type { QueryErrorResetBoundaryValue } from './QueryErrorResetBoundary'

const suspensePromises = new WeakMap<
  Query<any, any, any, any>,
  { fetchPromise: Promise<unknown>; promise: Promise<void> }
>()

/**
 * The default `throwOnError` of the suspense hooks: throws the error to the nearest error boundary
 * only if the query has no data to show.
 * @param _error - The error of the query. Unused.
 * @param query - The query that errored.
 * @returns `true` if the query has no data.
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
 * Checks whether a query should suspend: `suspense` is enabled and the result is still `pending`.
 * @param defaultedOptions - The defaulted query options, if any.
 * @param result - The current result of the observer.
 * @returns `true` if the component should suspend.
 */
export const shouldSuspend = (
  defaultedOptions:
    | DefaultedQueryObserverOptions<any, any, any, any, any>
    | undefined,
  result: QueryObserverResult<any, any>,
) => defaultedOptions?.suspense && result.isPending

/**
 * Starts or reuses a Suspense fetch without affecting the observer's own result.
 * @param defaultedOptions - The defaulted query options to fetch with.
 * @param observer - The observer of the query.
 * @param errorResetBoundary - The value of the nearest `QueryErrorResetBoundary`.
 * @param query - The query used to key the promise cache.
 * @returns A promise that resolves once the fetch settles. It never rejects.
 */
export const getSuspensePromise = <
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey,
>(
  defaultedOptions: DefaultedQueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >,
  observer: QueryObserver<TQueryFnData, TError, TData, TQueryData, TQueryKey>,
  errorResetBoundary: QueryErrorResetBoundaryValue,
  query: Query<TQueryFnData, TError, TQueryData, TQueryKey>,
): Promise<void> => {
  const cached = suspensePromises.get(query)
  if (cached) {
    cached.fetchPromise.catch(() => errorResetBoundary.clearReset())
    return cached.promise
  }

  const fetchPromise = observer.fetchOptimistic(defaultedOptions)
  const settle = () => {
    suspensePromises.delete(query)
  }
  const promise = fetchPromise.then(settle, settle)

  suspensePromises.set(query, { fetchPromise, promise })
  fetchPromise.catch(() => {
    errorResetBoundary.clearReset()
  })
  return promise
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
  // Suspend before registering external-store effects for this render.
  if (shouldSuspend(defaultedOptions, reader.getSnapshot())) {
    const suspenseQuery = client.getQueryCache().build(client, defaultedOptions)
    use(
      getSuspensePromise(
        defaultedOptions,
        observer,
        errorResetBoundary,
        suspenseQuery,
      ),
    )
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
  const suspensePromises = reader.getSnapshot().flatMap((result, index) => {
    const options = defaultedQueries[index]
    if (!options || !shouldSuspend(options, result)) return []

    const observer = new QueryObserver(client, options)
    return getSuspensePromise(
      options,
      observer,
      errorResetBoundary,
      observer.getCurrentQuery(),
    )
  })

  if (suspensePromises.length > 0) {
    // Keep the boundary suspended until every pending query has settled.
    use(Promise.all(suspensePromises))
  }
}

/** Supplies Suspense behavior for parallel queries. */
export const suspenseQueriesPolicy = {
  prepare: ensureSuspenseTimers,
  readQueries: useReadSuspenseQueries,
}
