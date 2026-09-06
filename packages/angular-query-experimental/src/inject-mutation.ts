import {
  Injector,
  NgZone,
  assertInInjectionContext,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core'
import {
  MutationObserver,
  QueryClient,
  noop,
  notifyManager,
  shouldThrowError,
} from '@tanstack/query-core'
import { signalProxy } from './signal-proxy'
import { PENDING_TASKS } from './pending-tasks-compat'
import type { PendingTaskRef } from './pending-tasks-compat'
import type { DefaultError, MutationObserverResult } from '@tanstack/query-core'
import type {
  CreateMutateFunction,
  CreateMutationOptions,
  CreateMutationResult,
} from './types'

export interface InjectMutationOptions {
  /**
   * The `Injector` in which to create the mutation.
   *
   * If this is not provided, the current injection context will be used instead (via `inject`).
   */
  injector?: Injector
}

/**
 * Unlike queries, mutations are typically used to create/update/delete data or perform server side-effects.
 * `injectMutation` is the function for that. Unlike queries, mutations are not run automatically.
 *
 * @remarks `mutate`/`mutateAsync` also accept per-call `onSuccess`/`onError`/`onSettled` callbacks as a
 * second argument, useful for triggering call-site side effects (e.g. navigation) without coupling them to
 * the shared mutation definition. Callbacks defined in `injectMutationFn` fire for every mutation; per-call
 * callbacks fire only for the latest call you've made — `mutateAsync` gives you a promise per call instead,
 * so you can await `Promise.all`/`Promise.allSettled` over several calls and see each one's outcome.
 * @see {@link mutationOptions} to share these options across multiple `injectMutation` call sites, or to look
 * the mutation up elsewhere via its `mutationKey` (e.g. with `injectMutationState`).
 * @param injectMutationFn - A function that returns mutation options. Similar to `computed` from Angular,
 * this function runs in the reactive context, so signals read inside it drive the mutation's options.
 * @param options - Additional configuration
 * @returns The mutation result. Value fields are exposed as a `Signal` — read `data`/`error` by calling them
 * (e.g. `mutation.data()`) — while function fields (`mutate`, `mutateAsync`, `reset`) are called directly,
 * unchanged. `isSuccess`/`isError`/`isPending`/`isIdle` are type-guard methods you can call to narrow whether
 * `data` is defined.
 *
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
 *
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
 *
 * @example
 * Callbacks passed per call to `mutate` only fire for the last call — `mutateAsync` gives you a promise per
 * call instead, so you can wait for all of them:
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
 *
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
  injectMutationFn: () => CreateMutationOptions<
    TData,
    TError,
    TVariables,
    TOnMutateResult
  >,
  options?: InjectMutationOptions,
): CreateMutationResult<TData, TError, TVariables, TOnMutateResult> {
  !options?.injector && assertInInjectionContext(injectMutation)
  const injector = options?.injector ?? inject(Injector)
  const ngZone = injector.get(NgZone)
  const pendingTasks = injector.get(PENDING_TASKS)
  const queryClient = injector.get(QueryClient)

  /**
   * computed() is used so signals can be inserted into the options
   * making it reactive. Wrapping options in a function ensures embedded expressions
   * are preserved and can keep being applied after signal changes
   */
  const optionsSignal = computed(injectMutationFn)

  const observerSignal = (() => {
    let instance: MutationObserver<
      TData,
      TError,
      TVariables,
      TOnMutateResult
    > | null = null

    return computed(() => {
      return (instance ||= new MutationObserver(queryClient, optionsSignal()))
    })
  })()

  const mutateFnSignal = computed<
    CreateMutateFunction<TData, TError, TVariables, TOnMutateResult>
  >(() => {
    const observer = observerSignal()
    return (
      ...args: Parameters<
        CreateMutateFunction<TData, TError, TVariables, TOnMutateResult>
      >
    ) => {
      observer.mutate(args[0] as TVariables, args[1]).catch(noop)
    }
  })

  /**
   * Computed signal that gets result from mutation cache based on passed options
   */
  const resultFromInitialOptionsSignal = computed(() => {
    const observer = observerSignal()
    return observer.getCurrentResult()
  })

  /**
   * Signal that contains result set by subscriber
   */
  const resultFromSubscriberSignal = signal<MutationObserverResult<
    TData,
    TError,
    TVariables,
    TOnMutateResult
  > | null>(null)

  effect(
    () => {
      const observer = observerSignal()
      const observerOptions = optionsSignal()

      untracked(() => {
        observer.setOptions(observerOptions)
      })
    },
    {
      injector,
    },
  )

  effect(
    (onCleanup) => {
      // observer.trackResult is not used as this optimization is not needed for Angular
      const observer = observerSignal()
      let pendingTaskRef: PendingTaskRef | null = null

      untracked(() => {
        const unsubscribe = ngZone.runOutsideAngular(() =>
          observer.subscribe(
            notifyManager.batchCalls((state) => {
              ngZone.run(() => {
                // Track pending task when mutation is pending
                if (state.isPending && !pendingTaskRef) {
                  pendingTaskRef = pendingTasks.add()
                }

                // Clear pending task when mutation is no longer pending
                if (!state.isPending && pendingTaskRef) {
                  pendingTaskRef()
                  pendingTaskRef = null
                }

                if (
                  state.isError &&
                  shouldThrowError(observer.options.throwOnError, [state.error])
                ) {
                  ngZone.onError.emit(state.error)
                  throw state.error
                }

                resultFromSubscriberSignal.set(state)
              })
            }),
          ),
        )
        onCleanup(() => {
          // Clean up any pending task on destroy
          if (pendingTaskRef) {
            pendingTaskRef()
            pendingTaskRef = null
          }
          unsubscribe()
        })
      })
    },
    {
      injector,
    },
  )

  const resultSignal = computed(() => {
    const resultFromSubscriber = resultFromSubscriberSignal()
    const resultFromInitialOptions = resultFromInitialOptionsSignal()

    const result = resultFromSubscriber ?? resultFromInitialOptions

    return {
      ...result,
      mutate: mutateFnSignal(),
      mutateAsync: result.mutate,
    }
  })

  return signalProxy(resultSignal) as CreateMutationResult<
    TData,
    TError,
    TVariables,
    TOnMutateResult
  >
}
