import { notifyManager } from './notifyManager'
import { Mutation } from './mutation'
import { matchMutation, noop } from './utils'
import { Subscribable } from './subscribable'
import type { MutationObserver } from './mutationObserver'
import type { DefaultError, MutationOptions, NotifyEvent } from './types'
import type { QueryClient } from './queryClient'
import type { Action, MutationState } from './mutation'
import type { MutationFilters } from './utils'

// TYPES

interface MutationCacheConfig {
  onError?: (
    error: DefaultError,
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
    mutation: Mutation<unknown, unknown, unknown>,
  ) => Promise<unknown> | unknown
  onSettled?: (
    data: unknown | undefined,
    error: DefaultError | null,
    variables: unknown,
    context: unknown,
    mutation: Mutation<unknown, unknown, unknown>,
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

// CLASS

export class MutationCache extends Subscribable<MutationCacheListener> {
  #mutations: Array<Mutation<any, any, any, any>>
  #mutationId: number
  #resuming: Promise<unknown> | undefined

  constructor(public config: MutationCacheConfig = {}) {
    super()
    this.#mutations = []
    this.#mutationId = 0
  }

  build<TData, TError, TVariables, TContext>(
    client: QueryClient,
    options: MutationOptions<TData, TError, TVariables, TContext>,
    state?: MutationState<TData, TError, TVariables, TContext>,
  ): Mutation<TData, TError, TVariables, TContext> {
    const mutation = new Mutation({
      mutationCache: this,
      mutationId: ++this.#mutationId,
      options: client.defaultMutationOptions(options),
      state,
    })

    this.add(mutation)

    return mutation
  }

  add(mutation: Mutation<any, any, any, any>): void {
    this.#mutations.push(mutation)
    this.notify({ type: 'added', mutation })
  }

  remove(mutation: Mutation<any, any, any, any>): void {
    this.#mutations = this.#mutations.filter((x) => x !== mutation)
    this.notify({ type: 'removed', mutation })
  }

  clear(): void {
    notifyManager.batch(() => {
      this.#mutations.forEach((mutation) => {
        this.remove(mutation)
      })
    })
  }

  getAll(): Array<Mutation> {
    return this.#mutations
  }

  find<
    TData = unknown,
    TError = DefaultError,
    TVariables = any,
    TContext = unknown,
  >(
    filters: MutationFilters,
  ): Mutation<TData, TError, TVariables, TContext> | undefined {
    const defaultedFilters = { exact: true, ...filters }

    return this.#mutations.find((mutation) =>
      matchMutation(defaultedFilters, mutation),
    )
  }

  findAll(filters: MutationFilters = {}): Array<Mutation> {
    return this.#mutations.filter((mutation) =>
      matchMutation(filters, mutation),
    )
  }

  notify(event: MutationCacheNotifyEvent) {
    notifyManager.batch(() => {
      this.listeners.forEach((listener) => {
        listener(event)
      })
    })
  }

  resumePausedMutations(): Promise<unknown> {
    this.#resuming = (this.#resuming ?? Promise.resolve())
      .then(() => {
        const pausedMutations = this.#mutations.filter((x) => x.state.isPaused)
        return notifyManager.batch(() =>
          pausedMutations.reduce(
            (promise, mutation) =>
              promise.then(() => mutation.continue().catch(noop)),
            Promise.resolve() as Promise<unknown>,
          ),
        )
      })
      .then(() => {
        this.#resuming = undefined
      })

    return this.#resuming
  }
}
