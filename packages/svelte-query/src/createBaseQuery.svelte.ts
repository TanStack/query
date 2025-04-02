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
  options: CreateBaseQueryOptions<
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
  console.log('createBaseQuery', options)
  const client = useQueryClient(queryClient)
  const isRestoring = useIsRestoring()

  /** Creates a store that has the default options applied */
  const resolvedOptions = $derived.by(() => {
    const opts = client.defaultQueryOptions(options)
    opts._optimisticResults = isRestoring.current ? 'isRestoring' : 'optimistic'
    opts.structuralSharing = false
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

  let [query, update] = createRawRef(
    observer.getOptimisticResult(resolvedOptions),
  )

  // if you update this effect in the future, _make sure_ the unsubscribe function is still being returned
  $effect(() =>
    observer.subscribe(() => {
      const result = observer.getOptimisticResult(resolvedOptions)
      update(result)
    }),
  )

  $effect.pre(() => {
    observer.setOptions(resolvedOptions, { listeners: false })
    const result = observer.getOptimisticResult(resolvedOptions)
    update(result)
  })

  return resolvedOptions.notifyOnChangeProps
    ? observer.trackResult(query)
    : query
}
