import { getDefaultState, Mutation } from './mutation'
import { notifyManager } from './notifyManager'
import type { QueryClient } from './queryClient'
import { Subscribable } from './subscribable'
import type {
  MutateOptions,
  MutationObserverResult,
  MutationObserverOptions,
} from './types'
import { getStatusProps } from './utils'

// TYPES

type MutationObserverListener<TData, TError, TVariables, TContext> = (
  result: MutationObserverResult<TData, TError, TVariables, TContext>
) => void

// CLASS

export class MutationObserver<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown
> extends Subscribable<
  MutationObserverListener<TData, TError, TVariables, TContext>
> {
  options!: MutationObserverOptions<TData, TError, TVariables, TContext>

  private client: QueryClient
  private currentResult!: MutationObserverResult<
    TData,
    TError,
    TVariables,
    TContext
  >
  private currentMutation?: Mutation<TData, TError, TVariables, TContext>

  constructor(
    client: QueryClient,
    options: MutationObserverOptions<TData, TError, TVariables, TContext>
  ) {
    super()

    this.client = client
    this.setOptions(options)
    this.bindMethods()
    this.updateResult()
  }

  protected bindMethods(): void {
    this.mutate = this.mutate.bind(this)
    this.reset = this.reset.bind(this)
  }

  setOptions(
    options?: MutationObserverOptions<TData, TError, TVariables, TContext>
  ) {
    this.options = this.client.defaultMutationOptions(options)
  }

  protected onUnsubscribe(): void {
    if (!this.listeners.length) {
      this.currentMutation?.removeObserver(this)
    }
  }

  onMutationUpdate(): void {
    this.updateResult()
    this.notify()
  }

  getCurrentResult(): MutationObserverResult<
    TData,
    TError,
    TVariables,
    TContext
  > {
    return this.currentResult
  }

  reset(): void {
    this.currentMutation = undefined
    this.updateResult()
    this.notify()
  }

  mutate(
    variables?: TVariables,
    options?: MutateOptions<TData, TError, TVariables, TContext>
  ): Promise<TData> {
    if (this.currentMutation) {
      this.currentMutation.removeObserver(this)
    }

    this.currentMutation = this.client.getMutationCache().build(this.client, {
      ...this.options,
      ...options,
      variables: variables ?? this.options.variables,
    })

    this.currentMutation.addObserver(this)

    return this.currentMutation.execute()
  }

  private updateResult(): void {
    const state = this.currentMutation
      ? this.currentMutation.state
      : getDefaultState<TData, TError, TVariables, TContext>()

    this.currentResult = {
      ...state,
      ...getStatusProps(state.status),
      mutate: this.mutate,
      reset: this.reset,
    }
  }

  private notify() {
    notifyManager.batch(() => {
      this.listeners.forEach(listener => {
        listener(this.currentResult)
      })
    })
  }
}
