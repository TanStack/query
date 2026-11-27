import type { Mutation } from './mutation'
import type { MutationCache } from './mutationCache'

type QueuedMutation = Mutation<any, any, any, any>

// Each cache owns its own queues, even when clients reuse the same option.
const queues = new WeakMap<MutationCache, Map<string, Set<QueuedMutation>>>()

/** Runs mutations with the same ID in registration order within one cache. */
class SerialScope {
  constructor(readonly id: string) {}

  /**
   * Registers a mutation in this cache's queue.
   * @internal
   * @param cache - The cache owning this queue.
   * @param mutation - The mutation to register.
   */
  add(cache: MutationCache, mutation: QueuedMutation): void {
    let scopes = queues.get(cache)
    if (!scopes) {
      scopes = new Map()
      queues.set(cache, scopes)
    }
    let queue = scopes.get(this.id)
    if (!queue) {
      queue = new Set()
      scopes.set(this.id, queue)
    }
    queue.add(mutation)
  }

  /**
   * Releases the mutation and any empty queue.
   * @internal
   * @param cache - The cache owning this queue.
   * @param mutation - The mutation to remove.
   */
  remove(cache: MutationCache, mutation: QueuedMutation): void {
    const scopes = queues.get(cache)
    if (!scopes) return
    const queue = scopes.get(this.id)
    if (queue?.delete(mutation) && !queue.size) {
      scopes.delete(this.id)
      if (!scopes.size) queues.delete(cache)
    }
  }

  /**
   * Checks whether this mutation is the first pending member.
   * @internal
   * @param cache - The cache owning this queue.
   * @param mutation - The mutation to check.
   * @returns Whether this mutation can start or continue.
   */
  canRun(cache: MutationCache, mutation: QueuedMutation): boolean {
    const queue = queues.get(cache)?.get(this.id)
    if (queue) {
      for (const entry of queue) {
        if (entry.state.status === 'pending') return entry === mutation
      }
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
    cache: MutationCache,
    mutation: QueuedMutation,
  ): Promise<unknown> | undefined {
    const queue = queues.get(cache)?.get(this.id)
    if (queue) {
      for (const entry of queue) {
        if (entry !== mutation && entry.state.isPaused) return entry.continue()
      }
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
