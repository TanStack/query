'use client'
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
import { ensureStaleTime, shouldSuspend, fetchOptimistic } from './suspense'
import { useLazyRef } from './useLazyRef'

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

  ensureStaleTime(defaultedOptions)
  ensurePreventErrorBoundaryRetry(defaultedOptions, errorResetBoundary)

  useClearResetErrorBoundary(errorResetBoundary)

  /**
   * It can take much time between useLazyRef and useSyncExternalStore callback.
   * Let's assume, we have two components (A and B), with the same query inside.
   * There is a potential situation, when the component B can subscribe to changes
   * after these changes occured in the component A.
   *
   * You can get more info here: https://github.com/TanStack/query/issues/5443
   */
  const initiallyUnsubscribe = React.useRef<() => void>()
  const needsToFlushStoreChange = React.useRef(false)
  const observerRef = useLazyRef(() => {
    const observer = new Observer<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    >(queryClient, defaultedOptions)

    initiallyUnsubscribe.current = observer.subscribe(() => {
      needsToFlushStoreChange.current = true
    })

    return observer
  })

  const result = observerRef.current.getOptimisticResult(defaultedOptions)

  useSyncExternalStore(
    React.useCallback(
      (onStoreChange) => {
        if (isRestoring) {
          return () => undefined
        }

        /**
         * We have to call onStoreChange manually
         * in case, if there were any notifies for the observer
         * before the first useSyncExternalStore callback execution
         */
        if (needsToFlushStoreChange.current) {
          needsToFlushStoreChange.current = false
          onStoreChange()
          initiallyUnsubscribe.current?.()
        }

        return observerRef.current.subscribe(
          notifyManager.batchCalls(onStoreChange),
        )
      },
      [isRestoring],
    ),
    () => observerRef.current.getCurrentResult(),
    () => observerRef.current.getCurrentResult(),
  )

  React.useEffect(() => {
    // Do not notify on updates because of changes in the options because
    // these changes should already be reflected in the optimistic result.
    observerRef.current.setOptions(defaultedOptions, { listeners: false })
  }, [defaultedOptions])

  // Handle suspense
  if (shouldSuspend(defaultedOptions, result, isRestoring)) {
    throw fetchOptimistic(
      defaultedOptions,
      observerRef.current,
      errorResetBoundary,
    )
  }

  // Handle error boundary
  if (
    getHasError({
      result,
      errorResetBoundary,
      useErrorBoundary: defaultedOptions.useErrorBoundary,
      query: observerRef.current.getCurrentQuery(),
    })
  ) {
    throw result.error
  }

  // Handle result property usage tracking
  return !defaultedOptions.notifyOnChangeProps
    ? observerRef.current.trackResult(result)
    : result
}
