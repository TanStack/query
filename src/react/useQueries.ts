import React from 'react'

import { notifyManager } from '../core/notifyManager'
import { QueriesObserver } from '../core/queriesObserver'
import { useQueryClient } from './QueryClientProvider'
import { useQueryErrorResetBoundary } from './QueryErrorResetBoundary'
import { UseQueryOptions, UseQueryResult } from './types'

export function useQueries<TData = unknown, TError = unknown>(
  queries: UseQueryOptions[]
): UseQueryResult<TData, TError>[] {
  const queryClient = useQueryClient()
  const errorResetBoundary = useQueryErrorResetBoundary()
  const defaultedQueries: UseQueryOptions[] = []

  let someSuspense = false
  let someUseErrorBoundary = false

  queries.forEach(options => {
    const defaulted = queryClient.defaultQueryObserverOptions(options)

    // Include callbacks in batch renders
    if (defaulted.onError) {
      defaulted.onError = notifyManager.batchCalls(defaulted.onError)
    }

    if (defaulted.onSuccess) {
      defaulted.onSuccess = notifyManager.batchCalls(defaulted.onSuccess)
    }

    if (defaulted.onSettled) {
      defaulted.onSettled = notifyManager.batchCalls(defaulted.onSettled)
    }

    if (defaulted.suspense) {
      someSuspense = true
    }

    if (defaulted.useErrorBoundary) {
      someUseErrorBoundary = true
    }

    defaultedQueries.push(defaulted)
  })

  if (someSuspense) {
    defaultedQueries.forEach(options => {
      // Always set stale time when using suspense to prevent
      // fetching again when directly re-mounting after suspense
      if (typeof options.staleTime !== 'number') {
        options.staleTime = 1000
      }

      // Prevent retrying failed query if the error boundary has not been reset yet
      if (!errorResetBoundary.isReset()) {
        options.retryOnMount = false
      }
    })
  }

  // Create queries observer
  const observerRef = React.useRef<QueriesObserver>()
  const observer =
    observerRef.current || new QueriesObserver(queryClient, defaultedQueries)
  observerRef.current = observer

  // Update queries
  if (observer.hasListeners()) {
    observer.setQueries(defaultedQueries)
  }

  const [currentResult, setCurrentResult] = React.useState(() =>
    observer.getCurrentResult()
  )

  let someError
  let someIsLoading = false
  let someIsError = false

  currentResult.forEach(result => {
    if (result.isLoading) {
      someIsLoading = true
    }

    if (result.isError) {
      someIsError = true
    }

    if (result.error) {
      someError = result.error
    }
  })

  // Subscribe to the observer
  React.useEffect(() => {
    errorResetBoundary.clearReset()
    return observer.subscribe(notifyManager.batchCalls(setCurrentResult))
  }, [observer, errorResetBoundary])

  // Handle suspense
  if (someSuspense || someUseErrorBoundary) {
    if (someSuspense && someIsLoading) {
      errorResetBoundary.clearReset()
      const unsubscribe = observer.subscribe()
      throw observer
        .refetch({ filter: x => x.getCurrentResult().isLoading })
        .finally(unsubscribe)
    }

    if (someIsError) {
      throw someError
    }
  }

  return currentResult as UseQueryResult<TData, TError>[]
}
