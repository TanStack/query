import type { MutationFunction, MutationKey } from '@tanstack/query-core'
import { parseMutationArgs, MutationObserver } from '@tanstack/query-core'
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
  TError = unknown,
  TVariables = void,
  TContext = unknown,
>(
  options: CreateMutationOptions<TData, TError, TVariables, TContext>,
): CreateMutationResult<TData, TError, TVariables, TContext>
export function createMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
>(
  mutationFn: MutationFunction<TData, TVariables>,
  options?: Omit<
    CreateMutationOptions<TData, TError, TVariables, TContext>,
    'mutationFn'
  >,
): CreateMutationResult<TData, TError, TVariables, TContext>
export function createMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
>(
  mutationKey: MutationKey,
  options?: Omit<
    CreateMutationOptions<TData, TError, TVariables, TContext>,
    'mutationKey'
  >,
): CreateMutationResult<TData, TError, TVariables, TContext>
export function createMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
>(
  mutationKey: MutationKey,
  mutationFn?: MutationFunction<TData, TVariables>,
  options?: Omit<
    CreateMutationOptions<TData, TError, TVariables, TContext>,
    'mutationKey' | 'mutationFn'
  >,
): CreateMutationResult<TData, TError, TVariables, TContext>
export function createMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
>(
  arg1:
    | MutationKey
    | MutationFunction<TData, TVariables>
    | CreateMutationOptions<TData, TError, TVariables, TContext>,
  arg2?:
    | MutationFunction<TData, TVariables>
    | CreateMutationOptions<TData, TError, TVariables, TContext>,
  arg3?: CreateMutationOptions<TData, TError, TVariables, TContext>,
): CreateMutationResult<TData, TError, TVariables, TContext> {
  const [options, setOptions] = createStore(parseMutationArgs(arg1, arg2, arg3))
  const queryClient = useQueryClient({ context: options.context })

  const observer = new MutationObserver<TData, TError, TVariables, TContext>(
    queryClient,
    options,
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
    const newParsedOptions = parseMutationArgs(arg1, arg2, arg3)
    setOptions(newParsedOptions)
    observer.setOptions(newParsedOptions)
  })

  createComputed(
    on(
      () => state.status,
      () => {
        if (
          state.isError &&
          shouldThrowError(observer.options.useErrorBoundary, [state.error])
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
