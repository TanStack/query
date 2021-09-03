import React from 'react'

import { notifyManager } from '../core/notifyManager'
import { QueriesObserver } from '../core/queriesObserver'
import { InitialDataFunction, PlaceholderDataFunction } from '../core/types'
import { useQueryClient } from './QueryClientProvider'
import { UseQueryOptions, UseQueryResult } from './types'

type InferredQueryOptions<TQueryFnData> = Omit<
  UseQueryOptions<TQueryFnData, unknown, TQueryFnData>,
  'select' | 'initialData' | 'placeholderData'
> & {
  select?: (data: TQueryFnData) => unknown
  initialData?: TQueryFnData extends infer TInitialData
    ? TInitialData | InitialDataFunction<TInitialData>
    : never
  placeholderData?: TQueryFnData extends infer TPlaceholderData
  ? TPlaceholderData | PlaceholderDataFunction<TPlaceholderData>
  : never
}

type QueriesOptions<T> = { [E in keyof T]: InferredQueryOptions<T[E]> }
type QueriesResults<T> = { [E in keyof T]: UseQueryResult<T[E]> }

export function useQueries<TQueriesFnData extends unknown[]>(
  queries: [...QueriesOptions<TQueriesFnData>]
): QueriesResults<TQueriesFnData> {
  const mountedRef = React.useRef(false)
  const [, forceUpdate] = React.useState(0)

  const queryClient = useQueryClient()

  const defaultedQueries = queries.map(options => {
    const defaultedOptions = queryClient.defaultQueryObserverOptions(options)

    // Make sure the results are already in fetching state before subscribing or updating options
    defaultedOptions.optimisticResults = true

    return defaultedOptions
  })

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

  return result as QueriesResults<TQueriesFnData>
}
