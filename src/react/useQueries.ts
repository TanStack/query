import React from 'react'

import { notifyManager } from '../core/notifyManager'
import { QueriesObserver } from '../core/queriesObserver'
import { useQueryClient } from './QueryClientProvider'
import { UseQueryOptions, UseQueryResult } from './types'

export function useQueries<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData
>(
  queries: UseQueryOptions<TQueryFnData, TError, TData>[]
): UseQueryResult<TData, TError>[] {
  const queryClient = useQueryClient()

  // Create queries observer
  const observerRef = React.useRef<
    QueriesObserver<TQueryFnData, TError, TData>
  >()
  const observer =
    observerRef.current ||
    new QueriesObserver<TQueryFnData, TError, TData>(queryClient, queries)
  observerRef.current = observer

  // Update queries
  if (observer.hasListeners()) {
    observer.setQueries(queries)
  }

  const [currentResult, setCurrentResult] = React.useState(() =>
    observer.getCurrentResult()
  )

  // Subscribe to the observer
  React.useEffect(
    () => observer.subscribe(notifyManager.batchCalls(setCurrentResult)),
    [observer]
  )

  return currentResult
}
