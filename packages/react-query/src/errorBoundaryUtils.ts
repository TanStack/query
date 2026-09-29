'use client'
import * as React from 'react'
import { shouldThrowError } from '@tanstack/query-core'
import type {
  DefaultedQueryObserverOptions,
  Query,
  QueryKey,
  QueryObserverResult,
  ThrowOnError,
} from '@tanstack/query-core'
import {
  clearQueryErrorReset,
  isQueryErrorReset,
  registerQueryErrorReset,
  resetQueryError,
} from './QueryErrorResetBoundary'
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
  query: object | undefined | Array<object | undefined>,
) => {
  const queries = Array.isArray(query)
    ? query.filter((value): value is object => value !== undefined)
    : query
      ? [query]
      : []
  const queriesRef = React.useRef<Array<object>>([])

  if (
    queriesRef.current.length !== queries.length ||
    queries.some((value, index) => queriesRef.current[index] !== value)
  ) {
    queriesRef.current = queries
  }

  const stableQueries = queriesRef.current

  React.useEffect(() => {
    stableQueries.forEach((query) => {
      clearQueryErrorReset(errorResetBoundary, query)
    })

    return () => {
      stableQueries.forEach((query) => {
        resetQueryError(errorResetBoundary, query)
      })
    }
  }, [errorResetBoundary, stableQueries])
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
