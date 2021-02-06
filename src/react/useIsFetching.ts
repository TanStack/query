import React from 'react'

import { notifyManager } from '../core/notifyManager'
import { QueryKey } from '../core/types'
import { parseFilterArgs, QueryFilters } from '../core/utils'
import { useQueryClient } from './QueryClientProvider'
import { useIsMounted } from './useIsMounted'

export function useIsFetching(filters?: QueryFilters): number
export function useIsFetching(
  queryKey?: QueryKey,
  filters?: QueryFilters
): number
export function useIsFetching(
  arg1?: QueryKey | QueryFilters,
  arg2?: QueryFilters
): number {
  const isMounted = useIsMounted()
  const queryClient = useQueryClient()
  const [filters] = parseFilterArgs(arg1, arg2)
  const [isFetching, setIsFetching] = React.useState(
    queryClient.isFetching(filters)
  )

  const filtersRef = React.useRef(filters)
  filtersRef.current = filters
  const isFetchingRef = React.useRef(isFetching)
  isFetchingRef.current = isFetching

  React.useEffect(
    () =>
      queryClient.getQueryCache().subscribe(
        notifyManager.batchCalls(() => {
          if (isMounted()) {
            const newIsFetching = queryClient.isFetching(filtersRef.current)
            if (isFetchingRef.current !== newIsFetching) {
              setIsFetching(newIsFetching)
            }
          }
        })
      ),
    [queryClient, isMounted]
  )

  return isFetching
}
