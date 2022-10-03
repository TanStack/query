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
  // Duc - we need to create a queryClient and reuse it per query

  // { context: options.context }
  // Duc - why do we need context here?
  // Duc - how to implement this behavior in angular
  // Duc - FROM the document: Required, but only if no default query function has been defined See Default Query Function for more information.
  // https://tanstack.com/query/v4/docs/reference/useQuery?from=reactQueryV3&original=https://react-query-v3.tanstack.com/reference/useQuery
  // maybe we can skip this for angular e.g. the default query function is required
  const queryClient = useQueryClient({ context: options.context })
  // Duc - skip this in MVP
  const isRestoring = useIsRestoring()
  // Duc - SKIP: since angular does not have ErrorBoundary
  // const errorResetBoundary = useQueryErrorResetBoundary()
  const defaultedOptions = queryClient.defaultQueryOptions(options)

  // Make sure results are optimistically set in fetching state before subscribing or updating options
  // Duc - skip this in MVP
  defaultedOptions._optimisticResults = isRestoring
    ? 'isRestoring'
    : 'optimistic'

  // Duc - skip this in MVP
  // Include callbacks in batch renders
  if (defaultedOptions.onError) {
    defaultedOptions.onError = notifyManager.batchCalls(
      defaultedOptions.onError,
    )
  }

  // Duc - skip this in MVP
  if (defaultedOptions.onSuccess) {
    defaultedOptions.onSuccess = notifyManager.batchCalls(
      defaultedOptions.onSuccess,
    )
  }

  // Duc - skip this in MVP
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

  // Duc - SKIP: since angular does not have ErrorBoundary
  // ensurePreventErrorBoundaryRetry(defaultedOptions, errorResetBoundary)

  // Duc - SKIP: since angular does not have ErrorBoundary
  // useClearResetErrorBoundary(errorResetBoundary)

  // Duc - create an observer for this query one time
  // and reuse it
  const [observer] = React.useState(
    () =>
      new Observer<TQueryFnData, TError, TData, TQueryData, TQueryKey>(
        queryClient,
        defaultedOptions,
      ),
  )

  // Duc - skip this in MVP
  const result = observer.getOptimisticResult(defaultedOptions)

  // Duc - why do we need useSyncExternalStore
  // need to check React document to find out
  useSyncExternalStore(
    React.useCallback(
      (onStoreChange) =>
        isRestoring
          ? () => undefined
          : // Duc - call unsubcribe on destroy
            observer.subscribe(notifyManager.batchCalls(onStoreChange)),
      [observer, isRestoring],
    ),
    () => observer.getCurrentResult(),
    () => observer.getCurrentResult(),
  )

  // Duc - update observer option if consumer options are changed
  // Duc - need to find a good API to for angular life cycle
  // Duc - a good canidate is provide options as BehaviorSubject
  // Duc - consumer will subject this subject whenever options are update
  // Duc - angular bindings should listen for changes and update observer options
  React.useEffect(() => {
    // Do not notify on updates because of changes in the options because
    // these changes should already be reflected in the optimistic result.
    observer.setOptions(defaultedOptions, { listeners: false })
  }, [defaultedOptions, observer])

  // Duc - is this react specific suspense logic?
  // Duc - I guess we don't need this for Angular
  // Handle suspense
  // if (
  //   defaultedOptions.suspense &&
  //   result.isLoading &&
  //   result.isFetching &&
  //   !isRestoring
  // ) {
  //   throw observer
  //     .fetchOptimistic(defaultedOptions)
  //     .then(({ data }) => {
  //       defaultedOptions.onSuccess?.(data as TData)
  //       defaultedOptions.onSettled?.(data, null)
  //     })
  //     .catch((error) => {
  //       errorResetBoundary.clearReset()
  //       defaultedOptions.onError?.(error)
  //       defaultedOptions.onSettled?.(undefined, error)
  //     })
  // }

  // Duc - is this react specific suspense logic?
  // Duc - I guess we don't need this for Angular
  // Handle error boundary
  // if (
  //   getHasError({
  //     result,
  //     errorResetBoundary,
  //     useErrorBoundary: defaultedOptions.useErrorBoundary,
  //     query: observer.getCurrentQuery(),
  //   })
  // ) {
  //   throw result.error
  // }

  // Handle result property usage tracking
  return !defaultedOptions.notifyOnChangeProps
    ? observer.trackResult(result)
    : result
}
