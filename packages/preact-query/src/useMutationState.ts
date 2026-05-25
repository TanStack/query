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

type MutationStateOptions<
  TResult = MutationState,
  /**
   * Narrows the type of the `mutation` argument passed to `select`.
   * This is a caller-side assertion — the mutation cache stores mutations as
   * the base `Mutation` type, so it is the caller's responsibility to ensure
   * `TMutation` matches the actual mutations in the cache (e.g. by specifying
   * a `mutationKey` in `filters`).
   */
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
