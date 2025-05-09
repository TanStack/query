'use client'
import * as React from 'react'
import {
  MutationObserver,
  noop,
  notifyManager,
  shouldThrowError,
} from '@tanstack/query-core'
import { useQueryClient } from './QueryClientProvider'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from './types'
import type { DefaultError, QueryClient } from '@tanstack/query-core'

// HOOK

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

  const [observer] = React.useState(
    () =>
      new MutationObserver<TData, TError, TVariables, TContext>(
        client,
        options,
      ),
  )

  React.useEffect(() => {
    observer.setOptions(options)
  }, [observer, options])

  const result = React.useSyncExternalStore(
    React.useCallback(
      (onStoreChange) =>
        observer.subscribe(notifyManager.batchCalls(onStoreChange)),
      [observer],
    ),
    () => observer.getCurrentResult(),
    () => observer.getCurrentResult(),
  )

  const mutate = React.useCallback<
    UseMutateFunction<TData, TError, TVariables, TContext>
  >(
    (variables, mutateOptions) => {
      observer.mutate(variables, mutateOptions).catch(noop)
    },
    [observer],
  )

  if (
    result.error &&
    shouldThrowError(observer.options.throwOnError, [result.error])
  ) {
    throw result.error
  }

  return { ...result, mutate, mutateAsync: result.mutate }
}
