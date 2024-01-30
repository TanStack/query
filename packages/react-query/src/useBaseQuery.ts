'use client'
import * as React from 'react'

import { notifyManager } from '@tanstack/query-core'
import { useQueryErrorResetBoundary } from './QueryErrorResetBoundary'
import { useQueryClient } from './QueryClientProvider'
import { useIsRestoring } from './isRestoring'
import {
  ensurePreventErrorBoundaryRetry,
  getHasError,
  useClearResetErrorBoundary,
} from './errorBoundaryUtils'
import { ensureStaleTime, fetchOptimistic, shouldSuspend } from './suspense'
import type { UseBaseQueryOptions } from './types'
import type {
  QueryClient,
  QueryKey,
  QueryObserver,
  QueryObserverResult,
} from '@tanstack/query-core'

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
  queryClient?: QueryClient,
): QueryObserverResult<TData, TError> {
  if (process.env.NODE_ENV !== 'production') {
    if (typeof options !== 'object' || Array.isArray(options)) {
      throw new Error(
        'Bad argument type. Starting with v5, only the "Object" form is allowed when calling query related functions. Please use the error stack to find the culprit call. More info here: https://tanstack.com/query/latest/docs/react/guides/migrating-to-v5#supports-a-single-signature-one-object',
      )
    }
  }

  const client = useQueryClient(queryClient)
  const isRestoring = useIsRestoring()
  const errorResetBoundary = useQueryErrorResetBoundary()
  const defaultedOptions = client.defaultQueryOptions(options)

  // Make sure results are optimistically set in fetching state before subscribing or updating options
  defaultedOptions._optimisticResults = isRestoring
    ? 'isRestoring'
    : 'optimistic'

  ensureStaleTime(defaultedOptions)
  ensurePreventErrorBoundaryRetry(defaultedOptions, errorResetBoundary)

  useClearResetErrorBoundary(errorResetBoundary)

  const [observer] = React.useState(
    () =>
      new Observer<TQueryFnData, TError, TData, TQueryData, TQueryKey>(
        client,
        defaultedOptions,
      ),
  )

  const result = observer.getOptimisticResult(defaultedOptions)

  React.useSyncExternalStore(
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

  React.useEffect(() => {
    // Do not notify on updates because of changes in the options because
    // these changes should already be reflected in the optimistic result.
    observer.setOptions(defaultedOptions, { listeners: false })
  }, [defaultedOptions, observer])

  // Handle suspense
  if (shouldSuspend(defaultedOptions, result)) {
    // Do the same thing as the effect right above because the effect won't run
    // when we suspend but also, the component won't re-mount so our observer would
    // be out of date.
    throw fetchOptimistic(defaultedOptions, observer, errorResetBoundary)
  }

  // Handle error boundary
  if (
    getHasError({
      result,
      errorResetBoundary,
      throwOnError: defaultedOptions.throwOnError,
      query: client
        .getQueryCache()
        .get<
          TQueryFnData,
          TError,
          TQueryData,
          TQueryKey
        >(defaultedOptions.queryHash),
    })
  ) {
    throw result.error
  }

  // Handle result property usage tracking
  return !defaultedOptions.notifyOnChangeProps
    ? observer.trackResult(result)
    : result
}
