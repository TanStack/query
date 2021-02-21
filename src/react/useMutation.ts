import React from 'react'

import { notifyManager } from '../core/notifyManager'
import { noop, parseMutationArgs } from '../core/utils'
import { MutationObserver } from '../core/mutationObserver'
import { useQueryClient } from './QueryClientProvider'
import {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from './types'
import { MutationFunction, MutationKey } from '../core/types'

// HOOK

export function useMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext>
export function useMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown
>(
  mutationFn: MutationFunction<TData, TVariables>,
  options?: UseMutationOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext>
export function useMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown
>(
  mutationKey: MutationKey,
  options?: UseMutationOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext>
export function useMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown
>(
  mutationKey: MutationKey,
  mutationFn?: MutationFunction<TData, TVariables>,
  options?: UseMutationOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext>
export function useMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown
>(
  arg1:
    | MutationKey
    | MutationFunction<TData, TVariables>
    | UseMutationOptions<TData, TError, TVariables, TContext>,
  arg2?:
    | MutationFunction<TData, TVariables>
    | UseMutationOptions<TData, TError, TVariables, TContext>,
  arg3?: UseMutationOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext> {
  const mountedRef = React.useRef(false)
  const [, forceUpdate] = React.useState(0)

  const options = parseMutationArgs(arg1, arg2, arg3)
  const queryClient = useQueryClient()

  const obsRef = React.useRef<MutationObserver<any, any, any, any>>()

  if (!obsRef.current) {
    obsRef.current = new MutationObserver(queryClient, options)
  } else {
    obsRef.current.setOptions(options)
  }

  const currentResult = obsRef.current.getCurrentResult()

  React.useEffect(() => {
    mountedRef.current = true

    const unsubscribe = obsRef.current!.subscribe(
      notifyManager.batchCalls(() => {
        if (mountedRef.current) {
          forceUpdate(x => x + 1)
        }
      })
    )
    return () => {
      mountedRef.current = false
      unsubscribe()
    }
  }, [])

  const mutate = React.useCallback<
    UseMutateFunction<TData, TError, TVariables, TContext>
  >((variables, mutateOptions) => {
    obsRef.current!.mutate(variables, mutateOptions).catch(noop)
  }, [])

  if (currentResult.error && obsRef.current.options.useErrorBoundary) {
    throw currentResult.error
  }

  return { ...currentResult, mutate, mutateAsync: currentResult.mutate }
}
