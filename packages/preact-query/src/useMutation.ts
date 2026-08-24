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
 * @returns `mutate`/`mutateAsync` also accept per-call `onSuccess`/`onError`/`onSettled` callbacks as a second
 * argument, useful for triggering call-site side effects (e.g. navigation) without coupling them to the shared
 * mutation definition. If you make multiple requests, `onSuccess` will fire only after the latest call you've
 * made.
 *
 * @example
 * ```tsx
 * import { useMutation, useQueryClient } from '@tanstack/preact-query'
 *
 * function AddTodo() {
 *   const queryClient = useQueryClient()
 *
 *   const addMutation = useMutation({
 *     mutationFn: addTodo,
 *     onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
 *   })
 *
 *   return (
 *     <button onClick={() => addMutation.mutate('Item')}>Add</button>
 *   )
 * }
 * ```
 *
 * @example
 * Optimistic update via `onMutate`, rolling back on `onError`:
 * ```tsx
 * import { useMutation, useQueryClient } from '@tanstack/preact-query'
 *
 * function AddTodo() {
 *   const queryClient = useQueryClient()
 *
 *   const addMutation = useMutation({
 *     mutationFn: addTodo,
 *     onMutate: async (newTodo) => {
 *       await queryClient.cancelQueries({ queryKey: ['todos'] })
 *       const previousTodos = queryClient.getQueryData<Array<string>>(['todos'])
 *
 *       queryClient.setQueryData<Array<string>>(['todos'], (old) => [
 *         ...(old ?? []),
 *         newTodo,
 *       ])
 *
 *       // Passed to `onError` as `context` if the mutation fails.
 *       return { previousTodos }
 *     },
 *     onError: (_err, _newTodo, context) => {
 *       queryClient.setQueryData(['todos'], context?.previousTodos)
 *     },
 *     onSettled: () => {
 *       queryClient.invalidateQueries({ queryKey: ['todos'] })
 *     },
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
