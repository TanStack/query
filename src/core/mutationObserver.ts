import { getDefaultState, Mutation } from './mutation'
import { notifyManager } from './notifyManager'
import { Subscribable } from './subscribable'
import type { Environment } from './environment'
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

  private environment: Environment
  private currentResult!: MutationObserverResult<
    TData,
    TError,
    TVariables,
    TContext
  >
  private currentMutation?: Mutation<TData, TError, TVariables, TContext>

  constructor(
    environment: Environment,
    options: MutationObserverOptions<TData, TError, TVariables, TContext>
  ) {
    super()
    this.environment = environment
    this.listeners = []
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
    this.options = this.environment.defaultMutationOptions(options)
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

    this.currentMutation = this.environment
      .getMutationCache()
      .build(this.environment, {
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
    const { currentResult } = this
    notifyManager.batch(() => {
      this.listeners.forEach(listener => {
        notifyManager.schedule(() => {
          listener(currentResult)
        })
      })
    })
  }
}
