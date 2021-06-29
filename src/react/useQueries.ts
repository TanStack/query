import React from 'react'

import { notifyManager } from '../core/notifyManager'
import { QueriesObserver } from '../core/queriesObserver'
import { useQueryClient } from './QueryClientProvider'
import { useQueryErrorResetBoundary } from './QueryErrorResetBoundary'
import { UseQueryOptions, UseQueryResult } from './types'
import { initDefaultedOptions } from './useBaseQuery'

export function useQueries(queries: UseQueryOptions[]): UseQueryResult[] {
  const mountedRef = React.useRef(false)
  const [, forceUpdate] = React.useState(0)

  const queryClient = useQueryClient()
  const errorResetBoundary = useQueryErrorResetBoundary();

  const defaultedQueries = queries.map((options) => initDefaultedOptions({ errorResetBoundary, options, queryClient }))

  const [observer] = React.useState(
    () => new QueriesObserver(queryClient, defaultedQueries)
  )

  const result = observer.getOptimisticResult(defaultedQueries)

  React.useEffect(() => {
    mountedRef.current = true

    const unsubscribe = observer.subscribe(
      notifyManager.batchCalls(() => {
        if (mountedRef.current) {
          forceUpdate(x => x + 1)
        }
      })
    )

    return () => {
      mountedRef.current = false
      unsubscribe()
    }
  }, [observer])

  React.useEffect(() => {
    // Do not notify on updates because of changes in the options because
    // these changes should already be reflected in the optimistic result.
    observer.setQueries(defaultedQueries, { listeners: false })
  }, [defaultedQueries, observer])


  const someSuspense = defaultedQueries.some((q) => q.suspense);
  const someUseErrorBoundary = defaultedQueries.some((q) => q.useErrorBoundary);
  const firstResultWithError = result.find((r) => r.isError);
  const someError = firstResultWithError?.error;
  const someIsError = !!firstResultWithError;
  const someIsLoading = result.some((r) => r.isLoading);

  // Handle suspense
  if (someSuspense || someUseErrorBoundary) {
    if (someSuspense && someIsLoading) {
      errorResetBoundary.clearReset()
      const unsubscribe = obsRef.current.subscribe()
      throw obsRef
        .current.refetch({ filter: x => x.getCurrentResult().isLoading })
        .finally(unsubscribe)
    }

    if (someIsError) {
      throw someError
    }
  }

  return result
}
