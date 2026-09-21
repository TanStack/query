import { MutationObserver, noop, notifyManager } from '@tanstack/query-core'
import { useQueryClient } from './useQueryClient.js'
import { watchChanges } from './utils.svelte.js'
import type {
  Accessor,
  CreateMutateFunction,
  CreateMutationOptions,
  CreateMutationResult,
} from './types.js'

import type { DefaultError, QueryClient } from '@tanstack/query-core'

/**
 * Unlike queries, mutations are typically used to create/update/delete data or perform server side-effects.
 * `createMutation` is the function for that.
 *
 * @see {@link mutationOptions} to share these options across multiple `createMutation` call sites, or to look
 * the mutation up elsewhere via its `mutationKey` (e.g. with `useMutationState`).
 * @param options - The {@link CreateMutationOptions} to use, wrapped in an {@link Accessor} so options can be
 * reactive.
 * @param queryClient - Use this to use a custom `QueryClient`. Otherwise, the one from the nearest context will
 * be used.
 * @returns `mutate`/`mutateAsync` also accept per-call `onSuccess`/`onError`/`onSettled` callbacks as a second
 * argument, useful for triggering call-site side effects (e.g. navigation) without coupling them to the shared
 * mutation definition. If you make multiple requests, `onSuccess` will fire only after the latest call you've
 * made.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { createMutation, useQueryClient } from '@tanstack/svelte-query'
 *
 *   const queryClient = useQueryClient()
 *
 *   const addMutation = createMutation(() => ({
 *     mutationFn: addTodo,
 *     onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
 *   }))
 * </script>
 *
 * <button
 *   onclick={() =>
 *     addMutation.mutate('Item', {
 *       onError: (error) => console.error('Failed to add item:', error),
 *     })
 *   }
 * >
 *   Add
 * </button>
 * ```
 *
 * @example
 * Rendering the mutation's own state, rather than just firing it off:
 * ```svelte
 * <script lang="ts">
 *   import { createMutation, useQueryClient } from '@tanstack/svelte-query'
 *
 *   const queryClient = useQueryClient()
 *
 *   const addMutation = createMutation(() => ({
 *     mutationFn: addTodo,
 *     onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
 *   }))
 * </script>
 *
 * {#if addMutation.isPending}
 *   Adding todo...
 * {:else}
 *   {#if addMutation.isError}
 *     <div>An error occurred: {addMutation.error.message}</div>
 *   {/if}
 *   <button onclick={() => addMutation.mutate('Item')}>Add</button>
 * {/if}
 * ```
 *
 * @example
 * Optimistic update via `onMutate`, rolling back on `onError`:
 * ```svelte
 * <script lang="ts">
 *   import { createMutation, useQueryClient } from '@tanstack/svelte-query'
 *
 *   const queryClient = useQueryClient()
 *
 *   const addMutation = createMutation(() => ({
 *     mutationFn: addTodo,
 *     onMutate: async (newTodo: string) => {
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
 * </script>
 *
 * <button onclick={() => addMutation.mutate('Item')}>Add</button>
 * ```
 *
 * @example
 * Callbacks passed per call to `mutate` only fire for the last call — `mutateAsync` gives you a
 * promise per call instead, so you can wait for all of them when they succeed:
 * ```svelte
 * <script lang="ts">
 *   import { createMutation, useQueryClient } from '@tanstack/svelte-query'
 *
 *   const queryClient = useQueryClient()
 *
 *   const addMutation = createMutation(() => ({
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
 * </script>
 *
 * <button onclick={() => handleAddAll(['Todo 1', 'Todo 2', 'Todo 3'])}>
 *   Add all
 * </button>
 * ```
 *
 * @example
 * If some of the mutations above can fail independently of the others, and you want to know which ones
 * did — rather than losing that information the moment the first one rejects — swap `Promise.all` for
 * `Promise.allSettled`:
 * ```svelte
 * <script lang="ts">
 *   import { createMutation, useQueryClient } from '@tanstack/svelte-query'
 *
 *   const queryClient = useQueryClient()
 *
 *   const addMutation = createMutation(() => ({
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
 * </script>
 *
 * <button onclick={() => handleAddAll(['Todo 1', 'Todo 2', 'Todo 3'])}>
 *   Add all
 * </button>
 * ```
 */
export function createMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
>(
  options: Accessor<CreateMutationOptions<TData, TError, TVariables, TContext>>,
  queryClient?: Accessor<QueryClient>,
): CreateMutationResult<TData, TError, TVariables, TContext> {
  const client = $derived(useQueryClient(queryClient?.()))

  // svelte-ignore state_referenced_locally - intentional, initial value
  let observer = $state(
    // svelte-ignore state_referenced_locally - intentional, initial value
    new MutationObserver<TData, TError, TVariables, TContext>(
      client,
      options(),
    ),
  )

  watchChanges(
    () => client,
    'pre',
    () => {
      observer = new MutationObserver(client, options())
    },
  )

  $effect.pre(() => {
    observer.setOptions(options())
  })

  const mutate: CreateMutateFunction<TData, TError, TVariables, TContext> = (
    ...args
  ) => {
    observer.mutate(args[0] as TVariables, args[1]).catch(noop)
  }

  let result = $state(observer.getCurrentResult())
  watchChanges(
    () => observer,
    'pre',
    () => {
      result = observer.getCurrentResult()
    },
  )

  $effect.pre(() => {
    const unsubscribe = observer.subscribe((val) => {
      notifyManager.batchCalls(() => {
        Object.assign(result, val)
      })()
    })
    return unsubscribe
  })

  const resultProxy = $derived(
    new Proxy(result, {
      get: (_, prop) => {
        const r = {
          ...result,
          mutate,
          mutateAsync: result.mutate,
        }
        if (prop == 'value') return r
        // @ts-expect-error
        return r[prop]
      },
    }),
  )

  // @ts-expect-error
  return resultProxy
}
