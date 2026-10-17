import {
  QueryStrictModeError,
  shouldThrowQueryStrictModeEvent,
} from './QueryStrictMode'
import type {
  DefaultError,
  DefaultedQueryObserverOptions,
  Query,
  QueryKey,
  QueryObserver,
  QueryObserverResult,
} from '@tanstack/query-core'
import type { QueryErrorResetBoundaryValue } from './QueryErrorResetBoundary'
import type {
  QueryStrictModeEvent,
  QueryStrictModeValue,
} from './QueryStrictMode'

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
 * Fetches the query for a suspending component, without affecting the observer's own result. If
 * the fetch fails, the reset state of the error boundary is cleared, so the error is thrown to it.
 * @param defaultedOptions - The defaulted query options to fetch with.
 * @param observer - The observer of the query.
 * @param errorResetBoundary - The value of the nearest `QueryErrorResetBoundary`.
 * @returns A promise that resolves once the fetch settles. It never rejects.
 */
export const fetchOptimistic = <
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
) =>
  observer.fetchOptimistic(defaultedOptions).catch(() => {
    errorResetBoundary.clearReset()
  })

/**
 * Inside a `QueryStrictMode`, marks a query read by a hook as used, and reports a
 * `'missing-prefetch'` if a suspending hook is about to start its fetch. Does nothing in production.
 * @param strictMode - The value of the nearest `QueryStrictMode`, if any.
 * @param query - The query the hook reads.
 * @param willSuspend - Whether the hook is about to suspend on the query.
 * @throws {QueryStrictModeError} When `throwOnMissingPrefetch` applies to the `'missing-prefetch'`.
 */
export const checkQueryStrictMode = (
  strictMode: QueryStrictModeValue | null,
  query: Query<any, any, any, any> | undefined,
  willSuspend: boolean,
) => {
  if (process.env.NODE_ENV !== 'production') {
    if (!strictMode || !query) {
      return
    }
    strictMode.markUsed(query)
    // Check the query's own state: the optimistic result already reports `'fetching'`. A query
    // that errored is refetched after an error boundary reset, which isn't a missing prefetch.
    if (
      willSuspend &&
      query.state.fetchStatus === 'idle' &&
      query.state.status !== 'error'
    ) {
      const event: QueryStrictModeEvent = {
        type: 'missing-prefetch',
        message: `[${query.queryHash}]: A suspense query started its fetch during render. Prefetch it higher up (in a route loader, with usePrefetchQuery, or on the server) to avoid request waterfalls.`,
        query,
      }
      // Throw before the hook starts its fetch, so the query stays idle and throws again after
      // an error boundary reset
      if (
        shouldThrowQueryStrictModeEvent(
          strictMode.throwOnMissingPrefetch,
          event,
        )
      ) {
        throw new QueryStrictModeError(event)
      }
      strictMode.logger(event)
    }
  }
}
