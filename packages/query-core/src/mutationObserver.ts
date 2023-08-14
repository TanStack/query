import { getDefaultState } from './mutation'
import { notifyManager } from './notifyManager'
import { Subscribable } from './subscribable'
import { shallowEqualObjects } from './utils'
import type { QueryClient } from './queryClient'
import type {
  MutateOptions,
  MutationObserverBaseResult,
  MutationObserverOptions,
  MutationObserverResult,
} from './types'
import type { Action, Mutation } from './mutation'

// TYPES

type MutationObserverListener<TData, TError, TVariables, TContext> = (
  result: MutationObserverResult<TData, TError, TVariables, TContext>,
) => void

interface NotifyOptions {
  listeners?: boolean
  onError?: boolean
  onSuccess?: boolean
}

// CLASS

export class MutationObserver<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
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
  private mutateOptions?: MutateOptions<TData, TError, TVariables, TContext>

  constructor(
    client: QueryClient,
    options: MutationObserverOptions<TData, TError, TVariables, TContext>,
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
    options?: MutationObserverOptions<TData, TError, TVariables, TContext>,
  ) {
    const prevOptions = this.options
    this.options = this.client.defaultMutationOptions(options)
    if (!shallowEqualObjects(prevOptions, this.options)) {
      this.client.getMutationCache().notify({
        type: 'observerOptionsUpdated',
        mutation: this.currentMutation,
        observer: this,
      })
    }
    this.currentMutation?.setOptions(this.options)
  }

  protected onUnsubscribe(): void {
    if (!this.hasListeners()) {
      this.currentMutation?.removeObserver(this)
    }
  }

  onMutationUpdate(action: Action<TData, TError, TVariables, TContext>): void {
    this.updateResult()

    // Determine which callbacks to trigger
    const notifyOptions: NotifyOptions = {
      listeners: true,
    }

    if (action.type === 'success') {
      notifyOptions.onSuccess = true
    } else if (action.type === 'error') {
      notifyOptions.onError = true
    }

    this.notify(notifyOptions)
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
    this.notify({ listeners: true })
  }

  mutate(
    variables?: TVariables,
    options?: MutateOptions<TData, TError, TVariables, TContext>,
  ): Promise<TData> {
    this.mutateOptions = options

    if (this.currentMutation) {
      this.currentMutation.removeObserver(this)
    }

    this.currentMutation = this.client.getMutationCache().build(this.client, {
      ...this.options,
      variables:
        typeof variables !== 'undefined' ? variables : this.options.variables,
    })

    this.currentMutation.addObserver(this)

    return this.currentMutation.execute()
  }

  private updateResult(): void {
    const state = this.currentMutation
      ? this.currentMutation.state
      : getDefaultState<TData, TError, TVariables, TContext>()

    const result: MutationObserverBaseResult<
      TData,
      TError,
      TVariables,
      TContext
    > = {
      ...state,
      isLoading: state.status === 'loading',
      isSuccess: state.status === 'success',
      isError: state.status === 'error',
      isIdle: state.status === 'idle',
      mutate: this.mutate,
      reset: this.reset,
    }

    this.currentResult = result as MutationObserverResult<
      TData,
      TError,
      TVariables,
      TContext
    >
  }

  private notify(options: NotifyOptions) {
    notifyManager.batch(() => {
      // First trigger the mutate callbacks
      if (this.mutateOptions && this.hasListeners()) {
        if (options.onSuccess) {
          this.mutateOptions.onSuccess?.(
            this.currentResult.data!,
            this.currentResult.variables!,
            this.currentResult.context!,
          )
          this.mutateOptions.onSettled?.(
            this.currentResult.data!,
            null,
            this.currentResult.variables!,
            this.currentResult.context,
          )
        } else if (options.onError) {
          this.mutateOptions.onError?.(
            this.currentResult.error!,
            this.currentResult.variables!,
            this.currentResult.context,
          )
          this.mutateOptions.onSettled?.(
            undefined,
            this.currentResult.error,
            this.currentResult.variables!,
            this.currentResult.context,
          )
        }
      }

      // Then trigger the listeners
      if (options.listeners) {
        this.listeners.forEach(({ listener }) => {
          listener(this.currentResult)
        })
      }
    })
  }
}
