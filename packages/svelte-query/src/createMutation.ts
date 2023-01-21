import { readable, derived } from 'svelte/store'
import {
  type MutationFunction,
  type MutationKey,
  MutationObserver,
  notifyManager,
  parseMutationArgs,
} from '@tanstack/query-core'
import type {
  CreateMutateFunction,
  CreateMutationOptions,
  CreateMutationResult,
} from './types'
import { useQueryClient } from './useQueryClient'

export function createMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
>(
  options: CreateMutationOptions<TData, TError, TVariables, TContext>,
): CreateMutationResult<TData, TError, TVariables, TContext>

export function createMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
>(
  mutationFn: MutationFunction<TData, TVariables>,
  options?: Omit<
    CreateMutationOptions<TData, TError, TVariables, TContext>,
    'mutationFn'
  >,
): CreateMutationResult<TData, TError, TVariables, TContext>

export function createMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
>(
  mutationKey: MutationKey,
  options?: Omit<
    CreateMutationOptions<TData, TError, TVariables, TContext>,
    'mutationKey'
  >,
): CreateMutationResult<TData, TError, TVariables, TContext>

export function createMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
>(
  mutationKey: MutationKey,
  mutationFn?: MutationFunction<TData, TVariables>,
  options?: Omit<
    CreateMutationOptions<TData, TError, TVariables, TContext>,
    'mutationKey' | 'mutationFn'
  >,
): CreateMutationResult<TData, TError, TVariables, TContext>

export function createMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
>(
  arg1:
    | MutationKey
    | MutationFunction<TData, TVariables>
    | CreateMutationOptions<TData, TError, TVariables, TContext>,
  arg2?:
    | MutationFunction<TData, TVariables>
    | CreateMutationOptions<TData, TError, TVariables, TContext>,
  arg3?: CreateMutationOptions<TData, TError, TVariables, TContext>,
): CreateMutationResult<TData, TError, TVariables, TContext> {
  const options = parseMutationArgs(arg1, arg2, arg3)
  const queryClient = useQueryClient()
  let observer = new MutationObserver<TData, TError, TVariables, TContext>(
    queryClient,
    options,
  )
  let mutate: CreateMutateFunction<TData, TError, TVariables, TContext>

  readable(observer).subscribe(($observer) => {
    observer = $observer
    mutate = (variables, mutateOptions) => {
      observer.mutate(variables, mutateOptions).catch(noop)
    }
    observer.setOptions(options)
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
