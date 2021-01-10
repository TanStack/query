import React from 'react'

import { notifyManager } from '../core/notifyManager'
import { QueriesObserver } from '../core/queriesObserver'
import { useQueryClient } from './QueryClientProvider'
import { UseQueryOptions, UseQueryResult } from './types'

type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T

export function useQueries<TQueries extends readonly UseQueryOptions[]>(
  queries: [...TQueries]
): {
  [ArrayElement in keyof TQueries]: UseQueryResult<
    TQueries[ArrayElement] extends { select: any }
      ? unknown
      : Awaited<
          ReturnType<
            NonNullable<
              Extract<TQueries[ArrayElement], UseQueryOptions>['queryFn']
            >
          >
        >
  >
} {
  const queryClient = useQueryClient()

  // Create queries observer
  const observerRef = React.useRef<QueriesObserver>()
  const observer =
    observerRef.current ||
    new QueriesObserver(
      queryClient,
      queries as UseQueryOptions<unknown, unknown, unknown>[]
    )
  observerRef.current = observer

  // Update queries
  if (observer.hasListeners()) {
    observer.setQueries(queries as UseQueryOptions<unknown, unknown, unknown>[])
  }

  const [currentResult, setCurrentResult] = React.useState(() =>
    observer.getCurrentResult()
  )

  // Subscribe to the observer
  React.useEffect(
    () => observer.subscribe(notifyManager.batchCalls(setCurrentResult)),
    [observer]
  )

  return currentResult as any
}
