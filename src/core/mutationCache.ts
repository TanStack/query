import type { MutationOptions } from './types'
import type { QueryClient } from './queryClient'
import { notifyManager } from './notifyManager'
import { Mutation, MutationState } from './mutation'
import { noop } from './utils'
import { Subscribable } from './subscribable'

// TYPES

type MutationCacheListener = (mutation?: Mutation) => void

// CLASS

export class MutationCache extends Subscribable<MutationCacheListener> {
  private mutations: Mutation<any, any, any, any>[]
  private mutationId: number

  constructor() {
    super()
    this.mutations = []
    this.mutationId = 0
  }

  build<TData, TError, TVariables, TContext>(
    client: QueryClient,
    options: MutationOptions<TData, TError, TVariables, TContext>,
    state?: MutationState<TData, TError, TVariables, TContext>
  ): Mutation<TData, TError, TVariables, TContext> {
    const mutation = new Mutation({
      mutationCache: this,
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
    this.notify(mutation)
  }

  remove(mutation: Mutation<any, any, any, any>): void {
    this.mutations = this.mutations.filter(x => x !== mutation)
    mutation.cancel()
    this.notify(mutation)
  }

  clear(): void {
    notifyManager.batch(() => {
      this.mutations.forEach(mutation => {
        this.remove(mutation)
      })
    })
  }

  getAll(): Mutation[] {
    return this.mutations
  }

  notify(mutation?: Mutation<any, any, any, any>) {
    notifyManager.batch(() => {
      this.listeners.forEach(listener => {
        listener(mutation)
      })
    })
  }

  onFocus(): void {
    this.resumePausedMutations()
  }

  onOnline(): void {
    this.resumePausedMutations()
  }

  resumePausedMutations(): Promise<void> {
    const pausedMutations = this.mutations.filter(x => x.state.isPaused)
    return notifyManager.batch(() =>
      pausedMutations.reduce(
        (promise, mutation) =>
          promise.then(() => mutation.continue().catch(noop)),
        Promise.resolve()
      )
    )
  }
}
