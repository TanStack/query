import type { MutationObserver } from './mutationObserver'
import type { MutationOptions, NotifyEvent } from './types'
import type { QueryClient } from './queryClient'
import { notifyManager } from './notifyManager'
import type { Action, MutationState } from './mutation'
import { Mutation } from './mutation'
import type { MutationFilters } from './utils'
import { matchMutation, noop } from './utils'
import { Subscribable } from './subscribable'

// TYPES

interface MutationCacheConfig {
  onError?: (
    error: unknown,
    variables: unknown,
    context: unknown,
    mutation: Mutation<unknown, unknown, unknown>,
  ) => Promise<unknown> | unknown
  onSuccess?: (
    data: unknown,
    variables: unknown,
    context: unknown,
    mutation: Mutation<unknown, unknown, unknown>,
  ) => Promise<unknown> | unknown
  onMutate?: (
    variables: unknown,
    mutation: Mutation<unknown, unknown, unknown, unknown>,
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

type MutationCacheNotifyEvent =
  | NotifyEventMutationAdded
  | NotifyEventMutationRemoved
  | NotifyEventMutationObserverAdded
  | NotifyEventMutationObserverRemoved
  | NotifyEventMutationObserverOptionsUpdated
  | NotifyEventMutationUpdated

type MutationCacheListener = (event: MutationCacheNotifyEvent) => void

// CLASS

export class MutationCache extends Subscribable<MutationCacheListener> {
  config: MutationCacheConfig

  private mutations: Mutation<any, any, any, any>[]
  private mutationId: number
  private resuming: Promise<unknown> | undefined

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

  resumePausedMutations(): Promise<unknown> {
    this.resuming = (this.resuming ?? Promise.resolve())
      .then(() => {
        const pausedMutations = this.mutations.filter((x) => x.state.isPaused)
        return notifyManager.batch(() =>
          pausedMutations.reduce(
            (promise, mutation) =>
              promise.then(() => mutation.continue().catch(noop)),
            Promise.resolve() as Promise<unknown>,
          ),
        )
      })
      .then(() => {
        this.resuming = undefined
      })

    return this.resuming
  }
}
