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

/**
 * Global callbacks that fire for every mutation handled by a `MutationCache`, regardless of which
 * component or observer triggered it. They differ from the `defaultOptions` provided to a
 * `QueryClient` in two ways: `defaultOptions` can be overridden by each mutation, while these
 * callbacks are always called, and `onMutate` here does not allow returning a result.
 *
 * If a callback returns a promise, it will be awaited before the mutation continues.
 */
export interface MutationCacheConfig {
  /** Called when any mutation in the cache encounters an error. */
  onError?: (
    error: DefaultError,
    variables: unknown,
    onMutateResult: unknown,
    mutation: Mutation<unknown, unknown, unknown>,
    context: MutationFunctionContext,
  ) => Promise<unknown> | unknown
  /** Called when any mutation in the cache is successful. */
  onSuccess?: (
    data: unknown,
    variables: unknown,
    onMutateResult: unknown,
    mutation: Mutation<unknown, unknown, unknown>,
    context: MutationFunctionContext,
  ) => Promise<unknown> | unknown
  /** Called before any mutation in the cache executes. */
  onMutate?: (
    variables: unknown,
    mutation: Mutation<unknown, unknown, unknown>,
    context: MutationFunctionContext,
  ) => Promise<unknown> | unknown
  /** Called when any mutation in the cache is settled, either successfully or with an error. */
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

/**
 * The event passed to a `MutationCache` subscriber. Fired whenever a mutation is added or removed
 * from the cache, its state is updated, or one of its observers is added, removed, or has its
 * options updated.
 */
export type MutationCacheNotifyEvent =
  | NotifyEventMutationAdded
  | NotifyEventMutationRemoved
  | NotifyEventMutationObserverAdded
  | NotifyEventMutationObserverRemoved
  | NotifyEventMutationObserverOptionsUpdated
  | NotifyEventMutationUpdated

type MutationCacheListener = (event: MutationCacheNotifyEvent) => void

// CLASS

/**
 * The `MutationCache` is the storage for mutations.
 *
 * Normally, you will not interact with the `MutationCache` directly and instead use a
 * `QueryClient`. You can subscribe to it (inherited from `Subscribable`) to be informed of
 * safe/known updates to the cache, such as mutations being added, removed, or updated.
 *
 * @example
 * ```ts
 * const unsubscribe = mutationCache.subscribe((event) => {
 *   console.log(event.type, event.mutation)
 * })
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

  /** @internal */
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

  /** @internal */
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

  /** @internal */
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

  /** @internal */
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

  /** @internal */
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

  /**
   * Removes all mutations from the cache.
   *
   * @example
   * ```ts
   * const mutationCache = queryClient.getMutationCache()
   *
   * mutationCache.clear()
   * ```
   */
  clear(): void {
    notifyManager.batch(() => {
      this.#mutations.forEach((mutation) => {
        this.notify({ type: 'removed', mutation })
      })
      this.#mutations.clear()
      this.#scopes.clear()
    })
  }

  /**
   * Returns all mutations within the cache.
   *
   * This is not typically needed for most applications, but can come in handy when needing more
   * information about a mutation in rare scenarios.
   *
   * @example
   * ```ts
   * const mutationCache = queryClient.getMutationCache()
   *
   * const mutations = mutationCache.getAll()
   * ```
   */
  getAll(): Array<Mutation> {
    return Array.from(this.#mutations)
  }

  /**
   * A slightly more advanced method that can be used to get an existing mutation instance from
   * the cache. If the mutation does not exist, `undefined` is returned.
   *
   * This is not typically needed for most applications, but can come in handy when needing more
   * information about a mutation in rare scenarios.
   *
   * @see {@link MutationCache#findAll}
   * @example
   * ```ts
   * const mutationCache = queryClient.getMutationCache()
   *
   * const mutation = mutationCache.find({ mutationKey: ['addPost'] })
   * ```
   */
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

  /**
   * An even more advanced method that can be used to get existing mutation instances from the
   * cache that match the given filters. If no mutations match, an empty array is returned.
   *
   * This is not typically needed for most applications, but can come in handy when needing more
   * information about mutations in rare scenarios.
   *
   * @see {@link MutationCache#find}
   * @example
   * ```ts
   * const mutationCache = queryClient.getMutationCache()
   *
   * const mutations = mutationCache.findAll({ mutationKey: ['addPost'] })
   * ```
   */
  findAll(filters: MutationFilters = {}): Array<Mutation> {
    return this.getAll().filter((mutation) => matchMutation(filters, mutation))
  }

  /** @internal */
  notify(event: MutationCacheNotifyEvent) {
    notifyManager.batch(() => {
      this.listeners.forEach((listener) => {
        listener(event)
      })
    })
  }

  /** @internal */
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
