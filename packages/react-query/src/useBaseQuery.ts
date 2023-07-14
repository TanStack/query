'use client'
import * as React from 'react'
import { useSyncExternalStore } from './useSyncExternalStore'

import type {QueryKey, QueryObserver} from '@tanstack/query-core'
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
import { ensureStaleTime, shouldSuspend, fetchOptimistic } from './suspense'

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

  // Make sure results are optimistically set in fetching state before subscribing or updating options
  options._optimisticResults = isRestoring
    ? 'isRestoring'
    : 'optimistic'

  const observer = React.useMemo(
    () =>
      new Observer<TQueryFnData, TError, TData, TQueryData, TQueryKey>(
        queryClient,
        options
      ), // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient]
  )

  const defaultedOptions = React.useMemo(() => {
    // Do not notify on updates because of changes in the options because
    // these changes should already be reflected in the optimistic result.
    observer.setOptions(options, { listeners: false });
    return observer.options;
  }, [observer, options]);

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

  ensureStaleTime(defaultedOptions)
  ensurePreventErrorBoundaryRetry(defaultedOptions, errorResetBoundary)

  useClearResetErrorBoundary(errorResetBoundary)

  const result = useSyncExternalStore(
    React.useCallback(
      (onStoreChange) => {
        const unsubscribe = isRestoring
          ? () => undefined
          : observer.subscribe(notifyManager.batchCalls(onStoreChange))

        // Update result to make sure we did not miss any query updates
        // between creating the observer and subscribing to it.
        observer.updateResult()

        return unsubscribe
      },
      [observer, isRestoring],
    ),
    () => observer.getCurrentResult(),
    () => observer.getCurrentResult(),
  )

  // Handle suspense
  if (shouldSuspend(defaultedOptions, result, isRestoring)) {
    throw fetchOptimistic(defaultedOptions, observer, errorResetBoundary)
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
  return React.useMemo(() => {
    return !defaultedOptions.notifyOnChangeProps
      ? observer.trackResult(result)
      : result
  }, [defaultedOptions.notifyOnChangeProps, observer, result])
}
