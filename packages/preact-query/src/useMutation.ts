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

/**
 * @param queryClient - Use this to use a custom QueryClient. Otherwise, the one from the nearest context will
 * be used.
 *
 * @example
 * ```tsx
 * import { useMutation, useQueryClient } from '@tanstack/preact-query'
 *
 * function Example() {
 *   const queryClient = useQueryClient()
 *
 *   const addMutation = useMutation({
 *     mutationFn: (add: string) => fetch(`/api/data?add=${add}`),
 *     onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
 *   })
 *
 *   return (
 *     <button onClick={() => addMutation.mutate('Item')}>Add</button>
 *   )
 * }
 * ```
 */
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
    (
      ...args: Parameters<
        UseMutateFunction<TData, TError, TVariables, TOnMutateResult>
      >
    ) => {
      observer.mutate(args[0] as TVariables, args[1]).catch(noop)
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
