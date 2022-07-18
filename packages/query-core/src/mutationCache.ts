import { MutationObserver } from './mutationObserver'
import type { MutationOptions } from './types'
import type { QueryClient } from './queryClient'
import { notifyManager } from './notifyManager'
import { Action, Mutation, MutationState } from './mutation'
import { matchMutation, MutationFilters, noop } from './utils'
import { Subscribable } from './subscribable'

// TYPES

interface MutationCacheConfig {
  onError?: (
    error: unknown,
    variables: unknown,
    context: unknown,
    mutation: Mutation<unknown, unknown, unknown>,
  ) => void
  onSuccess?: (
    data: unknown,
    variables: unknown,
    context: unknown,
    mutation: Mutation<unknown, unknown, unknown>,
  ) => void
  onMutate?: (
    variables: unknown,
    mutation: Mutation<unknown, unknown, unknown, unknown>,
  ) => void
}

interface NotifyEventMutationAdded {
  type: 'added'
  mutation: Mutation<any, any, any, any>
}
interface NotifyEventMutationRemoved {
  type: 'removed'
  mutation: Mutation<any, any, any, any>
}

interface NotifyEventMutationObserverAdded {
  type: 'observerAdded'
  mutation: Mutation<any, any, any, any>
  observer: MutationObserver<any, any, any>
}

interface NotifyEventMutationObserverRemoved {
  type: 'observerRemoved'
  mutation: Mutation<any, any, any, any>
  observer: MutationObserver<any, any, any>
}

interface NotifyEventMutationUpdated {
  type: 'updated'
  mutation: Mutation<any, any, any, any>
  action: Action<any, any, any, any>
}

type MutationCacheNotifyEvent =
  | NotifyEventMutationAdded
  | NotifyEventMutationRemoved
  | NotifyEventMutationObserverAdded
  | NotifyEventMutationObserverRemoved
  | NotifyEventMutationUpdated

type MutationCacheListener = (event: MutationCacheNotifyEvent) => void

// CLASS

export class MutationCache extends Subscribable<MutationCacheListener> {
  config: MutationCacheConfig

  private mutations: Mutation<any, any, any, any>[]
  private mutationId: number

  constructor(config?: MutationCacheConfig) {
    super()
    this.config = config || {}
    this.mutations = []
    this.mutationId = 0
  }

  build<TData, TError, TVariables, TContext>(
    client: QueryClient,
    options: MutationOptions<TData, TError, TVariables, TContext>,
    state?: MutationState<TData, TError, TVariables, TContext>,
  ): Mutation<TData, TError, TVariables, TContext> {
    const mutation = new Mutation({
      mutationCache: this,
      logger: client.getLogger(),
      mutationId: ++this.mutationId,
      options: client.defaultMutationOptions(options),
      state,
      defaultOptions: options.mutationKey
        ? client.getMutationDefaults(options.mutationKey)
        : undefined,
      meta: options.meta,
    })

    this.add(mutation)

    return mutation
  }

  add(mutation: Mutation<any, any, any, any>): void {
    this.mutations.push(mutation)
    this.notify({ type: 'added', mutation })
  }

  remove(mutation: Mutation<any, any, any, any>): void {
    this.mutations = this.mutations.filter((x) => x !== mutation)
    this.notify({ type: 'removed', mutation })
  }

  clear(): void {
    notifyManager.batch(() => {
      this.mutations.forEach((mutation) => {
        this.remove(mutation)
      })
    })
  }

  getAll(): Mutation[] {
    return this.mutations
  }

  find<TData = unknown, TError = unknown, TVariables = any, TContext = unknown>(
    filters: MutationFilters,
  ): Mutation<TData, TError, TVariables, TContext> | undefined {
    if (typeof filters.exact === 'undefined') {
      filters.exact = true
    }

    return this.mutations.find((mutation) => matchMutation(filters, mutation))
  }

  findAll(filters: MutationFilters): Mutation[] {
    return this.mutations.filter((mutation) => matchMutation(filters, mutation))
  }

  notify(event: MutationCacheNotifyEvent) {
    notifyManager.batch(() => {
      this.listeners.forEach((listener) => {
        listener(event)
      })
    })
  }

  resumePausedMutations(): Promise<void> {
    const pausedMutations = this.mutations.filter((x) => x.state.isPaused)
    return notifyManager.batch(() =>
      pausedMutations.reduce(
        (promise, mutation) =>
          promise.then(() => mutation.continue().catch(noop)),
        Promise.resolve(),
      ),
    )
  }
}
