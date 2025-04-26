'use client'
import * as React from 'react'
import { MutationObserver, notifyManager } from '@tanstack/query-core'
import { useQueryClient } from './QueryClientProvider'
import { noop, shouldThrowError } from './utils'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from './types'
import type { DefaultError, QueryClient } from '@tanstack/query-core'

export function useMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>,
  queryClient?: QueryClient,
): UseMutationResult<TData, TError, TVariables, TContext> {
  const client = useQueryClient(queryClient)

  const observerRef =
    React.useRef<MutationObserver<TData, TError, TVariables, TContext>>(null)

  if (!observerRef.current) {
    observerRef.current = new MutationObserver<
      TData,
      TError,
      TVariables,
      TContext
    >(client, options)
  }

  React.useEffect(() => {
    observerRef.current!.setOptions(options)
  }, [options])

  const result = React.useSyncExternalStore(
    React.useCallback(
      (onStoreChange) =>
        observerRef.current!.subscribe(notifyManager.batchCalls(onStoreChange)),
      [],
    ),
    () => observerRef.current!.getCurrentResult(),
    () => observerRef.current!.getCurrentResult(),
  )

  const mutate = React.useCallback<
    UseMutateFunction<TData, TError, TVariables, TContext>
  >((variables, mutateOptions) => {
    observerRef.current!.mutate(variables, mutateOptions).catch(noop)
  }, [])

  if (
    result.error &&
    shouldThrowError(observerRef.current.options.throwOnError, [result.error])
  ) {
    throw result.error
  }

  return { ...result, mutate, mutateAsync: result.mutate }
}
