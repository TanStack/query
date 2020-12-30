import React from 'react'
import { QueryObserver } from '../core'

import { notifyManager } from '../core/notifyManager'
import { QueriesObserver } from '../core/queriesObserver'
import { useQueryClient } from './QueryClientProvider'
import { UseQueryOptions, UseQueryResult } from './types'

export function useQueries<TData, TError>(
  queries: UseQueryOptions<TData, TError>[]
): UseQueryResult<TData, TError>[] {
  return useQueriesObserver(queries, QueryObserver)
}

export function useQueriesObserver<TData = unknown, TError = unknown>(
  queries: UseQueryOptions<TData, TError>[],
  Observer: typeof QueryObserver
): UseQueryResult<TData, TError>[] {
  const queryClient = useQueryClient()

  // Create queries observer
  const observerRef = React.useRef<QueriesObserver<TData, TError>>()
  const observer =
    observerRef.current ||
    new QueriesObserver<TData, TError>(queryClient, queries, Observer)
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
