import React from 'react'

import { notifyManager } from '../core/notifyManager'
import { QueryKey } from '../core/types'
import { MutationFilters, parseMutationFilterArgs } from '../core/utils'
import { useQueryClient } from './QueryClientProvider'
import { useIsMounted } from './utils'

export function useIsMutating(filters?: MutationFilters): number
export function useIsMutating(
  queryKey?: QueryKey,
  filters?: MutationFilters
): number
export function useIsMutating(
  arg1?: QueryKey | MutationFilters,
  arg2?: MutationFilters
): number {
  const isMounted = useIsMounted()
  const filters = parseMutationFilterArgs(arg1, arg2)

  const queryClient = useQueryClient()

  const [isMutating, setIsMutating] = React.useState(
    queryClient.isMutating(filters)
  )

  const filtersRef = React.useRef(filters)
  filtersRef.current = filters
  const isMutatingRef = React.useRef(isMutating)
  isMutatingRef.current = isMutating

  React.useEffect(() => {
    const unsubscribe = queryClient.getMutationCache().subscribe(
      notifyManager.batchCalls(() => {
        if (isMounted()) {
          const newIsMutating = queryClient.isMutating(filtersRef.current)
          if (isMutatingRef.current !== newIsMutating) {
            setIsMutating(newIsMutating)
          }
        }
      })
    )

    return () => {
      unsubscribe()
    }
  }, [queryClient, isMounted])

  return isMutating
}
