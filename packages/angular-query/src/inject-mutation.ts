import {
  assertInInjectionContext,
  computed,
  effect,
  inject,
  untracked,
} from '@angular/core'
import { MutationObserver, QueryClient, noop } from '@tanstack/query-core'
import { injectExternalStore } from './utils/inject-external-store'
import { injectPendingTasksLifecycle } from './utils/inject-pending-tasks-lifecycle'
import { injectQueryZone } from './utils/inject-query-zone'
import { mutationResultFields } from './utils/result-fields'
import { signalProxy } from './utils/signal-proxy'
import type { DefaultError } from '@tanstack/query-core'
import type {
  CreateMutateAsyncFunction,
  CreateMutateFunction,
  CreateMutationOptions,
  CreateMutationResult,
} from './types'

/**
 * Unlike queries, mutations are typically used to create/update/delete data or perform server side-effects.
 * `injectMutation` is the function for that. Unlike queries, mutations are not run automatically.
 * @param optionsFn - A function that returns mutation options. Similar to `computed` from Angular, this
 * function runs in the reactive context, so signals read inside it drive the mutation's options.
 * @returns The mutation result. Value fields are exposed as a `Signal` — read `data`/`error` by calling them
 * (e.g. `mutation.data()`) — while function fields (`mutate`, `mutateAsync`, `reset`) are called directly,
 * unchanged. `isSuccess`/`isError`/`isPending`/`isIdle` are type-guard methods you can call to narrow whether
 * `data` is defined.
 * @remarks `mutate`/`mutateAsync` also accept per-call `onSuccess`/`onError`/`onSettled` callbacks as a
 * second argument, useful for triggering call-site side effects (e.g. navigation) without coupling them to
 * the shared mutation definition. Callbacks defined in `optionsFn` fire for every mutation; per-call
 * callbacks fire only for the latest call you've made — `mutateAsync` gives you a promise per call instead,
 * so you can await `Promise.all`/`Promise.allSettled` over several calls and see each one's outcome.
 * @see https://tanstack.com/query/latest/docs/framework/angular/guides/mutations
 * @see {@link mutationOptions} to share these options across multiple `injectMutation` call sites, or to look
 * the mutation up elsewhere via its `mutationKey` (e.g. with `injectMutationState`).
 * @example
 * ```angular-ts
 * @Component({
 *   selector: 'todos',
 *   template: `
 *     @if (addMutation.isPending()) {
 *       <span>Adding todo...</span>
 *     } @else if (addMutation.isError()) {
 *       <div>An error occurred: {{ addMutation.error()?.message }}</div>
 *     }
 *     <button (click)="addMutation.mutate('Item')">Add</button>
 *   `,
 * })
 * export class Todos {
 *   readonly #queryClient = inject(QueryClient)
 *
 *   readonly addMutation = injectMutation(() => ({
 *     mutationFn: addTodo,
 *     onSuccess: () => this.#queryClient.invalidateQueries({ queryKey: ['todos'] }),
 *   }))
 * }
 * ```
 * @example
 * Optimistic update via `onMutate`, rolling back on `onError`:
 * ```angular-ts
 * @Component({
 *   selector: 'todos',
 *   template: `<button (click)="addMutation.mutate('Item')">Add</button>`,
 * })
 * export class Todos {
 *   readonly #queryClient = inject(QueryClient)
 *
 *   readonly addMutation = injectMutation(() => ({
 *     mutationFn: addTodo,
 *     onMutate: async (newTodo) => {
 *       await this.#queryClient.cancelQueries({ queryKey: ['todos'] })
 *       const previousTodos = this.#queryClient.getQueryData<Array<string>>(['todos'])
 *
 *       this.#queryClient.setQueryData<Array<string>>(['todos'], (old) => [
 *         ...(old ?? []),
 *         newTodo,
 *       ])
 *
 *       // Passed to `onError` as `onMutateResult` if the mutation fails.
 *       return { previousTodos }
 *     },
 *     onError: (_err, _newTodo, onMutateResult) => {
 *       this.#queryClient.setQueryData(['todos'], onMutateResult?.previousTodos)
 *     },
 *     onSettled: () => {
 *       this.#queryClient.invalidateQueries({ queryKey: ['todos'] })
 *     },
 *   }))
 * }
 * ```
 * @example
 * Callbacks passed per call to `mutate` only fire for the last call — `mutateAsync` gives you a promise per
 * call instead, so you can wait for all of them when they succeed:
 * ```angular-ts
 * @Component({
 *   selector: 'todos',
 *   template: `
 *     <button (click)="handleAddAll(['Todo 1', 'Todo 2', 'Todo 3'])">Add all</button>
 *   `,
 * })
 * export class Todos {
 *   readonly #queryClient = inject(QueryClient)
 *
 *   readonly addMutation = injectMutation(() => ({
 *     mutationFn: addTodo,
 *     onSuccess: () => this.#queryClient.invalidateQueries({ queryKey: ['todos'] }),
 *   }))
 *
 *   async handleAddAll(todos: Array<string>) {
 *     try {
 *       await Promise.all(todos.map((todo) => this.addMutation.mutateAsync(todo)))
 *     } catch (error) {
 *       console.error('Failed to add todos:', error)
 *     }
 *   }
 * }
 * ```
 * @example
 * If some of the mutations above can fail independently of the others, and you want to know which ones did —
 * rather than losing that information the moment the first one rejects — swap `Promise.all` for
 * `Promise.allSettled`:
 * ```angular-ts
 * @Component({
 *   selector: 'todos',
 *   template: `
 *     <button (click)="handleAddAll(['Todo 1', 'Todo 2', 'Todo 3'])">Add all</button>
 *   `,
 * })
 * export class Todos {
 *   readonly #queryClient = inject(QueryClient)
 *
 *   readonly addMutation = injectMutation(() => ({
 *     mutationFn: addTodo,
 *     onSuccess: () => this.#queryClient.invalidateQueries({ queryKey: ['todos'] }),
 *   }))
 *
 *   async handleAddAll(todos: Array<string>) {
 *     const addResults = await Promise.allSettled(
 *       todos.map((todo) => this.addMutation.mutateAsync(todo)),
 *     )
 *
 *     addResults.forEach((addResult, index) => {
 *       if (addResult.status === 'rejected') {
 *         console.error(`Failed to add "${todos[index]}":`, addResult.reason)
 *       }
 *     })
 *   }
 * }
 * ```
 */
export function injectMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  optionsFn: () => CreateMutationOptions<
    TData,
    TError,
    TVariables,
    TOnMutateResult
  >,
): CreateMutationResult<TData, TError, TVariables, TOnMutateResult> {
  if (typeof ngDevMode === 'undefined' || ngDevMode) {
    assertInInjectionContext(injectMutation)
  }
  const outsideZone = injectQueryZone()
  const queryClient = inject(QueryClient)
  const lifecycle = injectPendingTasksLifecycle()

  const optionsSignal = computed(optionsFn)

  const observerSignal = computed(
    () => new MutationObserver(queryClient, untracked(optionsSignal)),
  )

  // Configure the observer outside the result computation. Mutation-cache
  // listeners can synchronously read the public result while setOptions emits.
  effect(() => {
    const options = optionsSignal()
    outsideZone(() => untracked(() => observerSignal().setOptions(options)))
  })

  const mutationStateSignal = injectExternalStore(() => {
    const observer = observerSignal()
    return {
      getSnapshot: () => observer.getCurrentResult(),
      subscribe: (onStoreChange) => observer.subscribe(onStoreChange),
    }
  })

  const mutate: CreateMutateFunction<
    TData,
    TError,
    TVariables,
    TOnMutateResult
  > = (...args) => {
    mutateAsync(...args).catch(noop)
  }

  let pendingInvocations = 0

  const mutateAsync: CreateMutateAsyncFunction<
    TData,
    TError,
    TVariables,
    TOnMutateResult
  > = (...args) => {
    return outsideZone(() =>
      untracked(() => {
        const observer = observerSignal()
        observer.setOptions(optionsSignal())
        pendingInvocations++
        lifecycle.setPending(true)
        // Track invocations, not the observer's latest result: reset or a later
        // mutation completing must not release work which is still running.
        const settled = () => {
          pendingInvocations--
          lifecycle.setPending(pendingInvocations > 0)
        }
        try {
          return observer
            .mutate(args[0] as TVariables, args[1])
            .finally(settled)
        } catch (error) {
          settled()
          throw error
        }
      }),
    )
  }

  const reset = () => {
    outsideZone(() =>
      untracked(() => {
        const observer = observerSignal()
        observer.setOptions(optionsSignal())
        observer.reset()
      }),
    )
  }

  return Object.assign(signalProxy(mutationStateSignal, mutationResultFields), {
    mutate,
    mutateAsync,
    reset,
  }) as unknown as CreateMutationResult<
    TData,
    TError,
    TVariables,
    TOnMutateResult
  >
}
