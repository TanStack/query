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
// Track reset generations per live Query instance. If a query is garbage
// collected between unmount and remount, a future Query instance starts fresh
// instead of inheriting retry state from a different lifecycle.

export function markQueryResetCount(
  errorResetBoundary: QueryErrorResetBoundaryValue,
  query: object | undefined,
  resetCount: number | undefined,
) {
  if (!query || resetCount === undefined) return

  let resetCounts = queryResetCounts.get(errorResetBoundary)
  if (!resetCounts) {
    resetCounts = new WeakMap()
    queryResetCounts.set(errorResetBoundary, resetCounts)
  }
  resetCounts.set(query, Math.max(resetCounts.get(query) ?? 0, resetCount))
}

function isResetForQuery(
  errorResetBoundary: QueryErrorResetBoundaryValue,
  query: object | undefined,
) {
  if (errorResetBoundary.isReset()) return true

  const resetCount = errorResetBoundary.getResetCount?.()
  const queryResetCount = query
    ? queryResetCounts.get(errorResetBoundary)?.get(query)
    : undefined

  return (
    resetCount !== undefined &&
    queryResetCount !== undefined &&
    resetCount > queryResetCount
  )
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

  if (options.suspense || throwOnError) {
    // Prevent retrying failed query if the error boundary has not been reset yet
    if (!isResetForQuery(errorResetBoundary, query)) {
      options.retryOnMount = false
    }
  }
}

export const useClearResetErrorBoundary = (
  errorResetBoundary: QueryErrorResetBoundaryValue,
  queries: Array<object | undefined>,
) => {
  const resetCount = errorResetBoundary.getResetCount?.()
  React.useEffect(() => {
    queries.forEach((query) => {
      markQueryResetCount(errorResetBoundary, query, resetCount)
    })
  }, [errorResetBoundary, queries, resetCount])
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
