import * as React from 'react'
import type { DefaultError } from '@tanstack/query-core'
import type {
  DefaultedQueryObserverOptions,
  Query,
  QueryKey,
  QueryObserver,
  QueryObserverResult,
} from '@tanstack/query-core'
import type { QueryErrorResetBoundaryValue } from './QueryErrorResetBoundary'

export const defaultThrowOnError = <
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  _error: TError,
  query: Query<TQueryFnData, TError, TData, TQueryKey>,
) => query.state.data === undefined

export const ensureStaleTime = (
  defaultedOptions: DefaultedQueryObserverOptions<any, any, any, any, any>,
) => {
  if (defaultedOptions.suspense) {
    // Always set stale time when using suspense to prevent
    // fetching again when directly mounting after suspending
    if (typeof defaultedOptions.staleTime !== 'number') {
      defaultedOptions.staleTime = 1000
    }
  }
}

export const use =
  // React18 doesn't have `use`
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  React.use ||
  (<T>(
    thenable: Promise<T> & {
      status?: 'pending' | 'fulfilled' | 'rejected'
      value?: T
      reason?: unknown
    },
  ): T => {
    switch (thenable.status) {
      case 'pending':
        throw thenable
      case 'fulfilled':
        return thenable.value as T
      case 'rejected':
        throw thenable.reason
      default:
        thenable.status = 'pending'
        thenable.then(
          (v) => {
            thenable.status = 'fulfilled'
            thenable.value = v
          },
          (e) => {
            thenable.status = 'rejected'
            thenable.reason = e
          },
        )
        throw thenable
    }
  })

export const willFetch = (
  result: QueryObserverResult<any, any>,
  isRestoring: boolean,
) => result.isLoading && result.isFetching && !isRestoring

export const shouldSuspend = (
  defaultedOptions:
    | DefaultedQueryObserverOptions<any, any, any, any, any>
    | undefined,
  result: QueryObserverResult<any, any>,
) => defaultedOptions?.suspense && result.isPending

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
