import React from 'react'

import { notifyManager } from '../core/notifyManager'
import { QueriesObserver } from '../core/queriesObserver'
import { useQueryClient } from './QueryClientProvider'
import { UseQueryOptions, UseQueryResult } from './types'

export function useQueries(queries: UseQueryOptions[]): UseQueryResult[] {
  const queryClient = useQueryClient()

  // Create queries observer
  const observerRef = React.useRef<QueriesObserver>()
  const observer =
    observerRef.current || new QueriesObserver(queryClient, queries)
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
