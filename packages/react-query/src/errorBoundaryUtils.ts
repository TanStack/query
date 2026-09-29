'use client'
import * as React from 'react'
import { shouldThrowError } from '@tanstack/query-core'
import {
  clearQueryErrorReset,
  getQueryErrorResetEpoch,
  isQueryErrorReset,
  registerQueryErrorReset,
  resetQueryError,
} from './QueryErrorResetBoundary'
import type {
  DefaultedQueryObserverOptions,
  Query,
  QueryKey,
  QueryObserverResult,
  ThrowOnError,
} from '@tanstack/query-core'
import type { QueryErrorResetBoundaryValue } from './QueryErrorResetBoundary'

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
    if (query?.state.status === 'error') {
      registerQueryErrorReset(errorResetBoundary, query)
    }

    // Prevent retrying failed query if the error boundary has not been reset yet
    if (!isQueryErrorReset(errorResetBoundary, query)) {
      options.retryOnMount = false
    }
  }
}

export const useClearResetErrorBoundary = (
  errorResetBoundary: QueryErrorResetBoundaryValue,
  observer:
    | { getCurrentQuery: () => object }
    | { getQueries: () => Array<object> },
) => {
  const resetEpoch = getQueryErrorResetEpoch(errorResetBoundary)

  React.useEffect(() => {
    const queries =
      'getCurrentQuery' in observer
        ? [observer.getCurrentQuery()]
        : observer.getQueries()

    queries.forEach((query) => {
      clearQueryErrorReset(errorResetBoundary, query)
    })

    return () => {
      const currentQueries =
        'getCurrentQuery' in observer
          ? [observer.getCurrentQuery()]
          : observer.getQueries()

      currentQueries.forEach((query) => {
        resetQueryError(errorResetBoundary, query, resetEpoch)
      })
    }
  }, [errorResetBoundary, observer, resetEpoch])
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
    !isQueryErrorReset(errorResetBoundary, query) &&
    !result.isFetching &&
    query &&
    ((suspense && result.data === undefined) ||
      shouldThrowError(throwOnError, [result.error, query]))
  )
}
