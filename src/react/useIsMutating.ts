import React from 'react'

import { notifyManager } from '../core/notifyManager'
import { MutationFilters } from '../core/utils'
import { useQueryClient } from './QueryClientProvider'

export function useIsMutating(filters?: MutationFilters): number {
  const mountedRef = React.useRef(false)

  const queryClient = useQueryClient()

  const [isMutating, setIsMutating] = React.useState(
    queryClient.isMutating(filters)
  )

  const filtersRef = React.useRef(filters)
  filtersRef.current = filters
  const isMutatingRef = React.useRef(isMutating)
  isMutatingRef.current = isMutating

  React.useEffect(() => {
    mountedRef.current = true

    const unsubscribe = queryClient.getMutationCache().subscribe(
      notifyManager.batchCalls(() => {
        if (mountedRef.current) {
          const newIsMutating = queryClient.isMutating(filtersRef.current)
          if (isMutatingRef.current !== newIsMutating) {
            setIsMutating(newIsMutating)
          }
        }
      })
    )

    return () => {
      mountedRef.current = false
      unsubscribe()
    }
  }, [queryClient])

  return isMutating
}
