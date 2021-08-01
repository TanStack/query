import React from 'react'

import { notifyManager } from '../core/notifyManager'
import { QueryKey } from '../core/types'
import { parseFilterArgs, QueryFilters } from '../core/utils'
import { useQueryClient } from './QueryClientProvider'

export function useIsError(filters?: QueryFilters): number
export function useIsError(queryKey?: QueryKey, filters?: QueryFilters): number
export function useIsError(
  arg1?: QueryKey | QueryFilters,
  arg2?: QueryFilters
): number {
  const mountedRef = React.useRef(false)

  const queryClient = useQueryClient()

  const [filters] = parseFilterArgs(arg1, arg2)
  const [isError, setIsError] = React.useState(queryClient.isError(filters))

  const filtersRef = React.useRef(filters)
  filtersRef.current = filters
  const isErrorRef = React.useRef(isError)
  isErrorRef.current = isError

  React.useEffect(() => {
    mountedRef.current = true

    const unsubscribe = queryClient.getQueryCache().subscribe(
      notifyManager.batchCalls(() => {
        if (mountedRef.current) {
          const newIsError = queryClient.isError(filtersRef.current)
          if (isErrorRef.current !== newIsError) {
            setIsError(newIsError)
          }
        }
      })
    )

    return () => {
      mountedRef.current = false
      unsubscribe()
    }
  }, [queryClient])

  return isError
}
