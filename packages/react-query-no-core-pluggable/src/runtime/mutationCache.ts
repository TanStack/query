import { notifyManager } from './notifyManager'
import { Subscribable } from './subscribable'
import { matchMutation, noop } from './utils'
import type * as Shared from '@tanstack/query-types/bindings'
import type { Mutation } from './mutation'
import type { QueryRuntime } from './runtimeBinding'
import type { DefaultError } from './types'
import type { MutationFilters } from './utils'

/** {@inheritDoc Shared.MutationCacheConfig} */
export type MutationCacheConfig = Shared.MutationCacheConfig<QueryRuntime>

/** {@inheritDoc Shared.MutationCacheNotifyEvent} */
export type MutationCacheNotifyEvent =
  Shared.MutationCacheNotifyEvent<QueryRuntime>

type MutationCacheListener = Shared.MutationCacheListener<QueryRuntime>

// CLASS

/**
 * The `MutationCache` is the storage for mutations.
 *
 * Normally, you will not interact with the `MutationCache` directly and instead use a
 * `QueryClient`. You can subscribe to it (inherited from `Subscribable`) to be informed of
 * safe/known updates to the cache, such as mutations being added, removed, or updated.
 * @example
 * ```ts
 * const unsubscribe = mutationCache.subscribe((event) => {
 *   console.log(event.type, event.mutation)
 * })
 * ```
 */
export class MutationCache extends Subscribable<MutationCacheListener> {
  #mutations: Set<Mutation<any, any, any, any>>
  #scopes: Map<string | undefined, Array<Mutation<any, any, any, any>>>
  #mutationId: number

  constructor(public config: MutationCacheConfig = {}) {
    super()
    this.#mutations = new Set()
    this.#scopes = new Map()
    this.#mutationId = 0
  }

  /**
   * Assigns the next cache-local ID and registers the mutation.
   * @internal
   * @param create - Constructs the mutation with the assigned ID.
   * @returns The mutation added to this cache.
   */
  register<T extends Mutation<any, any, any, any>>(
    create: (id: number) => T,
  ): T {
    const mutation = create(++this.#mutationId)
    this.add(mutation)
    return mutation
  }

  /**
   * Adds a mutation to the cache.
   * @internal
   * @param mutation - The mutation to add. If it has a `scope`, it is queued in that scope.
   */
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

  /**
   * Removes a mutation from the cache and clears its garbage collection timer.
   * @internal
   * @param mutation - The mutation to remove, also from its scope's queue.
   */
  remove(mutation: Mutation<any, any, any, any>): void {
    if (this.#mutations.delete(mutation)) {
      mutation.destroy()
      const scope = scopeFor(mutation)
      const scopedMutations = this.#scopes.get(scope)
      if (scopedMutations) {
        const index = scopedMutations.indexOf(mutation)
        if (index !== -1) {
          scopedMutations.splice(index, 1)
          if (!scopedMutations.length) {
            this.#scopes.delete(scope)
          }
        }
      }
    }

    // Currently we notify the removal even if the mutation was already removed.
    // Consider making this an error or not notifying of the removal depending on the desired semantics.
    this.notify({ type: 'removed', mutation })
  }

  /**
   * Checks whether this cache still holds the given mutation.
   * @internal
   * @param mutation - The mutation to check.
   * @returns Whether the mutation is in the cache.
   */
  has(mutation: Mutation<any, any, any, any>): boolean {
    return this.#mutations.has(mutation)
  }

  /**
   * Checks whether a mutation can run now, given the other mutations in its `scope`.
   * @internal
   * @param mutation - The mutation to check.
   * @returns `true` if the mutation has no `scope`, or no other mutation in its scope is pending
   * ahead of it.
   */
  canRun(mutation: Mutation<any, any, any, any>): boolean {
    const firstPendingMutation = this.#scopes
      .get(scopeFor(mutation))
      ?.find((candidate) => candidate.state.status === 'pending')
    return !firstPendingMutation || firstPendingMutation === mutation
  }

  /**
   * Continues the next paused mutation in the same `scope` after a mutation finishes.
   * @internal
   * @param mutation - The mutation that finished.
   * @returns A promise that resolves once the next paused mutation in the same scope has continued,
   * or immediately if there is none.
   */
  runNext(mutation: Mutation<any, any, any, any>): Promise<unknown> {
    const next = this.#scopes
      .get(scopeFor(mutation))
      ?.find((entry) => entry !== mutation && entry.state.isPaused)

    return next?.continue() ?? Promise.resolve()
  }

  /**
   * Removes all mutations and clears their garbage collection timers.
   * Mutations that are already running continue to execute.
   * @example
   * ```ts
   * const mutationCache = queryClient.getMutationCache()
   *
   * mutationCache.clear()
   * ```
   */
  clear(): void {
    notifyManager.batch(() => {
      const mutations = this.getAll()
      this.#mutations.clear()
      this.#scopes.clear()
      mutations.forEach((mutation) => mutation.destroy())
      mutations.forEach((mutation) => {
        this.notify({ type: 'removed', mutation })
      })
    })
  }

  /**
   * Returns all mutations within the cache.
   *
   * This is not typically needed for most applications, but can come in handy when needing more
   * information about a mutation in rare scenarios.
   * @returns Every mutation in the cache.
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
   * @param filters - The filters to match. `exact` defaults to `true`.
   * @returns The first matching mutation, or `undefined`.
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
      matchMutation(defaultedFilters, mutation, this.config.mutationKey),
    ) as Mutation<TData, TError, TVariables, TOnMutateResult> | undefined
  }

  /**
   * An even more advanced method that can be used to get existing mutation instances from the
   * cache that match the given filters. If no mutations match, an empty array is returned.
   *
   * This is not typically needed for most applications, but can come in handy when needing more
   * information about mutations in rare scenarios.
   * @param filters - The filters to match. Without filters, every mutation is returned.
   * @returns The matching mutations.
   * @see {@link MutationCache#find}
   * @example
   * ```ts
   * const mutationCache = queryClient.getMutationCache()
   *
   * const mutations = mutationCache.findAll({ mutationKey: ['addPost'] })
   * ```
   */
  findAll(filters: MutationFilters = {}): Array<Mutation> {
    return this.getAll().filter((mutation) =>
      matchMutation(filters, mutation, this.config.mutationKey),
    )
  }

  /**
   * Notifies every cache listener of an event, in one batch.
   * @internal
   * @param event - The event passed to every listener.
   */
  notify(event: MutationCacheNotifyEvent) {
    notifyManager.batch(() => {
      this.listeners.forEach((listener) => {
        listener(event)
      })
    })
  }

  /**
   * Continues every paused mutation, e.g. when the app comes back online.
   * @internal
   * @returns A promise that resolves once every paused mutation has continued and settled.
   */
  resumePausedMutations(): Promise<unknown> {
    const pausedMutations = this.getAll().filter((x) => x.state.isPaused)

    return notifyManager.batch(() =>
      Promise.all(
        pausedMutations.map((mutation) => mutation.continue().catch(noop)),
      ),
    )
  }
}

/**
 * Returns the scope id of a mutation, used to run mutations with the same scope one after another.
 * @param mutation - The mutation to read the scope of.
 * @returns The mutation's `scope.id`, or `undefined` if it has no scope.
 */
function scopeFor(mutation: Mutation<any, any, any, any>) {
  return mutation.options.scope?.id
}
