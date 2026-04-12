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
  TData = unknown,
  TError = unknown,
  TVariables = unknown,
  TContext = unknown,
  TResult = MutationState
> = {
  filters?: MutationFilters
  select?: (
    mutation: Mutation<TData, TError, TVariables, TContext>
  ) => TResult
}

function getResult<
  TData = unknown,
  TError = unknown,
  TVariables = unknown,
  TContext = unknown,
  TResult = MutationState
>(
  mutationCache: MutationCache,
  options: MutationStateOptions<
    TData,
    TError,
    TVariables,
    TContext,
    TResult
  >,
): Array<TResult> {
  return mutationCache
    .findAll(options.filters)
    .map(
      (mutation): TResult =>
        (options.select ? options.select(mutation) : mutation.state) as TResult,
    )
}

export function useMutationState<
  TData = unknown,
  TError = unknown,
  TVariables = unknown,
  TContext = unknown,
  TResult = MutationState
>(
  options: MutationStateOptions<
    TData,
    TError,
    TVariables,
    TContext,
    TResult
  > = {},
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
