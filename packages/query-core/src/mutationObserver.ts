import { getDefaultState } from './mutation'
import { notifyManager } from './notifyManager'
import { Subscribable } from './subscribable'
import { shallowEqualObjects } from './utils'
import type { QueryClient } from './queryClient'
import type {
  DefaultError,
  MutateOptions,
  MutationObserverOptions,
  MutationObserverResult,
} from './types'
import type { Action, Mutation } from './mutation'

// TYPES

type MutationObserverListener<TData, TError, TVariables, TContext> = (
  result: MutationObserverResult<TData, TError, TVariables, TContext>,
) => void

// CLASS

export class MutationObserver<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
> extends Subscribable<
  MutationObserverListener<TData, TError, TVariables, TContext>
> {
  options!: MutationObserverOptions<TData, TError, TVariables, TContext>

  #client: QueryClient
  #currentResult: MutationObserverResult<TData, TError, TVariables, TContext> =
    undefined!
  #currentMutation?: Mutation<TData, TError, TVariables, TContext>
  #mutateOptions?: MutateOptions<TData, TError, TVariables, TContext>

  constructor(
    client: QueryClient,
    options: MutationObserverOptions<TData, TError, TVariables, TContext>,
  ) {
    super()

    this.#client = client
    this.setOptions(options)
    this.bindMethods()
    this.#updateResult()
  }

  protected bindMethods(): void {
    this.mutate = this.mutate.bind(this)
    this.reset = this.reset.bind(this)
  }

  setOptions(
    options?: MutationObserverOptions<TData, TError, TVariables, TContext>,
  ) {
    const prevOptions = this.options
    this.options = this.#client.defaultMutationOptions(options)
    if (!shallowEqualObjects(prevOptions, this.options)) {
      this.#client.getMutationCache().notify({
        type: 'observerOptionsUpdated',
        mutation: this.#currentMutation,
        observer: this,
      })
    }
    this.#currentMutation?.setOptions(this.options)
  }

  protected onUnsubscribe(): void {
    if (!this.hasListeners()) {
      this.#currentMutation?.removeObserver(this)
    }
  }

  onMutationUpdate(action: Action<TData, TError, TVariables, TContext>): void {
    this.#updateResult()

    this.#notify(action)
  }

  getCurrentResult(): MutationObserverResult<
    TData,
    TError,
    TVariables,
    TContext
  > {
    return this.#currentResult
  }

  reset(): void {
    this.#currentMutation = undefined
    this.#updateResult()
    this.#notify()
  }

  mutate(
    variables: TVariables,
    options?: MutateOptions<TData, TError, TVariables, TContext>,
  ): Promise<TData> {
    this.#mutateOptions = options

    this.#currentMutation?.removeObserver(this)

    this.#currentMutation = this.#client
      .getMutationCache()
      .build(this.#client, this.options)

    this.#currentMutation.addObserver(this)

    return this.#currentMutation.execute(variables)
  }

  #updateResult(): void {
    const state =
      this.#currentMutation?.state ??
      getDefaultState<TData, TError, TVariables, TContext>()

    this.#currentResult = {
      ...state,
      isPending: state.status === 'pending',
      isSuccess: state.status === 'success',
      isError: state.status === 'error',
      isIdle: state.status === 'idle',
      mutate: this.mutate,
      reset: this.reset,
    } as MutationObserverResult<TData, TError, TVariables, TContext>
  }

  #notify(action?: Action<TData, TError, TVariables, TContext>): void {
    notifyManager.batch(() => {
      // First trigger the mutate callbacks
      if (this.#mutateOptions && this.hasListeners()) {
        if (action?.type === 'success') {
          this.#mutateOptions.onSuccess?.(
            action.data,
            this.#currentResult.variables!,
            this.#currentResult.context!,
          )
          this.#mutateOptions.onSettled?.(
            action.data,
            null,
            this.#currentResult.variables!,
            this.#currentResult.context,
          )
        } else if (action?.type === 'error') {
          this.#mutateOptions.onError?.(
            action.error,
            this.#currentResult.variables!,
            this.#currentResult.context,
          )
          this.#mutateOptions.onSettled?.(
            undefined,
            action.error,
            this.#currentResult.variables!,
            this.#currentResult.context,
          )
        }
      }

      // Then trigger the listeners
      this.listeners.forEach((listener) => {
        listener(this.#currentResult)
      })
    })
  }
}
