import React from 'react'

import { notifyManager } from '../core/notifyManager'
import { MutationKey } from '../core/types'
import { ContextOptions } from '../reactjs/types'
import { MutationFilters, parseMutationFilterArgs } from '../core/utils'
import { useQueryClient } from './QueryClientProvider'

interface Options extends ContextOptions {}

export function useIsMutating(
  filters?: MutationFilters,
  options?: Options
): number
export function useIsMutating(
  mutationKey?: MutationKey,
  filters?: Omit<MutationFilters, 'mutationKey'>,
  options?: Options
): number
export function useIsMutating(
  arg1?: MutationKey | MutationFilters,
  arg2?: Omit<MutationFilters, 'mutationKey'> | Options,
  arg3?: Options
): number {
  const mountedRef = React.useRef(false)
  const [filters, options = {}] = parseMutationFilterArgs(arg1, arg2, arg3)

  const queryClient = useQueryClient({ context: options.context })

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
