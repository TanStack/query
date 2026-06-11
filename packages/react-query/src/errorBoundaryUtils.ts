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
import type { QueryErrorResetBoundaryValue } from './QueryErrorResetBoundary'

const queryResetCounts = new WeakMap<
  QueryErrorResetBoundaryValue,
  WeakMap<object, number>
>()

function getResetCount(errorResetBoundary: QueryErrorResetBoundaryValue) {
  return errorResetBoundary.getResetCount?.()
}

function getQueryResetCounts(errorResetBoundary: QueryErrorResetBoundaryValue) {
  let resetCounts = queryResetCounts.get(errorResetBoundary)

  if (!resetCounts) {
    resetCounts = new WeakMap()
    queryResetCounts.set(errorResetBoundary, resetCounts)
  }

  return resetCounts
}

function isResetForQuery<
  TQueryFnData,
  TError,
  TQueryData,
  TQueryKey extends QueryKey,
>(
  errorResetBoundary: QueryErrorResetBoundaryValue,
  query: Query<TQueryFnData, TError, TQueryData, TQueryKey> | undefined,
) {
  const resetCount = getResetCount(errorResetBoundary)

  if (errorResetBoundary.isReset()) {
    if (query && resetCount) {
      getQueryResetCounts(errorResetBoundary).set(query, resetCount)
    }

    return resetCount === undefined || resetCount > 0
  }

  if (!query) {
    return false
  }

  const resetCounts = getQueryResetCounts(errorResetBoundary)
  const queryResetCount = resetCounts.get(query)

  if (queryResetCount === undefined) {
    resetCounts.set(query, resetCount ?? 0)
    return false
  }

  if (!resetCount) {
    return false
  }

  if (resetCount > queryResetCount) {
    resetCounts.set(query, resetCount)
    return true
  }

  return false
}

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

  if (
    options.suspense ||
    options.experimental_prefetchInRender ||
    throwOnError
  ) {
    // Prevent retrying failed query if the error boundary has not been reset yet
    if (!isResetForQuery(errorResetBoundary, query)) {
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
