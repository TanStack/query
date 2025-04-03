import { useIsRestoring } from './useIsRestoring.js'
import { useQueryClient } from './useQueryClient.js'
import { createRawRef } from './containers.svelte.js'
import type { QueryClient, QueryKey, QueryObserver } from '@tanstack/query-core'
import type { CreateBaseQueryOptions, CreateBaseQueryResult } from './types.js'

export function createBaseQuery<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey,
>(
  options: () => CreateBaseQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >,
  Observer: typeof QueryObserver,
  queryClient?: QueryClient,
): CreateBaseQueryResult<TData, TError> {
  /** Load query client */
  const client = useQueryClient(queryClient)
  const isRestoring = useIsRestoring()

  const resolvedOptions = $derived.by(() => {
    const opts = client.defaultQueryOptions(options())
    opts._optimisticResults = isRestoring.current ? 'isRestoring' : 'optimistic'
    return opts
  })

  /** Creates the observer */
  const observer = new Observer<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >(client, resolvedOptions)

  const [query, update] = createRawRef(
    observer.getOptimisticResult(resolvedOptions),
  )

  $effect(() => {
    const unsubscribe = isRestoring.current
      ? () => undefined
      : observer.subscribe(() =>
          update(observer.getOptimisticResult(resolvedOptions)),
        )
    observer.updateResult()
    return unsubscribe
  })

  $effect.pre(() => {
    observer.setOptions(resolvedOptions)
    // The only reason this is necessary is because of `isRestoring`.
    // Because we don't subscribe while restoring, the following can occur:
    // - `isRestoring` is true
    // - `isRestoring` becomes false
    // - `observer.subscribe` and `observer.updateResult` is called in the above effect,
    //   but the subsequent `fetch` has already completed
    // - `result` misses the intermediate restored-but-not-fetched state
    //
    // this could technically be its own effect but that doesn't seem necessary
    const result = observer.getOptimisticResult(resolvedOptions)
    update(result)
  })

  return resolvedOptions.notifyOnChangeProps
    ? observer.trackResult(query)
    : query
}
