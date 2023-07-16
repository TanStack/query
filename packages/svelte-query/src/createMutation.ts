import { derived, get, readable } from 'svelte/store'
import { MutationObserver, notifyManager } from '@tanstack/query-core'
import { useQueryClient } from './useQueryClient'
import { isSvelteStore } from './utils'
import type {
  CreateMutateFunction,
  CreateMutationOptions,
  CreateMutationResult,
} from './types'
import type { DefaultError, QueryClient } from '@tanstack/query-core'

export function createMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
>(
  options: CreateMutationOptions<TData, TError, TVariables, TContext>,
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

// eslint-disable-next-line @typescript-eslint/no-empty-function
function noop() {}
