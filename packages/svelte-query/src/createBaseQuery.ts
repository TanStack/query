import {
  notifyManager,
  type QueryKey,
  type QueryObserver,
} from '@tanstack/query-core'
import { derived, readable, writable, get, type Writable } from 'svelte/store'
import type {
  CreateBaseQueryOptions,
  CreateBaseQueryResult,
  WritableOrVal,
} from './types'
import { useQueryClient } from './useQueryClient'

function isWritable<T extends object>(
  obj: WritableOrVal<T>,
): obj is Writable<T> {
  return 'subscribe' in obj
}

export function createBaseQuery<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey,
>(
  options: WritableOrVal<
    CreateBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  >,
  Observer: typeof QueryObserver,
): CreateBaseQueryResult<TData, TError> {
  const queryClient = useQueryClient()

  let optionsStore: Writable<
    CreateBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  >
  if (isWritable(options)) {
    optionsStore = options
  } else {
    optionsStore = writable(options)
  }

  const defaultedOptionsStore = derived(optionsStore, ($options) => {
    const defaultedOptions = queryClient.defaultQueryOptions($options)
    defaultedOptions._optimisticResults = 'optimistic'

    // Include callbacks in batch renders
    if (defaultedOptions.onError) {
      defaultedOptions.onError = notifyManager.batchCalls(
        defaultedOptions.onError,
      )
    }

    if (defaultedOptions.onSuccess) {
      defaultedOptions.onSuccess = notifyManager.batchCalls(
        defaultedOptions.onSuccess,
      )
    }

    if (defaultedOptions.onSettled) {
      defaultedOptions.onSettled = notifyManager.batchCalls(
        defaultedOptions.onSettled,
      )
    }

    return defaultedOptions
  })

  const observer = new Observer<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >(queryClient, get(defaultedOptionsStore))

  defaultedOptionsStore.subscribe(($defaultedOptions) => {
    // Do not notify on updates because of changes in the options because
    // these changes should already be reflected in the optimistic result.
    observer.setOptions($defaultedOptions, { listeners: false })
  })

  const result = readable(observer.getCurrentResult(), (set) => {
    return observer.subscribe(notifyManager.batchCalls(set))
  })

  const { subscribe } = derived(result, ($result) => {
    $result = observer.getOptimisticResult(get(defaultedOptionsStore))
    return !get(defaultedOptionsStore).notifyOnChangeProps
      ? observer.trackResult($result)
      : $result
  })

  return { subscribe }
}
