import type { DefaultedQueryObserverOptions } from '@tanstack/query-core'
import type { QueryObserver } from '@tanstack/query-core'
import type { QueryErrorResetBoundaryValue } from './QueryErrorResetBoundary'
import type { QueryObserverResult } from '@tanstack/query-core'
import type { QueryKey } from '@tanstack/query-core'

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

export const willFetch = (
  result: QueryObserverResult<any, any>,
  isRestoring: boolean,
) => result.isLoading && result.isFetching && !isRestoring

export const shouldSuspend = (
  defaultedOptions:
    | DefaultedQueryObserverOptions<any, any, any, any, any>
    | undefined,
  result: QueryObserverResult<any, any>,
  isRestoring: boolean,
) => defaultedOptions?.suspense && willFetch(result, isRestoring)

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
  observer
    .fetchOptimistic(defaultedOptions)
    .then(({ data }) => {
      defaultedOptions.onSuccess?.(data as TData)
      defaultedOptions.onSettled?.(data, null)
    })
    .catch((error) => {
      errorResetBoundary.clearReset()
      defaultedOptions.onError?.(error)
      defaultedOptions.onSettled?.(undefined, error)
    })
