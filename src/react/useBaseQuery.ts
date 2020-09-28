import React from 'react'

import { useIsMounted } from './utils'
import { QueryObserver } from '../core/queryObserver'
import { useQueryErrorResetBoundary } from './QueryErrorResetBoundary'
import { useQueryClient } from './QueryClientProvider'
import { UseQueryOptions, UseQueryResult } from './types'

export function useBaseQuery<TData, TError, TQueryFnData, TQueryData>(
  options: UseQueryOptions<TData, TError, TQueryFnData, TQueryData>
): UseQueryResult<TData, TError> {
  const client = useQueryClient()
  const isMounted = useIsMounted()
  const errorResetBoundary = useQueryErrorResetBoundary()
  const defaultedOptions = client.defaultQueryObserverOptions(options)

  // Always set stale time when using suspense
  if (defaultedOptions.suspense && !defaultedOptions.staleTime) {
    options.staleTime = 5000
  }

  // Create query observer
  const observerRef = React.useRef<
    QueryObserver<TData, TError, TQueryFnData, TQueryData>
  >()
  const firstRender = !observerRef.current
  const observer = observerRef.current || client.watchQuery(options)
  observerRef.current = observer

  // Update options
  if (!firstRender) {
    observer.setOptions(options)
  }

  const [currentResult, setCurrentResult] = React.useState(() =>
    observer.getCurrentResult()
  )
  const currentOptions = observer.options

  // Subscribe to the observer
  React.useEffect(() => {
    errorResetBoundary.clearReset()
    return observer.subscribe(result => {
      if (isMounted()) {
        setCurrentResult(result)
      }
    })
  }, [isMounted, observer, setCurrentResult, errorResetBoundary])

  // Handle suspense
  if (currentOptions.suspense || currentOptions.useErrorBoundary) {
    if (currentResult.isError && !errorResetBoundary.isReset()) {
      throw currentResult.error
    }

    if (
      currentOptions.enabled !== false &&
      currentOptions.suspense &&
      !currentResult.isSuccess
    ) {
      errorResetBoundary.clearReset()
      const unsubscribe = observer.subscribe()
      throw observer.fetch().finally(unsubscribe)
    }
  }

  return currentResult
}
