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

type SuspenseThenable<T> = Promise<T> & {
  status?: 'pending' | 'fulfilled' | 'rejected'
  value?: T
  reason?: unknown
}

export const fallbackUse = <T>(thenable: SuspenseThenable<T>): T => {
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
        (value) => {
          thenable.status = 'fulfilled'
          thenable.value = value
        },
        (reason) => {
          thenable.status = 'rejected'
          thenable.reason = reason
        },
      )
      throw thenable
  }
}

// React 18 does not have `use`
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
export const use = React.use || fallbackUse

export const resolvedThenable = Promise.resolve(
  undefined,
) as SuspenseThenable<void>
resolvedThenable.status = 'fulfilled'
resolvedThenable.value = undefined

type SuspensePromiseEntry = {
  fetchPromise: Promise<unknown>
  promise: Promise<void>
}

const suspensePromiseCache = new WeakMap<
  Query<any, any, any, any>,
  SuspensePromiseEntry
>()

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

export const shouldSuspend = (
  defaultedOptions:
    | DefaultedQueryObserverOptions<any, any, any, any, any>
    | undefined,
  result: QueryObserverResult<any, any>,
) => defaultedOptions?.suspense && result.isPending

export function getSuspensePromise(
  defaultedOptions: DefaultedQueryObserverOptions<any, any, any, any, any>,
  observer: QueryObserver<any, any, any, any, any>,
  errorResetBoundary: QueryErrorResetBoundaryValue,
): Promise<void> {
  const query = observer.getCurrentQuery()
  const cached = suspensePromiseCache.get(query)

  if (cached) {
    cached.fetchPromise.catch(() => errorResetBoundary.clearReset())
    return cached.promise
  }

  const fetchPromise = observer.fetchOptimistic(defaultedOptions)
  // The observer result is recalculated after React retries. We only use this
  // promise to tell React when the fetch has settled.
  const promise = fetchPromise.then(
    () => undefined,
    () => undefined,
  )
  const entry = { fetchPromise, promise }

  suspensePromiseCache.set(query, entry)

  promise.then(() => {
    if (suspensePromiseCache.get(query) === entry) {
      suspensePromiseCache.delete(query)
    }
  })

  fetchPromise.catch(() => errorResetBoundary.clearReset())

  return promise
}
