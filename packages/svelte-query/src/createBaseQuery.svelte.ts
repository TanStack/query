import { useIsRestoring } from './useIsRestoring.js'
import { useQueryClient } from './useQueryClient.js'
import { createReactiveThunk } from './containers.svelte.js'
import type { CreateBaseQueryOptions, CreateBaseQueryResult } from './types.js'
import type { QueryClient, QueryKey, QueryObserver } from '@tanstack/query-core'

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
): () => CreateBaseQueryResult<TData, TError> {
  /** Load query client */
  const client = useQueryClient(queryClient)
  const isRestoring = $derived.by(useIsRestoring())

  /** Creates a store that has the default options applied */
  const resolvedOptions = $derived.by(() => {
    const opts = client.defaultQueryOptions(options)
    opts._optimisticResults = isRestoring ? 'isRestoring' : 'optimistic'
    opts.structuralSharing = false
    return opts
  })

  let updateEffects = () => {}

  /** Creates the observer */
  const observer = new Observer<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >(client, resolvedOptions)

  /** Subscribe to changes in result and defaultedOptions */
  $effect.pre(() => {
    observer.setOptions(resolvedOptions, { listeners: false })
    updateEffects()
  })

  return createReactiveThunk(
    () => {
      const result = observer.getOptimisticResult(resolvedOptions)
      if (!resolvedOptions.notifyOnChangeProps) {
        return observer.trackResult(result)
      }
      return result
    },
    (update) => {
      updateEffects = update
      return observer.subscribe(update)
    },
  )
}
