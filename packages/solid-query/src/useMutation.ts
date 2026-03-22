import { MutationObserver, noop, shouldThrowError } from '@tanstack/query-core'
import {
  createMemo,
  createRenderEffect,
  createStore,
  onCleanup,
  untrack,
} from 'solid-js'
import { useQueryClient } from './QueryClientProvider'
import type { DefaultError } from '@tanstack/query-core'
import type { QueryClient } from './QueryClient'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from './types'
import type { Accessor } from 'solid-js'

// HOOK
export function useMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TOnMutateResult>,
  queryClient?: Accessor<QueryClient>,
): UseMutationResult<TData, TError, TVariables, TOnMutateResult> {
  const client = createMemo(() => useQueryClient(queryClient?.()))

  const observer = untrack(
    () =>
      new MutationObserver<TData, TError, TVariables, TOnMutateResult>(
        client(),
        options(),
      ),
  )

  // Track options changes and update observer
  createMemo(() => {
    observer.setOptions(options())
  })

  const mutate: UseMutateFunction<
    TData,
    TError,
    TVariables,
    TOnMutateResult
  > = (variables, mutateOptions) => {
    observer.mutate(variables, mutateOptions).catch(noop)
  }

  const initialResult = untrack(() => observer.getCurrentResult())
  const [state, setState] = createStore<
    UseMutationResult<TData, TError, TVariables, TOnMutateResult>
  >({
    ...initialResult,
    mutate,
    mutateAsync: initialResult.mutate,
  })

  const unsubscribe = observer.subscribe((result) => {
    setState(() => ({
      ...result,
      mutate,
      mutateAsync: result.mutate,
    }))
  })

  onCleanup(unsubscribe)

  // Use createRenderEffect to throw errors when throwOnError is set.
  // The throw must happen in the compute function (first arg), not the effect
  // function, so that the error goes through notifyStatus and gets wrapped as
  // a StatusError with a source — which is required for <Errored> boundaries
  // to capture it via CollectionQueue.notify.
  createRenderEffect(
    () => {
      const isError = state.isError
      const error = state.error
      if (
        isError &&
        shouldThrowError(observer.options.throwOnError, [error as TError])
      ) {
        throw error
      }
    },
    () => {},
  )

  return state
}
