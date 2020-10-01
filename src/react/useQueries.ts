import React from 'react'

import { useIsMounted } from './utils'
import { QueriesObserver } from '../core/queriesObserver'
import { useQueryClient } from './QueryClientProvider'
import { UseQueryOptions, UseQueryResult } from './types'

export function useQueries(queries: UseQueryOptions[]): UseQueryResult[] {
  const client = useQueryClient()
  const isMounted = useIsMounted()

  // Create queries observer
  const observerRef = React.useRef<QueriesObserver>()
  const firstRender = !observerRef.current
  const observer = observerRef.current || client.watchQueries(queries)
  observerRef.current = observer

  // Update queries
  if (!firstRender) {
    observer.setQueries(queries)
  }

  const [currentResult, setCurrentResult] = React.useState(() =>
    observer.getCurrentResult()
  )

  // Subscribe to the observer
  React.useEffect(
    () =>
      observer.subscribe(result => {
        if (isMounted()) {
          setCurrentResult(result)
        }
      }),
    [isMounted, observer]
  )

  return currentResult
}
