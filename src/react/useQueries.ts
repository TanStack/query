import React from 'react'

import { useIsMounted } from './utils'
import { QueriesObserver } from '../core/queriesObserver'
import { useEnvironment } from './EnvironmentProvider'
import { UseQueryOptions, UseQueryResult } from './types'

export function useQueries(queries: UseQueryOptions[]): UseQueryResult[] {
  const environment = useEnvironment()
  const isMounted = useIsMounted()

  // Create queries observer
  const observerRef = React.useRef<QueriesObserver>()
  const observer =
    observerRef.current || new QueriesObserver(environment, queries)
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
      observer.subscribe(result => {
        if (isMounted()) {
          setCurrentResult(result)
        }
      }),
    [isMounted, observer]
  )

  return currentResult
}
