import type { Mutation } from './mutation'
import type { MutationCache } from './mutationCache'

type QueuedMutation = Mutation<any, any, any, any>

// A shared cache coordinates scopes created by independently bundled clients.
const queues = Symbol.for('@tanstack/query-core/serialScopes')
type ScopedCache = MutationCache & {
  [queues]?: Record<string, Set<QueuedMutation> | undefined>
}

/** Runs mutations with the same ID in registration order within one cache. */
class SerialScope {
  constructor(readonly id: string) {}

  /**
   * Registers a mutation in this cache's queue.
   * @internal
   * @param cache - The cache owning this queue.
   * @param mutation - The mutation to register.
   */
  add(cache: ScopedCache, mutation: QueuedMutation): void {
    // Scope IDs are application strings, so the table must accept keys such as "__proto__".
    const scopes: NonNullable<ScopedCache[typeof queues]> = (cache[queues] ??=
      Object.create(null))
    const queue = (scopes[this.id] ??= new Set())
    queue.add(mutation)
  }

  /**
   * Releases the mutation and any empty queue.
   * @internal
   * @param cache - The cache owning this queue.
   * @param mutation - The mutation to remove.
   */
  remove(cache: ScopedCache, mutation: QueuedMutation): void {
    const scopes = cache[queues]
    if (!scopes) return
    const queue = scopes[this.id]
    if (queue?.delete(mutation) && !queue.size) {
      delete scopes[this.id]
    }
  }

  /**
   * Checks whether this mutation is the first pending member.
   * @internal
   * @param cache - The cache owning this queue.
   * @param mutation - The mutation to check.
   * @returns Whether this mutation can start or continue.
   */
  canRun(cache: ScopedCache, mutation: QueuedMutation): boolean {
    for (const entry of cache[queues]?.[this.id] ?? []) {
      if (entry.state.status === 'pending') return entry === mutation
    }
    return true
  }

  /**
   * Resumes the first waiting mutation after its predecessor settles.
   * @internal
   * @param cache - The cache owning this queue.
   * @param mutation - The mutation to finish.
   * @returns The next waiting mutation’s promise, if present.
   */
  runNext(
    cache: ScopedCache,
    mutation: QueuedMutation,
  ): Promise<unknown> | undefined {
    for (const entry of cache[queues]?.[this.id] ?? []) {
      if (entry !== mutation && entry.state.isPaused) return entry.continue()
    }
    return undefined
  }
}

/**
 * Selects FIFO execution for mutations sharing this ID in the same cache.
 * @param id - The queue identifier, preserved in dehydrated mutation snapshots.
 * @returns The value to pass to the mutation's `scope` option.
 */
export function serialScope(id: string): SerialScope {
  return new SerialScope(id)
}

export type { SerialScope }
