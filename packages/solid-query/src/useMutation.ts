import { MutationObserver, noop, shouldThrowError } from '@tanstack/query-core'
import { createComputed, createMemo, on, onCleanup } from 'solid-js'
import { createStore } from 'solid-js/store'
import { useQueryClientResolver } from './QueryClientProvider'
import type { DefaultError } from '@tanstack/query-core'
import type { QueryClient } from './QueryClient'
import type {
  UseMutateFunction,
  UseMutationOptions,
  UseMutationResult,
} from './types'
import type { Accessor } from 'solid-js'

/**
 * @param options - An accessor returning the {@link UseMutationOptions} to use.
 * @param queryClient - An accessor for a custom `QueryClient`. Otherwise, the one from the nearest context
 * will be used.
 * @returns `mutate`/`mutateAsync` also accept per-call `onSuccess`/`onError`/`onSettled` callbacks as a second
 * argument, useful for triggering call-site side effects (e.g. navigation) without coupling them to the shared
 * mutation definition. Hook-level callbacks (passed to `options`) fire for every mutation; per-call callbacks
 * fire only for the latest call you've made, and only while the component is still mounted — unmounting before
 * the mutation settles removes the subscription and prevents them from firing.
 *
 * @example
 * ```tsx
 * import { useMutation, useQueryClient } from '@tanstack/solid-query'
 *
 * function TodoItem(props: { id: number }) {
 *   const queryClient = useQueryClient()
 *
 *   const deleteTodoMutation = useMutation(() => ({
 *     mutationFn: deleteTodo,
 *     onSuccess: () => {
 *       queryClient.invalidateQueries({ queryKey: ['todos'] })
 *     },
 *   }))
 *
 *   return (
 *     <button onClick={() => deleteTodoMutation.mutate({ id: props.id })} disabled={deleteTodoMutation.isPending}>
 *       Delete
 *     </button>
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
  queryClient?: Accessor<QueryClient>,
): UseMutationResult<TData, TError, TVariables, TOnMutateResult> {
  const resolveClient = useQueryClientResolver(queryClient)
  const client = createMemo(() => resolveClient())

  const observer = new MutationObserver<
    TData,
    TError,
    TVariables,
    TOnMutateResult
  >(client(), options())

  const mutate: UseMutateFunction<
    TData,
    TError,
    TVariables,
    TOnMutateResult
  > = (...args) => {
    observer.mutate(args[0] as TVariables, args[1]).catch(noop)
  }

  const [state, setState] = createStore<
    UseMutationResult<TData, TError, TVariables, TOnMutateResult>
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
