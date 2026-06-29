import { notifyManager, replaceEqualDeep } from '@tanstack/query-core'
import type {
  Mutation,
  MutationCache,
  MutationFilters,
  MutationState,
  QueryClient,
} from '@tanstack/query-core'
import { useCallback, useEffect, useRef } from 'preact/hooks'

import { useQueryClient } from './QueryClientProvider'
import { useSyncExternalStore } from './utils'

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

type MutationTypeFromResult<TResult> = [TResult] extends [
  MutationState<
    infer TData,
    infer TError,
    infer TVariables,
    infer TOnMutateResult
  >,
]
  ? Mutation<TData, TError, TVariables, TOnMutateResult>
  : Mutation

type MutationStateOptions<
  TResult = MutationState,
  TMutation extends Mutation<any, any, any, any> =
    MutationTypeFromResult<TResult>,
> = {
  filters?: MutationFilters
  select?: (mutation: TMutation) => TResult
}

function getResult<
  TResult = MutationState,
  TMutation extends Mutation<any, any, any, any> =
    MutationTypeFromResult<TResult>,
>(
  mutationCache: MutationCache,
  options: MutationStateOptions<TResult, TMutation>,
): Array<TResult> {
  return mutationCache
    .findAll(options.filters)
    .map(
      (mutation): TResult =>
        (options.select
          ? options.select(mutation as TMutation)
          : mutation.state) as TResult,
    )
}

export function useMutationState<
  TResult = MutationState,
  TMutation extends Mutation<any, any, any, any> =
    MutationTypeFromResult<TResult>,
>(
  options: MutationStateOptions<TResult, TMutation> = {},
  queryClient?: QueryClient,
): Array<TResult> {
  const mutationCache = useQueryClient(queryClient).getMutationCache()
  const optionsRef = useRef(options)
  const result = useRef<Array<TResult>>(null)
  if (result.current === null) {
    result.current = getResult(mutationCache, options)
  }

  useEffect(() => {
    optionsRef.current = options
  })

  return useSyncExternalStore(
    useCallback(
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
  )!
}
