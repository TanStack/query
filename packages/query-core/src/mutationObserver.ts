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
  #trackedProps = new Set<keyof MutationObserverResult>()
  #lastTrackedResult?: MutationObserverResult<
    TData,
    TError,
    TVariables,
    TOnMutateResult
  >
  #resultProxyCache = new WeakMap<
    MutationObserverResult<TData, TError, TVariables, TOnMutateResult>, // un-proxied result
    MutationObserverResult<TData, TError, TVariables, TOnMutateResult> // proxied result
  >()

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

  protected onUnsubscribe(): void {
    if (!this.hasListeners()) {
      this.#currentMutation?.removeObserver(this)
    }
  }

  onMutationUpdate(
    action: Action<TData, TError, TVariables, TOnMutateResult>,
  ): void {
    const prevResult = this.#currentResult as
      | MutationObserverResult<TData, TError, TVariables, TOnMutateResult>
      | undefined

    this.#updateResult()

    const shouldNotifyListeners = (): boolean => {
      if (!prevResult) {
        return true
      }

      const { notifyOnChangeProps } = this.options
      const notifyOnChangePropsValue =
        typeof notifyOnChangeProps === 'function'
          ? notifyOnChangeProps()
          : notifyOnChangeProps

      if (
        notifyOnChangePropsValue === 'all' ||
        (!notifyOnChangePropsValue && !this.#trackedProps.size)
      ) {
        return true
      }

      const includedProps = new Set(
        notifyOnChangePropsValue ?? this.#trackedProps,
      )

      if (this.options.throwOnError) {
        includedProps.add('error')
      }

      return Object.keys(this.#currentResult).some((key) => {
        const typedKey = key as keyof MutationObserverResult
        const changed = this.#currentResult[typedKey] !== prevResult[typedKey]

        return changed && includedProps.has(typedKey)
      })
    }

    this.#notify(action, { listeners: shouldNotifyListeners() })
  }

  getCurrentResult(): MutationObserverResult<
    TData,
    TError,
    TVariables,
    TOnMutateResult
  > {
    return this.#currentResult
  }

  trackResult(
    nextResult: MutationObserverResult<
      TData,
      TError,
      TVariables,
      TOnMutateResult
    >,
    onPropTracked?: (key: keyof MutationObserverResult) => void,
  ): MutationObserverResult<TData, TError, TVariables, TOnMutateResult> {
    let resultProxy = this.#resultProxyCache.get(nextResult)

    if (resultProxy) {
      return resultProxy
    }

    if (this.#lastTrackedResult) {
      if (shallowEqualObjects(this.#lastTrackedResult, nextResult)) {
        resultProxy = this.#resultProxyCache.get(this.#lastTrackedResult)
      }
    }

    if (!resultProxy) {
      resultProxy = new Proxy(nextResult, {
        get: (target, key) => {
          this.trackProp(key as keyof MutationObserverResult)
          onPropTracked?.(key as keyof MutationObserverResult)
          return Reflect.get(target, key)
        },
      })
    }

    this.#resultProxyCache.set(nextResult, resultProxy)
    this.#lastTrackedResult = nextResult

    return resultProxy
  }

  trackProp(key: keyof MutationObserverResult) {
    this.#trackedProps.add(key)
  }

  reset(): void {
    // reset needs to remove the observer from the mutation because there is no way to "get it back"
    // another mutate call will yield a new mutation!
    this.#currentMutation?.removeObserver(this)
    this.#currentMutation = undefined
    this.#updateResult()
    this.#notify(undefined, { listeners: true })
  }

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
    const prevResult = this.#currentResult as
      | MutationObserverResult<TData, TError, TVariables, TOnMutateResult>
      | undefined

    const state =
      this.#currentMutation?.state ??
      getDefaultState<TData, TError, TVariables, TOnMutateResult>()

    const nextResult = {
      ...state,
      isPending: state.status === 'pending',
      isSuccess: state.status === 'success',
      isError: state.status === 'error',
      isIdle: state.status === 'idle',
      mutate: this.mutate,
      reset: this.reset,
    } as MutationObserverResult<TData, TError, TVariables, TOnMutateResult>

    if (shallowEqualObjects(nextResult, prevResult)) {
      return
    }

    this.#currentResult = nextResult
  }

  #notify(
    action?: Action<TData, TError, TVariables, TOnMutateResult>,
    notifyOptions?: { listeners?: boolean },
  ): void {
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
      if (notifyOptions?.listeners) {
        this.listeners.forEach((listener) => {
          listener(this.#currentResult)
        })
      }
    })
  }
}
