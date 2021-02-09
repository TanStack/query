import React from 'react'

import { notifyManager } from '../core/notifyManager'
import { QueryObserver } from '../core/queryObserver'
import { useQueryErrorResetBoundary } from './QueryErrorResetBoundary'
import { useQueryClient } from './QueryClientProvider'
import { UseBaseQueryOptions } from './types'

export function useBaseQuery<TQueryFnData, TError, TData, TQueryData>(
  options: UseBaseQueryOptions<TQueryFnData, TError, TData, TQueryData>,
  Observer: typeof QueryObserver
) {
  const mountedRef = React.useRef(false)
  const [, forceUpdate] = React.useState(0)

  const queryClient = useQueryClient()
  const errorResetBoundary = useQueryErrorResetBoundary()
  const defaultedOptions = queryClient.defaultQueryObserverOptions(options)

  // Make sure results are optimistically set in fetching state before subscribing or updating options
  defaultedOptions.optimisticResults = true

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

  if (defaultedOptions.suspense) {
    // Always set stale time when using suspense to prevent
    // fetching again when directly re-mounting after suspense
    if (typeof defaultedOptions.staleTime !== 'number') {
      defaultedOptions.staleTime = 1000
    }
  }

  if (defaultedOptions.suspense || defaultedOptions.useErrorBoundary) {
    // Prevent retrying failed query if the error boundary has not been reset yet
    if (!errorResetBoundary.isReset()) {
      defaultedOptions.retryOnMount = false
    }
  }

  const obsRef = React.useRef<QueryObserver<any, any>>()

  if (!obsRef.current) {
    obsRef.current = new Observer(queryClient, defaultedOptions)
  }

  let result = obsRef.current.getOptimisticResult(defaultedOptions)

  React.useEffect(() => {
    mountedRef.current = true

    const unsubscribe = obsRef.current!.subscribe(
      notifyManager.batchCalls(() => {
        errorResetBoundary.clearReset()
        if (mountedRef.current) {
          forceUpdate(x => x + 1)
        }
      })
    )

    // Update result to make sure we did not miss any query updates
    // between creating the observer and subscribing to it.
    obsRef.current!.updateResult()

    return () => {
      mountedRef.current = false
      unsubscribe()
    }
  }, [errorResetBoundary])

  React.useEffect(() => {
    // Do not notify on updates because of changes in the options because
    // these changes should already be reflected in the optimistic result.
    obsRef.current!.setOptions(defaultedOptions, { listeners: false })
  }, [defaultedOptions])

  // Handle suspense
  if (obsRef.current.options.suspense && result.isLoading) {
    throw queryClient
      .fetchQuery(defaultedOptions)
      .then(data => {
        defaultedOptions.onSuccess?.(data)
        defaultedOptions.onSettled?.(data, null)
      })
      .catch(error => {
        errorResetBoundary.clearReset()
        defaultedOptions.onError?.(error)
        defaultedOptions.onSettled?.(undefined, error)
      })
  }

  // Handle error boundary
  if (
    (obsRef.current.options.suspense ||
      obsRef.current.options.useErrorBoundary) &&
    result.isError
  ) {
    throw result.error
  }

  // Handle result property usage tracking
  if (obsRef.current.options.notifyOnChangeProps === 'tracked') {
    result = obsRef.current.trackResult(result)
  }

  return result
}
