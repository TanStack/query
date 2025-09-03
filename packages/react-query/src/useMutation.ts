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
  TScope = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TScope>,
  queryClient?: QueryClient,
): UseMutationResult<TData, TError, TVariables, TScope> {
  const client = useQueryClient(queryClient)

  const [observer] = React.useState(
    () =>
      new MutationObserver<TData, TError, TVariables, TScope>(client, options),
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
    UseMutateFunction<TData, TError, TVariables, TScope>
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
