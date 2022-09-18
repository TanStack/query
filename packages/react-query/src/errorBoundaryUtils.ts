import {
  DefaultedQueryObserverOptions,
  Query,
  QueryKey,
  QueryObserverResult,
} from '@tanstack/query-core'
import { QueryErrorResetBoundaryValue } from './QueryErrorResetBoundary'
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
  if (options.suspense || options.useErrorBoundary) {
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
  TUseErrorBoundaryFn extends (...args: any[]) => boolean,
>({
  result,
  errorResetBoundary,
  useErrorBoundary,
  query,
}: {
  result: QueryObserverResult<TData, TError>
  errorResetBoundary: QueryErrorResetBoundaryValue
  useErrorBoundary: boolean | TUseErrorBoundaryFn | undefined
  query: Query<TQueryFnData, TError, TQueryData, TQueryKey>
}) => {
  return (
    result.isError &&
    !errorResetBoundary.isReset() &&
    !result.isFetching &&
    shouldThrowError(useErrorBoundary, [result.error, query] as Parameters<TUseErrorBoundaryFn>)
  )
}
