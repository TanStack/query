import { notifyManager } from './notifyManager'
import { mutationCacheKey } from './queryClient'
import { Subscribable } from './subscribable'
import { matchMutation, noop } from './utils'
import type * as Shared from '@tanstack/query-types/bindings'
import type { Mutation } from './mutation'
import type { QueryClient } from './queryClient'
import type { QueryRuntime } from './runtimeBinding'
import type { DefaultError } from './types'
import type { MutationFilters } from './utils'

/** {@inheritDoc Shared.MutationCacheConfig} */
export type MutationCacheConfig = Shared.MutationCacheConfig<QueryRuntime>

/** {@inheritDoc Shared.MutationCacheNotifyEvent} */
export type MutationCacheNotifyEvent =
  Shared.MutationCacheNotifyEvent<QueryRuntime>

type MutationCacheListener = Shared.MutationCacheListener<QueryRuntime>

/**
 * Returns the client's configured mutation cache, creating a default cache on
 * first use. Mutation hooks and hydration share this cache.
 * @param client - The client whose mutations you want to access.
 * @returns The same mutation cache on every call for this client.
 * @example
 * ```ts
 * import { getMutationCache } from '@tanstack/react-query-no-core-pluggable'
 *
 * const pending = getMutationCache(queryClient).findAll({ status: 'pending' })
 * ```
 */
export function getMutationCache(client: QueryClient): MutationCache {
  return (client[mutationCacheKey] ??= new MutationCache())
}

/**
 * Stores the mutations executed through a client. Use {@link getMutationCache} to
 * access the cache that mutation hooks use. Subscribe to it to receive updates
 * when a mutation is added, removed, or changes state.
 * @example
 * ```ts
 * const unsubscribe = mutationCache.subscribe((event) => {
 *   console.log(event.type, event.mutation)
 * })
 * ```
 */
export class MutationCache extends Subscribable<MutationCacheListener> {
  #mutations: Set<Mutation<any, any, any, any>>
  #mutationId: number

  constructor(public config: MutationCacheConfig = {}) {
    super()
    this.#mutations = new Set()
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
    mutation.options.scope?.add(this, mutation)
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
      mutation.options.scope?.remove(this, mutation)
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
    return mutation.options.scope?.canRun(this, mutation) ?? true
  }

  /**
   * Continues the next paused mutation in the same `scope` after a mutation finishes.
   * @internal
   * @param mutation - The mutation that finished.
   * @returns A promise that resolves once the next paused mutation in the same scope has continued,
   * or immediately if there is none.
   */
  runNext(mutation: Mutation<any, any, any, any>): Promise<unknown> {
    return mutation.options.scope?.runNext(this, mutation) ?? Promise.resolve()
  }

  /**
   * Removes all mutations and clears their garbage collection timers.
   * Mutations that are already running continue to execute.
   * @example
   * ```ts
   * const mutationCache = getMutationCache(queryClient)
   *
   * mutationCache.clear()
   * ```
   */
  clear(): void {
    notifyManager.batch(() => {
      const mutations = this.getAll()
      this.#mutations.clear()
      mutations.forEach((mutation) => {
        mutation.options.scope?.remove(this, mutation)
        mutation.destroy()
      })
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
   * const mutationCache = getMutationCache(queryClient)
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
   * const mutationCache = getMutationCache(queryClient)
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
   * const mutationCache = getMutationCache(queryClient)
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
