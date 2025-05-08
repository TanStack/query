import { MutationObserver, noop } from '@tanstack/query-core'
import { createComputed, createMemo, on, onCleanup } from 'solid-js'
import { createStore } from 'solid-js/store'
import { useQueryClient } from './QueryClientProvider'
import { shouldThrowError } from './utils'
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
  TContext = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>,
  queryClient?: Accessor<QueryClient>,
): UseMutationResult<TData, TError, TVariables, TContext> {
  const client = createMemo(() => useQueryClient(queryClient?.()))

  const observer = new MutationObserver<TData, TError, TVariables, TContext>(
    client(),
    options(),
  )

  const mutate: UseMutateFunction<TData, TError, TVariables, TContext> = (
    variables,
    mutateOptions,
  ) => {
    observer.mutate(variables, mutateOptions).catch(noop)
  }

  const [state, setState] = createStore<
    UseMutationResult<TData, TError, TVariables, TContext>
  >({
    ...observer.getCurrentResult(),
    mutate,
    mutateAsync: observer.getCurrentResult().mutate,
  })

  createComputed(() => {
    observer.setOptions(options())
  })

  createComputed(
    on(
      () => state.status,
      () => {
        if (
          state.isError &&
          shouldThrowError(observer.options.throwOnError, [state.error])
        ) {
          throw state.error
        }
      },
    ),
  )

  const unsubscribe = observer.subscribe((result) => {
    setState({
      ...result,
      mutate,
      mutateAsync: result.mutate,
    })
  })

  onCleanup(unsubscribe)

  return state
}
