import {
  MutationObserver,
  noop,
  notifyManager,
  shouldThrowError,
} from '@tanstack/query-core'
import type { DefaultError, QueryClient } from '@tanstack/query-core'
import { useCallback, useEffect, useState } from 'preact/hooks'

import { useQueryClient } from './QueryClientProvider'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from './types'
import { useSyncExternalStore } from './utils'

// HOOK

export function useMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TOnMutateResult>,
  queryClient?: QueryClient,
): UseMutationResult<TData, TError, TVariables, TOnMutateResult> {
  const client = useQueryClient(queryClient)

  const [observer] = useState(
    () =>
      new MutationObserver<TData, TError, TVariables, TOnMutateResult>(
        client,
        options,
      ),
  )

  useEffect(() => {
    observer.setOptions(options)
  }, [observer, options])

  const result = useSyncExternalStore(
    useCallback(
      (onStoreChange) =>
        observer.subscribe(notifyManager.batchCalls(onStoreChange)),
      [observer],
    ),
    () => observer.getCurrentResult(),
  )

  const mutate = useCallback<
    UseMutateFunction<TData, TError, TVariables, TOnMutateResult>
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
