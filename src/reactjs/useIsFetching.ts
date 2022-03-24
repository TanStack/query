import React from 'react'

import { notifyManager } from '../core/notifyManager'
import { QueryKey } from '../core/types'
import { ContextOptions } from '../reactjs/types'
import { parseFilterArgs, QueryFilters } from '../core/utils'
import { QueryClient } from '../core'
import { useQueryClient } from './QueryClientProvider'

interface Options extends ContextOptions {}

const checkIsFetching = (
  queryClient: QueryClient,
  filters: QueryFilters,
  isFetching: number,
  setIsFetching: React.Dispatch<React.SetStateAction<number>>
) => {
  const newIsFetching = queryClient.isFetching(filters)
  if (isFetching !== newIsFetching) {
    setIsFetching(newIsFetching)
  }
}

export function useIsFetching(filters?: QueryFilters, options?: Options): number
export function useIsFetching(
  queryKey?: QueryKey,
  filters?: QueryFilters,
  options?: Options
): number
export function useIsFetching(
  arg1?: QueryKey | QueryFilters,
  arg2?: QueryFilters | Options,
  arg3?: Options
): number {
  const mountedRef = React.useRef(false)

  const [filters, options = {}] = parseFilterArgs(arg1, arg2, arg3)

  const queryClient = useQueryClient({ context: options.context })

  const [isFetching, setIsFetching] = React.useState(
    queryClient.isFetching(filters)
  )

  const filtersRef = React.useRef(filters)
  filtersRef.current = filters
  const isFetchingRef = React.useRef(isFetching)
  isFetchingRef.current = isFetching

  React.useEffect(() => {
    mountedRef.current = true

    checkIsFetching(
      queryClient,
      filtersRef.current,
      isFetchingRef.current,
      setIsFetching
    )

    const unsubscribe = queryClient.getQueryCache().subscribe(
      notifyManager.batchCalls(() => {
        if (mountedRef.current) {
          checkIsFetching(
            queryClient,
            filtersRef.current,
            isFetchingRef.current,
            setIsFetching
          )
        }
      })
    )

    return () => {
      mountedRef.current = false
      unsubscribe()
    }
  }, [queryClient])

  return isFetching
}
