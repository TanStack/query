import { notifyManager } from './notifyManager'
import { Mutation } from './mutation'
import { hashKey, matchMutation, noop } from './utils'
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

// CLASS

export class MutationCache extends Subscribable<MutationCacheListener> {
  #mutations: Set<Mutation<any, any, any, any>>
  #scopes: Map<string, Array<Mutation<any, any, any, any>>>
  #byMutationKey: Map<string, Array<Mutation<any, any, any, any>>>
  #mutationId: number

  constructor(public config: MutationCacheConfig = {}) {
    super()
    this.#mutations = new Set()
    this.#scopes = new Map()
    this.#byMutationKey = new Map()
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
    const { mutationKey } = mutation.options
    if (mutationKey) {
      const hash = hashKey(mutationKey)
      const keyed = this.#byMutationKey.get(hash)
      if (keyed) keyed.push(mutation)
      else this.#byMutationKey.set(hash, [mutation])
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
      const { mutationKey } = mutation.options
      if (mutationKey) {
        const hash = hashKey(mutationKey)
        const keyed = this.#byMutationKey.get(hash)
        if (keyed) {
          if (keyed.length > 1) {
            const index = keyed.indexOf(mutation)
            if (index !== -1) keyed.splice(index, 1)
          } else {
            this.#byMutationKey.delete(hash)
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
      this.#byMutationKey.clear()
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

    if (defaultedFilters.exact && defaultedFilters.mutationKey) {
      const candidates = this.#byMutationKey.get(
        hashKey(defaultedFilters.mutationKey),
      )
      if (!candidates) return undefined
      const { mutationKey: _m, ...filtersWithoutKey } = defaultedFilters
      for (const mutation of candidates) {
        if (matchMutation(filtersWithoutKey as MutationFilters, mutation)) {
          return mutation as Mutation<
            TData,
            TError,
            TVariables,
            TOnMutateResult
          >
        }
      }
      return undefined
    }

    for (const mutation of this.#mutations) {
      if (matchMutation(defaultedFilters, mutation)) {
        return mutation as Mutation<TData, TError, TVariables, TOnMutateResult>
      }
    }
    return undefined
  }

  findAll(filters: MutationFilters = {}): Array<Mutation> {
    if (filters.exact && filters.mutationKey) {
      const candidates = this.#byMutationKey.get(hashKey(filters.mutationKey))
      if (!candidates) return []
      const { mutationKey: _m, ...filtersWithoutKey } = filters
      return candidates.filter((m) =>
        matchMutation(filtersWithoutKey as MutationFilters, m),
      )
    }

    const result: Array<Mutation> = []
    for (const mutation of this.#mutations) {
      if (matchMutation(filters, mutation)) {
        result.push(mutation)
      }
    }
    return result
  }

  notify(event: MutationCacheNotifyEvent) {
    notifyManager.batch(() => {
      this.listeners.forEach((listener) => {
        listener(event)
      })
    })
  }

  resumePausedMutations(): Promise<unknown> {
    const pausedMutations: Array<Mutation> = []
    for (const mutation of this.#mutations) {
      if (mutation.state.isPaused) {
        pausedMutations.push(mutation)
      }
    }

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
