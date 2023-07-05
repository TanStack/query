import { derived, get, readable } from 'svelte/store'
import { notifyManager } from '@tanstack/query-core'
import type { QueryClient, QueryKey, QueryObserver } from '@tanstack/query-core'
import type { CreateBaseQueryOptions, CreateBaseQueryResult } from './types'
import { useQueryClient } from './useQueryClient'
import { isSvelteStore } from './utils'

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
  const client = useQueryClient(queryClient)

  // Converts options to a svelte store if not already a store.
  const optionsStore = isSvelteStore(options) ? options : readable(options)

  // Creates a store that will always have the default options applied.
  const defaultedOptionsStore = derived(optionsStore, ($optionsStore) => {
    const defaultedOptions = client.defaultQueryOptions($optionsStore)
    defaultedOptions._optimisticResults = 'optimistic'
    console.log("defaultedOptions", defaultedOptions)
    return defaultedOptions
  })

  const observer = new Observer<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >(client, get(defaultedOptionsStore))

  defaultedOptionsStore.subscribe(($defaultedOptions) => {
    // Do not notify on updates because of changes in the options because
    // these changes should already be reflected in the optimistic result.
    observer.setOptions($defaultedOptions, { listeners: false })
  })

  const result = readable(observer.getCurrentResult(), (set) => {
    return observer.subscribe(notifyManager.batchCalls(set))
  })

  const { subscribe } = derived(result, ($result) => {
    console.log("derived", $result)
    $result = observer.getOptimisticResult(get(defaultedOptionsStore))
    return !get(defaultedOptionsStore).notifyOnChangeProps
      ? observer.trackResult($result)
      : $result
  })

  return { subscribe }
}
