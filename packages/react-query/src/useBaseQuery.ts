'use client'
import * as React from 'react'

import { notifyManager } from '@tanstack/query-core'
import { useSyncExternalStore } from './useSyncExternalStore'
import { useQueryErrorResetBoundary } from './QueryErrorResetBoundary'
import { useQueryClient } from './QueryClientProvider'
import { useIsRestoring } from './isRestoring'
import {
  ensurePreventErrorBoundaryRetry,
  getHasError,
  useClearResetErrorBoundary,
} from './errorBoundaryUtils'
import { ensureStaleTime, fetchOptimistic, shouldSuspend } from './suspense'
import type { QueryKey, QueryObserver } from '@tanstack/query-core'
import type { UseBaseQueryOptions } from './types'

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

  const defaultedOptions = React.useMemo(() => {
    const newDefaultOptions = queryClient.defaultQueryOptions(options);

    // Include callbacks in batch renders
    if (newDefaultOptions.onError) {
      newDefaultOptions.onError = notifyManager.batchCalls(
        newDefaultOptions.onError,
      )
    }

    if (newDefaultOptions.onSuccess) {
      newDefaultOptions.onSuccess = notifyManager.batchCalls(
        newDefaultOptions.onSuccess,
      )
    }

    if (newDefaultOptions.onSettled) {
      newDefaultOptions.onSettled = notifyManager.batchCalls(
        newDefaultOptions.onSettled,
      )
    }

    return newDefaultOptions;
  }, [queryClient, options]);

  // Make sure results are optimistically set in fetching state before subscribing or updating options
  defaultedOptions._optimisticResults = isRestoring
    ? 'isRestoring'
    : 'optimistic'

  ensureStaleTime(defaultedOptions)
  ensurePreventErrorBoundaryRetry(defaultedOptions, errorResetBoundary)

  useClearResetErrorBoundary(errorResetBoundary)

  const observer = React.useMemo(
    () => {
      return new Observer<TQueryFnData, TError, TData, TQueryData, TQueryKey>(
        queryClient,
        defaultedOptions
      );
    }, // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient]
  )

  // This is a use memo here, so it applies to the useSyncExternalStore
  React.useMemo(() => {
    // Do not notify on updates because of changes in the options because
    // these changes should already be reflected in the optimistic result.
    observer.setOptions(defaultedOptions, { listeners: false, })
  }, [defaultedOptions, observer])


  const result = useSyncExternalStore(
    React.useCallback((onStoreChange) => {
      const unsubscribe = isRestoring
        ? () => undefined
        : observer.subscribe(notifyManager.batchCalls(onStoreChange))

      // Update result to make sure we did not miss any query updates
      // between creating the observer and subscribing to it.
      observer.updateResult()

      return unsubscribe
    }, [observer, isRestoring]),
    () => observer.getCurrentResult(),
    () => observer.getCurrentResult(),
  )

  // React.useEffect(() => {
  //   observer.setOptions(defaultedOptions, { listeners: false });
  // }, [defaultedOptions, observer])

  // Handle suspense
  if (shouldSuspend(defaultedOptions, result, isRestoring)) {
    throw fetchOptimistic(defaultedOptions, observer, errorResetBoundary)
  }

  // Handle error boundary
  if (
    getHasError({
      result: result,
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
