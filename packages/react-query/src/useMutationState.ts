import * as React from 'react'

import type { MutationFilters, QueryClient } from '@tanstack/query-core'
import { notifyManager, replaceEqualDeep } from '@tanstack/query-core'
import { useQueryClient } from './QueryClientProvider'

export function useIsMutating(
  filters?: MutationFilters,
  queryClient?: QueryClient,
): number {
  const client = useQueryClient(queryClient)
  return useMutationState(() => client.isMutating(filters))
}

export function useMutationVariables<TVariables = unknown>(
  filters?: MutationFilters,
  queryClient?: QueryClient,
): Array<TVariables> {
  const client = useQueryClient(queryClient)
  return useMutationState(() => client.getMutationVariables(filters))
}

function useMutationState<T>(selector: () => T, queryClient?: QueryClient): T {
  const mutationCache = useQueryClient(queryClient).getMutationCache()
  const selectorRef = React.useRef(selector)
  const result = React.useRef<T>()
  if (!result.current) {
    result.current = selector()
  }

  React.useEffect(() => {
    selectorRef.current = selector
  })

  return React.useSyncExternalStore(
    React.useCallback(
      (onStoreChange) =>
        mutationCache.subscribe(() => {
          const nextResult = replaceEqualDeep(
            result.current,
            selectorRef.current(),
          )
          if (result.current !== nextResult) {
            result.current = nextResult
            notifyManager.schedule(onStoreChange)
          }
        }),
      [mutationCache],
    ),
    () => result.current,
    () => result.current,
  )!
}
