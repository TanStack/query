import { derived, get, readable } from 'svelte/store'
import { MutationObserver, noop, notifyManager } from '@tanstack/query-core'
import { useQueryClient } from './useQueryClient.js'
import { isSvelteStore } from './utils.js'
import type {
  CreateMutateFunction,
  CreateMutationOptions,
  CreateMutationResult,
  StoreOrVal,
} from './types.js'
import type { DefaultError, QueryClient } from '@tanstack/query-core'

export function createMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TScope = unknown,
>(
  options: StoreOrVal<CreateMutationOptions<TData, TError, TVariables, TScope>>,
  queryClient?: QueryClient,
): CreateMutationResult<TData, TError, TVariables, TScope> {
  const client = useQueryClient(queryClient)

  const optionsStore = isSvelteStore(options) ? options : readable(options)

  const observer = new MutationObserver<TData, TError, TVariables, TScope>(
    client,
    get(optionsStore),
  )
  let mutate: CreateMutateFunction<TData, TError, TVariables, TScope>

  optionsStore.subscribe(($options) => {
    mutate = (variables, mutateOptions) => {
      observer.mutate(variables, mutateOptions).catch(noop)
    }
    observer.setOptions($options)
  })

  const result = readable(observer.getCurrentResult(), (set) => {
    return observer.subscribe(notifyManager.batchCalls((val) => set(val)))
  })

  const { subscribe } = derived(result, ($result) => ({
    ...$result,
    mutate,
    mutateAsync: $result.mutate,
  }))

  return { subscribe }
}
