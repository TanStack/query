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
  TContext = unknown,
>(
  options: StoreOrVal<
    CreateMutationOptions<TData, TError, TVariables, TContext>
  >,
  queryClient?: QueryClient,
): CreateMutationResult<TData, TError, TVariables, TContext> {
  const client = useQueryClient(queryClient)

  const optionsStore = isSvelteStore(options) ? options : readable(options)

  const observer = new MutationObserver<TData, TError, TVariables, TContext>(
    client,
    get(optionsStore),
  )
  let mutate: CreateMutateFunction<TData, TError, TVariables, TContext>

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
