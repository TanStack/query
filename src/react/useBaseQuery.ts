import React from 'react'

import { QueryClient, QueryKey } from '../core'
import { notifyManager } from '../core/notifyManager'
import { QueryObserver } from '../core/queryObserver'
import { useQueryErrorResetBoundary } from './QueryErrorResetBoundary'
import { useQueryClient } from './QueryClientProvider'
import { UseBaseQueryOptions } from './types'

function configureNotifyManager<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey
>({ options }: {
  options: UseBaseQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >
}) {
  // Include callbacks in batch renders
  if (options.onError) {
    options.onError = notifyManager.batchCalls(
      options.onError
    )
  }

  if (options.onSuccess) {
    options.onSuccess = notifyManager.batchCalls(
      options.onSuccess
    )
  }

  if (options.onSettled) {
    options.onSettled = notifyManager.batchCalls(
      options.onSettled
    )
  }
}

export function initDefaultedOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey
>({ errorResetBoundary, options, queryClient }: {
  errorResetBoundary: ReturnType<typeof useQueryErrorResetBoundary>
  options: UseBaseQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >,
  queryClient: QueryClient
}) {
  const defaultedOptions = queryClient.defaultQueryObserverOptions(options)

  // Make sure results are optimistically set in fetching state before subscribing or updating options
  defaultedOptions.optimisticResults = true

  configureNotifyManager({ options: defaultedOptions })

  if (defaultedOptions.suspense) {
    // Always set stale time when using suspense to prevent
    // fetching again when directly mounting after suspending
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

  return defaultedOptions;
}

export function useBaseQuery<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey
>(
  options: UseBaseQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >,
  Observer: typeof QueryObserver
) {
  const mountedRef = React.useRef(false)
  const [, forceUpdate] = React.useState(0)

  const queryClient = useQueryClient()
  const errorResetBoundary = useQueryErrorResetBoundary()
  const defaultedOptions = initDefaultedOptions({ errorResetBoundary, options, queryClient });

  const obsRef = React.useRef<
    QueryObserver<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  >()

  if (!obsRef.current) {
    obsRef.current = new Observer<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    >(queryClient, defaultedOptions)
  }

  let result = obsRef.current.getOptimisticResult(defaultedOptions)

  React.useEffect(() => {
    mountedRef.current = true

    errorResetBoundary.clearReset()

    const unsubscribe = obsRef.current!.subscribe(
      notifyManager.batchCalls(() => {
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
  if (defaultedOptions.suspense && result.isLoading) {
    throw obsRef.current
      .fetchOptimistic(defaultedOptions)
      .then(({ data }) => {
        defaultedOptions.onSuccess?.(data as TData)
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
    (defaultedOptions.suspense || defaultedOptions.useErrorBoundary) &&
    result.isError
  ) {
    throw result.error
  }

  // Handle result property usage tracking
  if (defaultedOptions.notifyOnChangeProps === 'tracked') {
    result = obsRef.current.trackResult(result)
  }

  return result
}
