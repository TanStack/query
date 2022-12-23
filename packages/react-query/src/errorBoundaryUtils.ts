import type {
  DefaultedQueryObserverOptions,
  Query,
  QueryKey,
  QueryObserverResult,
  ThrowError,
} from '@tanstack/query-core'
import type { QueryErrorResetBoundaryValue } from './QueryErrorResetBoundary'
import * as React from 'react'
import { shouldThrowError } from './utils'

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
) => {
  if (options.suspense || options.throwError) {
    // Prevent retrying failed query if the error boundary has not been reset yet
    if (!errorResetBoundary.isReset()) {
      options.retryOnMount = false
    }
  }
}

export const useClearResetErrorBoundary = (
  errorResetBoundary: QueryErrorResetBoundaryValue,
) => {
  React.useEffect(() => {
    errorResetBoundary.clearReset()
  }, [errorResetBoundary])
}

export const getHasError = <
  TData,
  TError,
  TQueryFnData,
  TQueryData,
  TQueryKey extends QueryKey,
>({
  result,
  errorResetBoundary,
  throwError,
  query,
}: {
  result: QueryObserverResult<TData, TError>
  errorResetBoundary: QueryErrorResetBoundaryValue
  throwError: ThrowError<
    TQueryFnData,
    TError,
    TQueryData,
    TQueryKey
  >
  query: Query<TQueryFnData, TError, TQueryData, TQueryKey>
}) => {
  return (
    result.isError &&
    !errorResetBoundary.isReset() &&
    !result.isFetching &&
    shouldThrowError(throwError, [result.error, query])
  )
}
