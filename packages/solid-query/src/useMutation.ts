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
 *
 * @example
 * Rendering the mutation's own state, rather than just firing it off:
 * ```tsx
 * import { Match, Switch } from 'solid-js'
 * import { useMutation, useQueryClient } from '@tanstack/solid-query'
 *
 * function AddTodo() {
 *   const queryClient = useQueryClient()
 *
 *   const addMutation = useMutation(() => ({
 *     mutationFn: addTodo,
 *     onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
 *   }))
 *
 *   return (
 *     <Switch fallback={<button onClick={() => addMutation.mutate('Item')}>Add</button>}>
 *       <Match when={addMutation.isPending}>Adding todo...</Match>
 *       <Match when={addMutation.isError}>
 *         <div>An error occurred: {addMutation.error?.message}</div>
 *         <button onClick={() => addMutation.mutate('Item')}>Add</button>
 *       </Match>
 *     </Switch>
 *   )
 * }
 * ```
 *
 * @example
 * Optimistic update via `onMutate`, rolling back on `onError`:
 * ```tsx
 * import { useMutation, useQueryClient } from '@tanstack/solid-query'
 *
 * function AddTodo() {
 *   const queryClient = useQueryClient()
 *
 *   const addMutation = useMutation(() => ({
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
 *       // Passed to `onError` as `onMutateResult` if the mutation fails.
 *       return { previousTodos }
 *     },
 *     onError: (_err, _newTodo, onMutateResult) => {
 *       queryClient.setQueryData(['todos'], onMutateResult?.previousTodos)
 *     },
 *     onSettled: () => {
 *       queryClient.invalidateQueries({ queryKey: ['todos'] })
 *     },
 *   }))
 *
 *   return (
 *     <button onClick={() => addMutation.mutate('Item')}>Add</button>
 *   )
 * }
 * ```
 *
 * @example
 * Callbacks passed per call to `mutate` only fire for the last call — `mutateAsync` gives you a
 * promise per call instead, so you can wait for all of them when they succeed:
 * ```tsx
 * import { useMutation, useQueryClient } from '@tanstack/solid-query'
 *
 * function AddTodos() {
 *   const queryClient = useQueryClient()
 *
 *   const addMutation = useMutation(() => ({
 *     mutationFn: addTodo,
 *     onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
 *   }))
 *
 *   async function handleAddAll(todos: Array<string>) {
 *     try {
 *       await Promise.all(todos.map((todo) => addMutation.mutateAsync(todo)))
 *     } catch (error) {
 *       console.error('Failed to add todos:', error)
 *     }
 *   }
 *
 *   return (
 *     <button onClick={() => handleAddAll(['Todo 1', 'Todo 2', 'Todo 3'])}>
 *       Add all
 *     </button>
 *   )
 * }
 * ```
 *
 * @example
 * If some of the mutations above can fail independently of the others, and you want to know which ones
 * did — rather than losing that information the moment the first one rejects — swap `Promise.all` for
 * `Promise.allSettled`:
 * ```tsx
 * import { useMutation, useQueryClient } from '@tanstack/solid-query'
 *
 * function AddTodos() {
 *   const queryClient = useQueryClient()
 *
 *   const addMutation = useMutation(() => ({
 *     mutationFn: addTodo,
 *     onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
 *   }))
 *
 *   async function handleAddAll(todos: Array<string>) {
 *     const addResults = await Promise.allSettled(
 *       todos.map((todo) => addMutation.mutateAsync(todo)),
 *     )
 *
 *     addResults.forEach((addResult, index) => {
 *       if (addResult.status === 'rejected') {
 *         console.error(`Failed to add "${todos[index]}":`, addResult.reason)
 *       }
 *     })
 *   }
 *
 *   return (
 *     <button onClick={() => handleAddAll(['Todo 1', 'Todo 2', 'Todo 3'])}>
 *       Add all
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
