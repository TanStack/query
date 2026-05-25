'use client'
import * as React from 'react'

import { notifyManager, replaceEqualDeep } from '@tanstack/query-core'
import { useQueryClient } from './QueryClientProvider'
import type {
  Mutation,
  MutationCache,
  MutationFilters,
  MutationState,
  QueryClient,
} from '@tanstack/query-core'

export function useIsMutating(
  filters?: MutationFilters,
  queryClient?: QueryClient,
): number {
  const client = useQueryClient(queryClient)
  return useMutationState(
    { filters: { ...filters, status: 'pending' } },
    client,
  ).length
}

type MutationStateOptions<
  TResult = MutationState,
  TMutation extends Mutation<any, any, any, any> = Mutation,
> = {
  filters?: MutationFilters
  select?: (mutation: TMutation) => TResult
}

function getResult<TResult = MutationState, TMutation extends Mutation<any, any, any, any> = Mutation>(
  mutationCache: MutationCache,
  options: MutationStateOptions<TResult, TMutation>,
): Array<TResult> {
  return mutationCache
    .findAll(options.filters)
    .map(
      (mutation): TResult =>
        (options.select
          ? options.select(mutation as unknown as TMutation)
          : mutation.state) as TResult,
    )
}

export function useMutationState<
  TResult = MutationState,
  TMutation extends Mutation<any, any, any, any> = Mutation,
>(
  options: MutationStateOptions<TResult, TMutation> = {},
  queryClient?: QueryClient,
): Array<TResult> {
  const mutationCache = useQueryClient(queryClient).getMutationCache()
  const optionsRef = React.useRef(options)
  const result = React.useRef<Array<TResult>>(null)
  if (result.current === null) {
    result.current = getResult(mutationCache, options)
  }

  React.useEffect(() => {
    optionsRef.current = options
  })

  return React.useSyncExternalStore(
    React.useCallback(
      (onStoreChange) =>
        mutationCache.subscribe(() => {
          const nextResult = replaceEqualDeep(
            result.current,
            getResult(mutationCache, optionsRef.current),
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
