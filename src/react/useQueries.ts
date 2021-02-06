import React from 'react'

import { QueryObserverResult } from '../core/types'
import { notifyManager } from '../core/notifyManager'
import { QueriesObserver } from '../core/queriesObserver'
import { useQueryClient } from './QueryClientProvider'
import { UseQueryOptions, UseQueryResult } from './types'
import { useIsMounted } from './useIsMounted'

export function useQueries(queries: UseQueryOptions[]): UseQueryResult[] {
  const isMounted = useIsMounted()
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
    () =>
      observer.subscribe(
        notifyManager.batchCalls((result: QueryObserverResult[]) => {
          if (isMounted()) {
            setCurrentResult(result)
          }
        })
      ),
    [observer, isMounted]
  )

  return currentResult
}
