import { useIsRestoring } from './useIsRestoring.js'
import { useQueryClient } from './useQueryClient.js'
import { createRawRef } from './containers.svelte.js'
import { watchChanges } from './utils.svelte.js'
import type { QueryClient, QueryKey, QueryObserver } from '@tanstack/query-core'
import type {
  Accessor,
  CreateBaseQueryOptions,
  CreateBaseQueryResult,
} from './types.js'

/**
 * Base implementation for `createQuery` and `createInfiniteQuery`
 * @param options - A function that returns query options
 * @param Observer - The observer from query-core
 * @param queryClient - Custom query client which overrides provider
 */
export function createBaseQuery<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey,
>(
  options: Accessor<
    CreateBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  >,
  Observer: typeof QueryObserver,
  queryClient?: Accessor<QueryClient>,
): CreateBaseQueryResult<TData, TError> {
  /** Load query client */
  const client = $derived(useQueryClient(queryClient?.()))
  const isRestoring = useIsRestoring()

  const resolvedOptions = $derived.by(() => {
    const opts = client.defaultQueryOptions(options())
    opts._optimisticResults = isRestoring.current ? 'isRestoring' : 'optimistic'
    return opts
  })

  /** Creates the observer */
  // svelte-ignore state_referenced_locally - intentional, initial value
  let observer = $state(
    new Observer<TQueryFnData, TError, TData, TQueryData, TQueryKey>(
      client,
      resolvedOptions,
    ),
  )

  watchChanges(
    () => client,
    'pre',
    () => {
      observer = new Observer<
        TQueryFnData,
        TError,
        TData,
        TQueryData,
        TQueryKey
      >(client, resolvedOptions)
    },
  )

  function createResult() {
    const result = observer.getOptimisticResult(resolvedOptions)
    return !resolvedOptions.notifyOnChangeProps
      ? observer.trackResult(result)
      : result
  }

  const [query, update] = createRawRef(
    // svelte-ignore state_referenced_locally - intentional, initial value
    createResult(),
  )

  // Keep observer options updated before DOM flush
  watchChanges(
    () => resolvedOptions,
    'pre',
    () => {
      observer.setOptions(resolvedOptions)
    },
  )

  // Manage subscription lifecycle reactively to prevent restoration race conditions
  $effect(() => {
    if (isRestoring.current) {
      return
    }

    const unsubscribe = observer.subscribe(() => {
      update(createResult())
    })

    // Surface any state that settled between render and subscription commit
    update(createResult())
    observer.updateResult()

    return () => {
      unsubscribe()
    }
  })

  return query
}