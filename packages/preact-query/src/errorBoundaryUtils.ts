import { shouldThrowError } from '@tanstack/query-core'
import { useEffect } from 'preact/hooks'
import type {
  DefaultedQueryObserverOptions,
  Query,
  QueryKey,
  QueryObserverResult,
  ThrowOnError,
} from '@tanstack/query-core'

import type { QueryErrorResetBoundaryValue } from './QueryErrorResetBoundary'

/**
 * Turns off `retryOnMount` for a query that throws its errors (with `suspense` or `throwOnError`),
 * unless the error boundary has been reset, so a remount doesn't retry the failed query before the
 * user resets the boundary. Mutates the options.
 * @param options - The defaulted query options to adjust.
 * @param errorResetBoundary - The value of the nearest `QueryErrorResetBoundary`.
 * @param query - The query, used to evaluate a `throwOnError` function against its error.
 */
export const ensurePreventErrorBoundaryRetry = <
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey,
>(
  options: DefaultedQueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >,
  errorResetBoundary: QueryErrorResetBoundaryValue,
  query: Query<TQueryFnData, TError, TQueryData, TQueryKey> | undefined,
) => {
  const throwOnError =
    query?.state.error && typeof options.throwOnError === 'function'
      ? shouldThrowError(options.throwOnError, [query.state.error, query])
      : options.throwOnError

  if (options.suspense || throwOnError) {
    // Prevent retrying failed query if the error boundary has not been reset yet
    if (!errorResetBoundary.isReset()) {
      options.retryOnMount = false
    }
  }
}

/**
 * Clears the reset state of the error boundary after the component mounts, so later errors are
 * thrown to the boundary again.
 * @param errorResetBoundary - The value of the nearest `QueryErrorResetBoundary`.
 */
export const useClearResetErrorBoundary = (
  errorResetBoundary: QueryErrorResetBoundaryValue,
) => {
  useEffect(() => {
    if (errorResetBoundary.isReset()) {
      errorResetBoundary.clearReset()
    }
  }, [errorResetBoundary])
}

/**
 * Checks whether the query error should be thrown to the nearest error boundary: the query errored
 * and isn't fetching, the boundary hasn't been reset, and either `suspense` is enabled with no data
 * or `throwOnError` says so.
 * @param params - The observer `result`, the `errorResetBoundary`, the `throwOnError` option, the
 * `query`, and the `suspense` option.
 * @returns `true` if the error should be thrown.
 */
export const getHasError = <
  TData,
  TError,
  TQueryFnData,
  TQueryData,
  TQueryKey extends QueryKey,
>({
  result,
  errorResetBoundary,
  throwOnError,
  query,
  suspense,
}: {
  result: QueryObserverResult<TData, TError>
  errorResetBoundary: QueryErrorResetBoundaryValue
  throwOnError: ThrowOnError<TQueryFnData, TError, TQueryData, TQueryKey>
  query: Query<TQueryFnData, TError, TQueryData, TQueryKey> | undefined
  suspense: boolean | undefined
}) => {
  return (
    result.isError &&
    !errorResetBoundary.isReset() &&
    !result.isFetching &&
    query &&
    ((suspense && result.data === undefined) ||
      shouldThrowError(throwOnError, [result.error, query]))
  )
}
