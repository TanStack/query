import * as React from 'react'
import { useSyncExternalStore } from './useSyncExternalStore'

import type { QueryKey, QueryObserver } from '@tanstack/query-core'
import { notifyManager } from '@tanstack/query-core'
import { useQueryErrorResetBoundary } from './QueryErrorResetBoundary'
import { useQueryClient } from './QueryClientProvider'
import type { UseBaseQueryOptions } from './types'
import { useIsRestoring } from './isRestoring'
import {
  ensurePreventErrorBoundaryRetry,
  getHasError,
  useClearResetErrorBoundary,
} from './errorBoundaryUtils'

export function useBaseQuery<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey,
>(
  options: UseBaseQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >,
  Observer: typeof QueryObserver,
) {
  const queryClient = useQueryClient({ context: options.context })
  const isRestoring = useIsRestoring()
  const errorResetBoundary = useQueryErrorResetBoundary()
  const defaultedOptions = queryClient.defaultQueryOptions(options)

  // Make sure results are optimistically set in fetching state before subscribing or updating options
  defaultedOptions._optimisticResults = isRestoring
    ? 'isRestoring'
    : 'optimistic'

  // Include callbacks in batch renders
  if (defaultedOptions.onError) {
    defaultedOptions.onError = notifyManager.batchCalls(
      defaultedOptions.onError,
    )
  }

  if (defaultedOptions.onSuccess) {
    defaultedOptions.onSuccess = notifyManager.batchCalls(
      defaultedOptions.onSuccess,
    )
  }

  if (defaultedOptions.onSettled) {
    defaultedOptions.onSettled = notifyManager.batchCalls(
      defaultedOptions.onSettled,
    )
  }

  if (defaultedOptions.suspense) {
    // Always set stale time when using suspense to prevent
    // fetching again when directly mounting after suspending
    if (typeof defaultedOptions.staleTime !== 'number') {
      defaultedOptions.staleTime = 1000
    }
  }

  ensurePreventErrorBoundaryRetry(defaultedOptions, errorResetBoundary)

  useClearResetErrorBoundary(errorResetBoundary)

  const [observer] = React.useState(
    () =>
      new Observer<TQueryFnData, TError, TData, TQueryData, TQueryKey>(
        queryClient,
        defaultedOptions,
      ),
  )

  const result = observer.getOptimisticResult(defaultedOptions)

  useSyncExternalStore(
    React.useCallback(
      (onStoreChange) =>
        isRestoring
          ? () => undefined
          : observer.subscribe(notifyManager.batchCalls(onStoreChange)),
      [observer, isRestoring],
    ),
    () => observer.getCurrentResult(),
    () => observer.getCurrentResult(),
  )

  React.useEffect(() => {
    // Do not notify on updates because of changes in the options because
    // these changes should already be reflected in the optimistic result.
    observer.setOptions(defaultedOptions, { listeners: false })
  }, [defaultedOptions, observer])

  // Handle suspense
  if (
    defaultedOptions.suspense &&
    result.isLoading &&
    result.isFetching &&
    !isRestoring
  ) {
    throw observer
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
  }

  // Handle error boundary
  if (
    getHasError({
      result,
      errorResetBoundary,
      useErrorBoundary: defaultedOptions.useErrorBoundary,
      query: observer.getCurrentQuery(),
    })
  ) {
    throw result.error
  }

  // Handle result property usage tracking
  return !defaultedOptions.notifyOnChangeProps
    ? observer.trackResult(result)
    : result
}
