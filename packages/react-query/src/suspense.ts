import * as React from 'react'
import type {
  DefaultError,
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

const fallbackUse = <T>(
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
}

export const use =
  // React18 doesn't have `use`
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  React.use || fallbackUse

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
) => {
  const queryHash = defaultedOptions.queryHash
  const cached = suspenseObserverPromiseCache.get(observer)

  if (cached?.queryHash === queryHash) {
    return cached.promise as Promise<QueryObserverResult<TData, TError>>
  }

  const promise = fetchOptimistic(
    defaultedOptions,
    observer,
    errorResetBoundary,
  )

  suspenseObserverPromiseCache.set(observer, {
    queryHash,
    promise,
  })

  return promise
}

const suspenseObserverPromiseCache = new WeakMap<
  QueryObserver<any, any, any, any, any>,
  {
    queryHash: string
    promise: Promise<void | QueryObserverResult<any, any>>
  }
>()
