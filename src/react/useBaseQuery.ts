import React from 'react'

import { useIsMounted } from './utils'
import { QueryObserver } from '../core/queryObserver'
import { useQueryErrorResetBoundary } from './QueryErrorResetBoundary'
import { useQueryClient } from './QueryClientProvider'
import { UseBaseQueryOptions } from './types'

export function useBaseQuery<TData, TError, TQueryFnData, TQueryData>(
  options: UseBaseQueryOptions<TData, TError, TQueryFnData, TQueryData>,
  Observer: typeof QueryObserver
) {
  const queryClient = useQueryClient()
  const isMounted = useIsMounted()
  const errorResetBoundary = useQueryErrorResetBoundary()
  const defaultedOptions = queryClient.defaultQueryObserverOptions(options)

  // Always set stale time when using suspense
  if (defaultedOptions.suspense && !defaultedOptions.staleTime) {
    defaultedOptions.staleTime = 2000
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

  const [currentResult, setCurrentResult] = React.useState(() =>
    observer.getCurrentResult()
  )

  // Subscribe to the observer
  React.useEffect(() => {
    errorResetBoundary.clearReset()
    return observer.subscribe(result => {
      if (isMounted()) {
        setCurrentResult(result)
      }
    })
  }, [isMounted, observer, errorResetBoundary])

  // Handle suspense
  if (observer.options.suspense || observer.options.useErrorBoundary) {
    if (currentResult.isError && !errorResetBoundary.isReset()) {
      throw currentResult.error
    }

    if (
      observer.options.suspense &&
      !observer.hasListeners() &&
      observer.willFetchOnMount()
    ) {
      errorResetBoundary.clearReset()
      throw observer.getNextResult({ throwOnError: true })
    }
  }

  return currentResult
}
