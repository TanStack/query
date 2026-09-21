import { getDefaultState } from './mutation'
import { notifyManager } from './notifyManager'
import { Subscribable } from './subscribable'
import { hashKey, shallowEqualObjects } from './utils'
import type { QueryClient } from './queryClient'
import type {
  DefaultError,
  MutateOptions,
  MutationFunctionContext,
  MutationObserverOptions,
  MutationObserverResult,
} from './types'
import type { Action, Mutation } from './mutation'

// TYPES

type MutationObserverListener<TData, TError, TVariables, TOnMutateResult> = (
  result: MutationObserverResult<TData, TError, TVariables, TOnMutateResult>,
) => void

// CLASS

/**
 * Observes a single mutation and derives a `MutationObserverResult` from it.
 * A framework hook like `useMutation` creates one `MutationObserver` per hook
 * call, keeps it stable across re-renders, calls `setOptions` when the options
 * passed to the hook change, subscribes to it to re-render on updates, and
 * reads `getCurrentResult()` for the value to return. Calling `mutate()`
 * builds a new underlying `Mutation` in the `MutationCache` and executes it.
 *
 * @example
 * ```ts
 * const observer = new MutationObserver(queryClient, {
 *   mutationFn: (variables: { title: string }) => addPost(variables),
 * })
 * ```
 */
export class MutationObserver<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> extends Subscribable<
  MutationObserverListener<TData, TError, TVariables, TOnMutateResult>
> {
  options!: MutationObserverOptions<TData, TError, TVariables, TOnMutateResult>

  #client: QueryClient
  #currentResult: MutationObserverResult<
    TData,
    TError,
    TVariables,
    TOnMutateResult
  > = undefined!
  #currentMutation?: Mutation<TData, TError, TVariables, TOnMutateResult>
  #mutateOptions?: MutateOptions<TData, TError, TVariables, TOnMutateResult>

  constructor(
    client: QueryClient,
    options: MutationObserverOptions<
      TData,
      TError,
      TVariables,
      TOnMutateResult
    >,
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

  /**
   * Updates the observer's options.
   *
   * If the new `mutationKey` differs from the previous one (and both were
   * defined), the observer is reset, detaching it from the mutation it was
   * observing. Otherwise, if the currently observed mutation is still
   * `pending`, its options are updated in place as well.
   *
   * @example
   * ```ts
   * observer.setOptions({
   *   mutationFn: (variables: { title: string }) => addPost(variables),
   *   onSuccess: (data) => console.log(data),
   * })
   * ```
   */
  setOptions(
    options: MutationObserverOptions<
      TData,
      TError,
      TVariables,
      TOnMutateResult
    >,
  ) {
    const prevOptions = this.options as
      | MutationObserverOptions<TData, TError, TVariables, TOnMutateResult>
      | undefined
    this.options = this.#client.defaultMutationOptions(options)
    if (!shallowEqualObjects(this.options, prevOptions)) {
      this.#client.getMutationCache().notify({
        type: 'observerOptionsUpdated',
        mutation: this.#currentMutation,
        observer: this,
      })
    }

    if (
      prevOptions?.mutationKey &&
      this.options.mutationKey &&
      hashKey(prevOptions.mutationKey) !== hashKey(this.options.mutationKey)
    ) {
      this.reset()
    } else if (this.#currentMutation?.state.status === 'pending') {
      this.#currentMutation.setOptions(this.options)
    }
  }

  protected onSubscribe(): void {
    if (this.listeners.size === 1 && this.#currentMutation) {
      this.#currentMutation.addObserver(this)

      this.#updateResult()
    }
  }

  protected onUnsubscribe(): void {
    if (!this.hasListeners()) {
      this.#currentMutation?.removeObserver(this)
    }
  }

  /** @internal */
  onMutationUpdate(
    action: Action<TData, TError, TVariables, TOnMutateResult>,
  ): void {
    this.#updateResult()

    this.#notify(action)
  }

  /**
   * Returns the observer's current result, derived from the observed
   * mutation's state (or the default, `idle` state if no mutation has been
   * built yet, e.g. before the first `mutate()` call or after `reset()`).
   */
  getCurrentResult(): MutationObserverResult<
    TData,
    TError,
    TVariables,
    TOnMutateResult
  > {
    return this.#currentResult
  }

  /**
   * Detaches the observer from the mutation it is currently observing (if
   * any) and resets the observed result back to its default, `idle` state.
   *
   * This does not cancel an in-flight mutation; the mutation itself keeps
   * running to completion and its own callbacks still fire, but this
   * observer stops reflecting its state and a subsequent `mutate()` call
   * will build a brand new mutation.
   *
   * @example
   * ```ts
   * observer.reset()
   * ```
   *
   * @see {@link MutationObserver#mutate}
   */
  reset(): void {
    // reset needs to remove the observer from the mutation because there is no way to "get it back"
    // another mutate call will yield a new mutation!
    this.#currentMutation?.removeObserver(this)
    this.#currentMutation = undefined
    this.#updateResult()
    this.#notify()
  }

  /**
   * Builds a new `Mutation` in the `MutationCache` using the observer's
   * current options, detaches this observer from any previously observed
   * mutation, attaches it to the new one, and executes it with the given
   * variables.
   *
   * The optional per-call `options` (`onSuccess`/`onError`/`onSettled`) are
   * invoked once the mutation settles, in addition to any callbacks defined
   * on the observer's own options.
   *
   * @example
   * ```ts
   * await observer.mutate(
   *   { title: 'New post' },
   *   { onSuccess: (data) => console.log(data) },
   * )
   * ```
   */
  mutate(
    variables: TVariables,
    options?: MutateOptions<TData, TError, TVariables, TOnMutateResult>,
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
      getDefaultState<TData, TError, TVariables, TOnMutateResult>()

    this.#currentResult = {
      ...state,
      isPending: state.status === 'pending',
      isSuccess: state.status === 'success',
      isError: state.status === 'error',
      isIdle: state.status === 'idle',
      mutate: this.mutate,
      reset: this.reset,
    } as MutationObserverResult<TData, TError, TVariables, TOnMutateResult>
  }

  #notify(action?: Action<TData, TError, TVariables, TOnMutateResult>): void {
    notifyManager.batch(() => {
      // First trigger the mutate callbacks
      if (this.#mutateOptions && this.hasListeners()) {
        const variables = this.#currentResult.variables!
        const onMutateResult = this.#currentResult.context

        const context = {
          client: this.#client,
          meta: this.options.meta,
          mutationKey: this.options.mutationKey,
        } satisfies MutationFunctionContext

        if (action?.type === 'success') {
          try {
            this.#mutateOptions.onSuccess?.(
              action.data,
              variables,
              onMutateResult,
              context,
            )
          } catch (e) {
            void Promise.reject(e)
          }
          try {
            this.#mutateOptions.onSettled?.(
              action.data,
              null,
              variables,
              onMutateResult,
              context,
            )
          } catch (e) {
            void Promise.reject(e)
          }
        } else if (action?.type === 'error') {
          try {
            this.#mutateOptions.onError?.(
              action.error,
              variables,
              onMutateResult,
              context,
            )
          } catch (e) {
            void Promise.reject(e)
          }
          try {
            this.#mutateOptions.onSettled?.(
              undefined,
              action.error,
              variables,
              onMutateResult,
              context,
            )
          } catch (e) {
            void Promise.reject(e)
          }
        }
      }

      // Then trigger the listeners
      this.listeners.forEach((listener) => {
        listener(this.#currentResult)
      })
    })
  }
}
