import * as React from 'react'

import type { MutationFilters } from '@tanstack/query-core'
import { notifyManager, replaceEqualDeep } from '@tanstack/query-core'
import type { ContextOptions } from './types'
import { useQueryClient } from './QueryClientProvider'

interface Options extends ContextOptions {}

export function useIsMutating(
  filters?: MutationFilters,
  options: Options = {},
): number {
  const queryClient = useQueryClient({ context: options.context })
  return useMutationState(() => queryClient.isMutating(filters), options)
}

export function useMutationVariables<TVariables = unknown>(
  filters?: MutationFilters,
  options: Options = {},
): Array<TVariables> {
  const queryClient = useQueryClient({ context: options.context })
  return useMutationState(
    () => queryClient.getMutationVariables(filters),
    options,
  )
}

function useMutationState<T>(selector: () => T, options: Options = {}): T {
  const queryClient = useQueryClient({ context: options.context })
  const mutationCache = queryClient.getMutationCache()
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
