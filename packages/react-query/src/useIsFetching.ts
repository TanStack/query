'use client'
import * as React from 'react'
import { notifyManager } from '@tanstack/query-core'

import { useQueryClient } from './QueryClientProvider'
import type { QueryClient, QueryFilters } from '@tanstack/query-core'

export function useIsFetching(
  filters?: QueryFilters,
  queryClient?: QueryClient,
): number {
  const client = useQueryClient(queryClient)
  const queryCache = client.getQueryCache()

  const [number, setNumber] = React.useState<number>(() =>
    client.isFetching(filters),
  )

  const filtersRef = React.useRef(filters)
  React.useEffect(() => {
    filtersRef.current = filters
  })

  React.useEffect(() => {
    // Update number immediately to make sure we do not miss any query updates between creating the observer and subscribing to it.
    // Updating to the same value is a no-op, so it's safe to do this.
    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
    setNumber(client.isFetching(filtersRef.current))

    return queryCache.subscribe(
      notifyManager.batchCalls(() => {
        setNumber(client.isFetching(filtersRef.current))
      }),
    )
  }, [client, queryCache])

  return number
}
