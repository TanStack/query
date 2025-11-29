import { notifyManager } from './notifyManager'
import { Mutation } from './mutation'
import { matchMutation, noop } from './utils'
import { Subscribable } from './subscribable'
import type { MutationObserver } from './mutationObserver'
import type {
  DefaultError,
  MutationFunctionContext,
  MutationOptions,
  NotifyEvent,
} from './types'
import type { QueryClient } from './queryClient'
import type { Action, MutationState } from './mutation'
import type { MutationFilters } from './utils'

// TYPES

interface MutationCacheConfig {
  onError?: (
    error: DefaultError,
    variables: unknown,
    onMutateResult: unknown,
    mutation: Mutation<unknown, unknown, unknown>,
    context: MutationFunctionContext,
  ) => Promise<unknown> | unknown
  onSuccess?: (
    data: unknown,
    variables: unknown,
    onMutateResult: unknown,
    mutation: Mutation<unknown, unknown, unknown>,
    context: MutationFunctionContext,
  ) => Promise<unknown> | unknown
  onMutate?: (
    variables: unknown,
    mutation: Mutation<unknown, unknown, unknown>,
    context: MutationFunctionContext,
  ) => Promise<unknown> | unknown
  onSettled?: (
    data: unknown | undefined,
    error: DefaultError | null,
    variables: unknown,
    onMutateResult: unknown,
    mutation: Mutation<unknown, unknown, unknown>,
    context: MutationFunctionContext,
  ) => Promise<unknown> | unknown
}

interface NotifyEventMutationAdded extends NotifyEvent {
  type: 'added'
  mutation: Mutation<any, any, any, any>
}
interface NotifyEventMutationRemoved extends NotifyEvent {
  type: 'removed'
  mutation: Mutation<any, any, any, any>
}

interface NotifyEventMutationObserverAdded extends NotifyEvent {
  type: 'observerAdded'
  mutation: Mutation<any, any, any, any>
  observer: MutationObserver<any, any, any>
}

interface NotifyEventMutationObserverRemoved extends NotifyEvent {
  type: 'observerRemoved'
  mutation: Mutation<any, any, any, any>
  observer: MutationObserver<any, any, any>
}

interface NotifyEventMutationObserverOptionsUpdated extends NotifyEvent {
  type: 'observerOptionsUpdated'
  mutation?: Mutation<any, any, any, any>
  observer: MutationObserver<any, any, any, any>
}

interface NotifyEventMutationUpdated extends NotifyEvent {
  type: 'updated'
  mutation: Mutation<any, any, any, any>
  action: Action<any, any, any, any>
}

export type MutationCacheNotifyEvent =
  | NotifyEventMutationAdded
  | NotifyEventMutationRemoved
  | NotifyEventMutationObserverAdded
  | NotifyEventMutationObserverRemoved
  | NotifyEventMutationObserverOptionsUpdated
  | NotifyEventMutationUpdated

type MutationCacheListener = (event: MutationCacheNotifyEvent) => void


/**
 * The `MutationCache` is the storage for mutations.
 * 
 * **Normally, you will not interact with the MutationCache directly and instead use the `QueryClient`.**
 * 
 * ```tsx
 * import { MutationCache } from '@tanstack/react-query'
 * 
 * const mutationCache = new MutationCache({
 *   onError: (error) => {
 *     console.log(error)
 *   },
 *   onSuccess: (data) => {
 *     console.log(data)
 *   },
 * })
 * ```
 * 
 * Its available methods are:
 * 
 * - [`getAll`](#mutationcachegetall)
 * - [`subscribe`](#mutationcachesubscribe)
 * - [`clear`](#mutationcacheclear)
 * 
 * **Options**
 * 
 * - `onError?: (error: unknown, variables: unknown, onMutateResult: unknown, mutation: Mutation, mutationFnContext: MutationFunctionContext) => Promise<unknown> | unknown`
 *   - Optional
 *   - This function will be called if some mutation encounters an error.
 *   - If you return a Promise from it, it will be awaited
 * - `onSuccess?: (data: unknown, variables: unknown, onMutateResult: unknown, mutation: Mutation, mutationFnContext: MutationFunctionContext) => Promise<unknown> | unknown`
 *   - Optional
 *   - This function will be called if some mutation is successful.
 *   - If you return a Promise from it, it will be awaited
 * - `onSettled?: (data: unknown | undefined, error: unknown | null, variables: unknown, onMutateResult: unknown, mutation: Mutation, mutationFnContext: MutationFunctionContext) => Promise<unknown> | unknown`
 *   - Optional
 *   - This function will be called if some mutation is settled (either successful or errored).
 *   - If you return a Promise from it, it will be awaited
 * - `onMutate?: (variables: unknown, mutation: Mutation, mutationFnContext: MutationFunctionContext) => Promise<unknown> | unknown`
 *   - Optional
 *   - This function will be called before some mutation executes.
 *   - If you return a Promise from it, it will be awaited
 * 
 * ## Global callbacks
 * 
 * The `onError`, `onSuccess`, `onSettled` and `onMutate` callbacks on the MutationCache can be used to handle these events on a global level. They are different to `defaultOptions` provided to the QueryClient because:
 * 
 * - `defaultOptions` can be overridden by each Mutation - the global callbacks will **always** be called.
 * - `onMutate` does not allow returning a result.
 * 
 * ## `mutationCache.getAll`
 * 
 * `getAll` returns all mutations within the cache.
 * 
 * > Note: This is not typically needed for most applications, but can come in handy when needing more information about a mutation in rare scenarios
 * 
 * ```tsx
 * const mutations = mutationCache.getAll()
 * ```
 * 
 * **Returns**
 * 
 * - `Mutation[]`
 *   - Mutation instances from the cache
 * 
 * ## `mutationCache.subscribe`
 * 
 * The `subscribe` method can be used to subscribe to the mutation cache as a whole and be informed of safe/known updates to the cache like mutation states changing or mutations being updated, added or removed.
 * 
 * ```tsx
 * const callback = (event) => {
 *   console.log(event.type, event.mutation)
 * }
 * 
 * const unsubscribe = mutationCache.subscribe(callback)
 * ```
 * 
 * **Options**
 * 
 * - `callback: (mutation?: MutationCacheNotifyEvent) => void`
 *   - This function will be called with the mutation cache any time it is updated.
 * 
 * **Returns**
 * 
 * - `unsubscribe: Function => void`
 *   - This function will unsubscribe the callback from the mutation cache.
 * 
 * ## `mutationCache.clear`
 * 
 * The `clear` method can be used to clear the cache entirely and start fresh.
 * 
 * ```tsx
 * mutationCache.clear()
 * ```
 */
export class MutationCache extends Subscribable<MutationCacheListener> {
  #mutations: Set<Mutation<any, any, any, any>>
  #scopes: Map<string, Array<Mutation<any, any, any, any>>>
  #mutationId: number

  constructor(public config: MutationCacheConfig = {}) {
    super()
    this.#mutations = new Set()
    this.#scopes = new Map()
    this.#mutationId = 0
  }

  build<TData, TError, TVariables, TOnMutateResult>(
    client: QueryClient,
    options: MutationOptions<TData, TError, TVariables, TOnMutateResult>,
    state?: MutationState<TData, TError, TVariables, TOnMutateResult>,
  ): Mutation<TData, TError, TVariables, TOnMutateResult> {
    const mutation = new Mutation({
      client,
      mutationCache: this,
      mutationId: ++this.#mutationId,
      options: client.defaultMutationOptions(options),
      state,
    })

    this.add(mutation)

    return mutation
  }

  add(mutation: Mutation<any, any, any, any>): void {
    this.#mutations.add(mutation)
    const scope = scopeFor(mutation)
    if (typeof scope === 'string') {
      const scopedMutations = this.#scopes.get(scope)
      if (scopedMutations) {
        scopedMutations.push(mutation)
      } else {
        this.#scopes.set(scope, [mutation])
      }
    }
    this.notify({ type: 'added', mutation })
  }

  remove(mutation: Mutation<any, any, any, any>): void {
    if (this.#mutations.delete(mutation)) {
      const scope = scopeFor(mutation)
      if (typeof scope === 'string') {
        const scopedMutations = this.#scopes.get(scope)
        if (scopedMutations) {
          if (scopedMutations.length > 1) {
            const index = scopedMutations.indexOf(mutation)
            if (index !== -1) {
              scopedMutations.splice(index, 1)
            }
          } else if (scopedMutations[0] === mutation) {
            this.#scopes.delete(scope)
          }
        }
      }
    }

    // Currently we notify the removal even if the mutation was already removed.
    // Consider making this an error or not notifying of the removal depending on the desired semantics.
    this.notify({ type: 'removed', mutation })
  }

  canRun(mutation: Mutation<any, any, any, any>): boolean {
    const scope = scopeFor(mutation)
    if (typeof scope === 'string') {
      const mutationsWithSameScope = this.#scopes.get(scope)
      const firstPendingMutation = mutationsWithSameScope?.find(
        (m) => m.state.status === 'pending',
      )
      // we can run if there is no current pending mutation (start use-case)
      // or if WE are the first pending mutation (continue use-case)
      return !firstPendingMutation || firstPendingMutation === mutation
    } else {
      // For unscoped mutations there are never any pending mutations in front of the
      // current mutation
      return true
    }
  }

  runNext(mutation: Mutation<any, any, any, any>): Promise<unknown> {
    const scope = scopeFor(mutation)
    if (typeof scope === 'string') {
      const foundMutation = this.#scopes
        .get(scope)
        ?.find((m) => m !== mutation && m.state.isPaused)

      return foundMutation?.continue() ?? Promise.resolve()
    } else {
      return Promise.resolve()
    }
  }

  clear(): void {
    notifyManager.batch(() => {
      this.#mutations.forEach((mutation) => {
        this.notify({ type: 'removed', mutation })
      })
      this.#mutations.clear()
      this.#scopes.clear()
    })
  }

  getAll(): Array<Mutation> {
    return Array.from(this.#mutations)
  }

  find<
    TData = unknown,
    TError = DefaultError,
    TVariables = any,
    TOnMutateResult = unknown,
  >(
    filters: MutationFilters,
  ): Mutation<TData, TError, TVariables, TOnMutateResult> | undefined {
    const defaultedFilters = { exact: true, ...filters }

    return this.getAll().find((mutation) =>
      matchMutation(defaultedFilters, mutation),
    ) as Mutation<TData, TError, TVariables, TOnMutateResult> | undefined
  }

  findAll(filters: MutationFilters = {}): Array<Mutation> {
    return this.getAll().filter((mutation) => matchMutation(filters, mutation))
  }

  notify(event: MutationCacheNotifyEvent) {
    notifyManager.batch(() => {
      this.listeners.forEach((listener) => {
        listener(event)
      })
    })
  }

  resumePausedMutations(): Promise<unknown> {
    const pausedMutations = this.getAll().filter((x) => x.state.isPaused)

    return notifyManager.batch(() =>
      Promise.all(
        pausedMutations.map((mutation) => mutation.continue().catch(noop)),
      ),
    )
  }
}

function scopeFor(mutation: Mutation<any, any, any, any>) {
  return mutation.options.scope?.id
}
