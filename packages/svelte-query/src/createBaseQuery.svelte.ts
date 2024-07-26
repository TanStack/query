import { notifyManager } from '@tanstack/query-core'
import { useIsRestoring } from './useIsRestoring.js'
import { useQueryClient } from './useQueryClient.js'
import type {
  CreateBaseQueryOptions,
  CreateBaseQueryResult,
  FunctionedParams,
} from './types.js'
import type {
  QueryClient,
  QueryKey,
  QueryObserver,
  QueryObserverResult,
} from '@tanstack/query-core'

export function createBaseQuery<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey,
>(
  options: FunctionedParams<
    CreateBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  >,
  Observer: typeof QueryObserver,
  queryClient?: QueryClient,
): CreateBaseQueryResult<TData, TError> {
  /** Load query client */
  const client = useQueryClient(queryClient)
  const isRestoring = useIsRestoring()

  /** Creates a store that has the default options applied */
  const defaultedOptions = $derived(() => {
    const defaultOptions = client.defaultQueryOptions(options())
    defaultOptions._optimisticResults = isRestoring()
      ? 'isRestoring'
      : 'optimistic'
    defaultOptions.structuralSharing = false
    return defaultOptions
  })

  /** Creates the observer */
  const observer = new Observer<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >(client, defaultedOptions())

  const result = $state<QueryObserverResult<TData, TError>>(
    observer.getOptimisticResult(defaultedOptions()),
  )

  function updateResult(r: QueryObserverResult<TData, TError>) {
    Object.assign(result, r)
  }

  $effect(() => {
    const unsubscribe = isRestoring()
      ? () => undefined
      : observer.subscribe(() => {
          notifyManager.batchCalls(() => {
            updateResult(observer.getOptimisticResult(defaultedOptions()))
          })()
        })

    observer.updateResult()
    return () => unsubscribe()
  })

  /** Subscribe to changes in result and defaultedOptionsStore */
  $effect.pre(() => {
    observer.setOptions(defaultedOptions(), { listeners: false })
    updateResult(observer.getOptimisticResult(defaultedOptions()))
  })

  // Handle result property usage tracking
  return !defaultedOptions().notifyOnChangeProps
    ? observer.trackResult(result)
    : result
}
