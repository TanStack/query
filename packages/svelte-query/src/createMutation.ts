import { readable, derived, writable, get } from 'svelte/store'
import type { QueryClient, DefaultError } from '@tanstack/query-core'
import { MutationObserver, notifyManager } from '@tanstack/query-core'
import type {
  CreateMutateFunction,
  CreateMutationOptions,
  CreateMutationResult,
} from './types.ts'
import { useQueryClient } from './useQueryClient.ts'
import { isWritable } from './utils.ts'

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

  const optionsStore = isWritable(options) ? options : writable(options)

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
