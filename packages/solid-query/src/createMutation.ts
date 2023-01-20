import type { QueryClient } from '@tanstack/query-core'
import { MutationObserver } from '@tanstack/query-core'
import { useQueryClient } from './QueryClientProvider'
import type {
  CreateMutateFunction,
  CreateMutationOptions,
  CreateMutationResult,
} from './types'
import { createComputed, onCleanup, on } from 'solid-js'
import { createStore } from 'solid-js/store'
import { shouldThrowError } from './utils'

// HOOK
export function createMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(
  options: CreateMutationOptions<TData, TError, TVariables, TContext>,
  queryClient?: () => QueryClient,
): CreateMutationResult<TData, TError, TVariables, TContext> {
  const client = useQueryClient(queryClient?.())

  const observer = new MutationObserver<TData, TError, TVariables, TContext>(
    client,
    options(),
  )

  const mutate: CreateMutateFunction<TData, TError, TVariables, TContext> = (
    variables,
    mutateOptions,
  ) => {
    observer.mutate(variables, mutateOptions).catch(noop)
  }

  const [state, setState] = createStore<
    CreateMutationResult<TData, TError, TVariables, TContext>
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
          shouldThrowError(observer.options.throwErrors, [state.error])
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

// eslint-disable-next-line @typescript-eslint/no-empty-function
function noop() {}
