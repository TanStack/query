import React from 'react'

import { notifyManager } from '../core/notifyManager'
import { QueryObserver } from '../core/queryObserver'
import { QueryObserverResult } from '../core/types'
import { useQueryErrorResetBoundary } from './QueryErrorResetBoundary'
import { useQueryClient } from './QueryClientProvider'
import { UseBaseQueryOptions } from './types'

export function useBaseQuery<TQueryFnData, TError, TData, TQueryData>(
  options: UseBaseQueryOptions<TQueryFnData, TError, TData, TQueryData>,
  Observer: typeof QueryObserver
) {
  const queryClient = useQueryClient()
  const errorResetBoundary = useQueryErrorResetBoundary()
  const defaultedOptions = queryClient.defaultQueryObserverOptions(options)

  // Include callbacks in batch renders
  if (defaultedOptions.onError) {
    defaultedOptions.onError = notifyManager.batchCalls(
      defaultedOptions.onError
    )
  }

  if (defaultedOptions.onSuccess) {
    defaultedOptions.onSuccess = notifyManager.batchCalls(
      defaultedOptions.onSuccess
    )
  }

  if (defaultedOptions.onSettled) {
    defaultedOptions.onSettled = notifyManager.batchCalls(
      defaultedOptions.onSettled
    )
  }

  // Always set stale time when using suspense to prevent
  // fetching again when directly re-mounting after suspense
  if (
    defaultedOptions.suspense &&
    typeof defaultedOptions.staleTime !== 'number'
  ) {
    defaultedOptions.staleTime = 1000
  }

  // Create query observer
  const observerRef = React.useRef<QueryObserver<any, any, any, any>>()
  const observer =
    observerRef.current || new Observer(queryClient, defaultedOptions)
  observerRef.current = observer

  // Update options
  if (observer.hasListeners()) {
    observer.setOptions(defaultedOptions)
  }

  const [, rerender] = React.useState({})
  const currentResult = observer.getCurrentResult()

  // Remember latest result to prevent redundant renders
  const latestResultRef = React.useRef(currentResult)
  latestResultRef.current = currentResult

  // Subscribe to the observer
  React.useEffect(() => {
    errorResetBoundary.clearReset()
    return observer.subscribe(
      notifyManager.batchCalls((result: QueryObserverResult) => {
        if (result !== latestResultRef.current) {
          rerender({})
        }
      })
    )
  }, [observer, errorResetBoundary])

  // Handle suspense
  if (observer.options.suspense || observer.options.useErrorBoundary) {
    if (
      currentResult.isError &&
      !errorResetBoundary.isReset() &&
      !observer.getCurrentQuery().isFetching()
    ) {
      throw currentResult.error
    }

    if (observer.options.suspense && currentResult.isLoading) {
      errorResetBoundary.clearReset()
      const unsubscribe = observer.subscribe()
      throw observer.refetch().finally(unsubscribe)
    }
  }

  return currentResult
}
