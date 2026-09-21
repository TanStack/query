import { notifyManager } from './notifyManager'
import { Removable } from './removable'
import { createRetryer } from './retryer'
import type {
  DefaultError,
  MutationFunctionContext,
  MutationMeta,
  MutationOptions,
  MutationStatus,
} from './types'
import type { MutationCache } from './mutationCache'
import type { MutationObserver } from './mutationObserver'
import type { Retryer } from './retryer'
import type { QueryClient } from './queryClient'

// TYPES

interface MutationConfig<TData, TError, TVariables, TOnMutateResult> {
  client: QueryClient
  mutationId: number
  mutationCache: MutationCache
  options: MutationOptions<TData, TError, TVariables, TOnMutateResult>
  state?: MutationState<TData, TError, TVariables, TOnMutateResult>
}

/**
 * The raw state stored on a `Mutation` instance. This is the underlying state
 * that observer results (e.g. `MutationObserverResult`) are derived from.
 */
export interface MutationState<
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TOnMutateResult = unknown,
> {
  /**
   * The value returned by `onMutate`, if defined. Passed to `onSuccess`,
   * `onError` and `onSettled` as the mutation's context.
   */
  context: TOnMutateResult | undefined
  /**
   * The last successfully resolved data for the mutation.
   */
  data: TData | undefined
  /**
   * The error object for the mutation, if the last attempt resulted in an error.
   * - Defaults to `null`.
   */
  error: TError | null
  /**
   * The number of times the mutation function has failed for the current attempt.
   */
  failureCount: number
  /**
   * The reason the current attempt failed, as reported by the retryer.
   */
  failureReason: TError | null
  /**
   * Whether the mutation is currently paused (see network mode), or is
   * waiting for another mutation with the same `scope` to finish.
   */
  isPaused: boolean
  /**
   * The status of the mutation.
   */
  status: MutationStatus
  /**
   * The variables the mutation was last called with.
   */
  variables: TVariables | undefined
  /**
   * The timestamp for when the mutation was submitted.
   */
  submittedAt: number
}

interface FailedAction<TError> {
  type: 'failed'
  failureCount: number
  error: TError | null
}

interface PendingAction<TVariables, TOnMutateResult> {
  type: 'pending'
  isPaused: boolean
  variables?: TVariables
  context?: TOnMutateResult
}

interface SuccessAction<TData> {
  type: 'success'
  data: TData
}

interface ErrorAction<TError> {
  type: 'error'
  error: TError
}

interface PauseAction {
  type: 'pause'
}

interface ContinueAction {
  type: 'continue'
}

export type Action<TData, TError, TVariables, TOnMutateResult> =
  | ContinueAction
  | ErrorAction<TError>
  | FailedAction<TError>
  | PendingAction<TVariables, TOnMutateResult>
  | PauseAction
  | SuccessAction<TData>

// CLASS

/**
 * Represents a single mutation attempt. A `Mutation` holds the mutation's
 * options, state (data/error/status), and the `MutationObserver`s currently
 * subscribed to it.
 *
 * Instances are created and managed internally by `MutationCache`; application
 * code typically interacts with mutations indirectly through `QueryClient` or
 * a framework hook like `useMutation`. Direct access to a `Mutation` instance
 * is possible via `mutationCache.find()`/`getAll()` for inspecting cache state.
 *
 * @example
 * ```ts
 * const mutationCache = queryClient.getMutationCache()
 *
 * const mutation = mutationCache.find({ mutationKey: ['addPost'] })
 * ```
 */
export class Mutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TOnMutateResult = unknown,
> extends Removable {
  state: MutationState<TData, TError, TVariables, TOnMutateResult>
  options!: MutationOptions<TData, TError, TVariables, TOnMutateResult>
  readonly mutationId: number

  #client: QueryClient
  #observers: Array<
    MutationObserver<TData, TError, TVariables, TOnMutateResult>
  >
  #mutationCache: MutationCache
  #retryer?: Retryer<TData>

  constructor(
    config: MutationConfig<TData, TError, TVariables, TOnMutateResult>,
  ) {
    super()

    this.#client = config.client
    this.mutationId = config.mutationId
    this.#mutationCache = config.mutationCache
    this.#observers = []
    this.state = config.state || getDefaultState()

    this.setOptions(config.options)
    this.scheduleGc()
  }

  /** @internal */
  setOptions(
    options: MutationOptions<TData, TError, TVariables, TOnMutateResult>,
  ): void {
    this.options = options

    this.updateGcTime(this.options.gcTime)
  }

  /**
   * The `meta` object passed in the mutation's options, if any.
   */
  get meta(): MutationMeta | undefined {
    return this.options.meta
  }

  /** @internal */
  addObserver(observer: MutationObserver<any, any, any, any>): void {
    if (!this.#observers.includes(observer)) {
      this.#observers.push(observer)

      // Stop the mutation from being garbage collected
      this.clearGcTimeout()

      this.#mutationCache.notify({
        type: 'observerAdded',
        mutation: this,
        observer,
      })
    }
  }

  /** @internal */
  removeObserver(observer: MutationObserver<any, any, any, any>): void {
    this.#observers = this.#observers.filter((x) => x !== observer)

    this.scheduleGc()

    this.#mutationCache.notify({
      type: 'observerRemoved',
      mutation: this,
      observer,
    })
  }

  protected optionalRemove() {
    if (!this.#observers.length) {
      if (this.state.status === 'pending') {
        this.scheduleGc()
      } else {
        this.#mutationCache.remove(this)
      }
    }
  }

  /**
   * Resumes a mutation that is currently paused or was restored from a
   * dehydrated, still-`pending` state.
   *
   * - If this mutation has an active retryer (it paused mid-attempt, e.g. due
   *   to the network mode or scope-based queuing), its retryer is resumed.
   * - Otherwise, if the mutation's status is still `pending` (e.g. it was
   *   dehydrated while an attempt was in flight and never got a retryer in
   *   this instance), `execute` is called again with the last known variables.
   * - Otherwise the mutation has already settled and this resolves immediately
   *   without running anything again.
   *
   * @example
   * ```ts
   * // typically driven by reconnect handling, e.g. queryClient.resumePausedMutations()
   * const mutation = mutationCache.find({ mutationKey: ['addPost'] })
   * await mutation?.continue()
   * ```
   *
   * @see {@link Mutation#execute}
   */
  continue(): Promise<unknown> {
    return (
      this.#retryer?.continue() ??
      // continuing a mutation assumes that variables are set, mutation must have been dehydrated before.
      // a settled mutation has no retryer to continue and must not run again
      (this.state.status === 'pending'
        ? this.execute(this.state.variables!)
        : Promise.resolve())
    )
  }

  /**
   * Runs the mutation function for the given variables through a retryer, and
   * drives the mutation's state and lifecycle callbacks through to settlement.
   *
   * If this mutation's state is already `pending` when `execute` is called
   * (i.e. it was restored, still in-flight, from a dehydrated state), the
   * `onMutate` step is skipped and a `continue` action is dispatched to
   * unpause it; otherwise a `pending` action is dispatched first, then the
   * mutation cache's `onMutate` and the mutation's own `onMutate` option are
   * awaited in that order, and the resulting context is stored.
   *
   * The mutation function is then run (subject to `retry`/`retryDelay`/
   * `networkMode`, and to the mutation cache's scope-based serialization).
   * On success, the cache's `onSuccess`/`onSettled` callbacks run before the
   * mutation's own `onSuccess`/`onSettled` options, a `success` action is
   * dispatched, and the resolved data is returned. On failure, the same
   * cache-then-option ordering is used for `onError`/`onSettled`, but each of
   * those four callbacks is individually caught so that a throwing callback
   * cannot mask the original error; an `error` action is then dispatched and
   * the original error is re-thrown.
   *
   * @example
   * ```ts
   * // Called internally by `MutationObserver.mutate` and `Mutation.continue` —
   * // applications normally trigger mutations through those, not this method.
   * const data = await mutation.execute(variables)
   * ```
   *
   * @see {@link Mutation#continue}
   */
  async execute(variables: TVariables): Promise<TData> {
    const onContinue = () => {
      this.#dispatch({ type: 'continue' })
    }

    const mutationFnContext = {
      client: this.#client,
      meta: this.options.meta,
      mutationKey: this.options.mutationKey,
    } satisfies MutationFunctionContext

    const retryer = (this.#retryer = createRetryer({
      fn: () => {
        if (!this.options.mutationFn) {
          return Promise.reject(new Error('No mutationFn found'))
        }

        return this.options.mutationFn(variables, mutationFnContext)
      },
      onFail: (failureCount, error) => {
        this.#dispatch({ type: 'failed', failureCount, error })
      },
      onPause: () => {
        this.#dispatch({ type: 'pause' })
      },
      onContinue,
      retry: this.options.retry ?? 0,
      retryDelay: this.options.retryDelay,
      networkMode: this.options.networkMode,
      canRun: () => this.#mutationCache.canRun(this),
    }))

    const restored = this.state.status === 'pending'
    const isPaused = !retryer.canStart()

    try {
      if (restored) {
        // Dispatch continue action to unpause restored mutation
        onContinue()
      } else {
        this.#dispatch({ type: 'pending', variables, isPaused })
        // Notify cache callback
        if (this.#mutationCache.config.onMutate) {
          await this.#mutationCache.config.onMutate(
            variables,
            this as Mutation<unknown, unknown, unknown, unknown>,
            mutationFnContext,
          )
        }
        const context = await this.options.onMutate?.(
          variables,
          mutationFnContext,
        )
        if (context !== this.state.context) {
          this.#dispatch({
            type: 'pending',
            context,
            variables,
            isPaused,
          })
        }
      }
      const data = await retryer.start()

      // Notify cache callback
      await this.#mutationCache.config.onSuccess?.(
        data,
        variables,
        this.state.context,
        this as Mutation<unknown, unknown, unknown, unknown>,
        mutationFnContext,
      )

      await this.options.onSuccess?.(
        data,
        variables,
        this.state.context!,
        mutationFnContext,
      )

      // Notify cache callback
      await this.#mutationCache.config.onSettled?.(
        data,
        null,
        this.state.variables,
        this.state.context,
        this as Mutation<unknown, unknown, unknown, unknown>,
        mutationFnContext,
      )

      await this.options.onSettled?.(
        data,
        null,
        variables,
        this.state.context,
        mutationFnContext,
      )

      this.#dispatch({ type: 'success', data })
      return data
    } catch (error) {
      try {
        // Notify cache callback
        await this.#mutationCache.config.onError?.(
          error as any,
          variables,
          this.state.context,
          this as Mutation<unknown, unknown, unknown, unknown>,
          mutationFnContext,
        )
      } catch (e) {
        void Promise.reject(e)
      }

      try {
        await this.options.onError?.(
          error as TError,
          variables,
          this.state.context,
          mutationFnContext,
        )
      } catch (e) {
        void Promise.reject(e)
      }

      try {
        // Notify cache callback
        await this.#mutationCache.config.onSettled?.(
          undefined,
          error as any,
          this.state.variables,
          this.state.context,
          this as Mutation<unknown, unknown, unknown, unknown>,
          mutationFnContext,
        )
      } catch (e) {
        void Promise.reject(e)
      }

      try {
        await this.options.onSettled?.(
          undefined,
          error as TError,
          variables,
          this.state.context,
          mutationFnContext,
        )
      } catch (e) {
        void Promise.reject(e)
      }

      this.#dispatch({ type: 'error', error: error as TError })
      throw error
    } finally {
      // The settled retryer's promise would otherwise pin this mutation's
      // result, variables and context for as long as the cache keeps it
      if (this.#retryer === retryer) {
        this.#retryer = undefined
      }
      this.#mutationCache.runNext(this)
    }
  }

  #dispatch(action: Action<TData, TError, TVariables, TOnMutateResult>): void {
    const reducer = (
      state: MutationState<TData, TError, TVariables, TOnMutateResult>,
    ): MutationState<TData, TError, TVariables, TOnMutateResult> => {
      switch (action.type) {
        case 'failed':
          return {
            ...state,
            failureCount: action.failureCount,
            failureReason: action.error,
          }
        case 'pause':
          return {
            ...state,
            isPaused: true,
          }
        case 'continue':
          return {
            ...state,
            isPaused: false,
          }
        case 'pending':
          return {
            ...state,
            context: action.context,
            data: undefined,
            failureCount: 0,
            failureReason: null,
            error: null,
            isPaused: action.isPaused,
            status: 'pending',
            variables: action.variables,
            submittedAt: Date.now(),
          }
        case 'success':
          return {
            ...state,
            data: action.data,
            failureCount: 0,
            failureReason: null,
            error: null,
            status: 'success',
            isPaused: false,
          }
        case 'error':
          return {
            ...state,
            data: undefined,
            error: action.error,
            failureCount: state.failureCount + 1,
            failureReason: action.error,
            isPaused: false,
            status: 'error',
          }
      }
    }
    this.state = reducer(this.state)

    notifyManager.batch(() => {
      this.#observers.forEach((observer) => {
        observer.onMutationUpdate(action)
      })
      this.#mutationCache.notify({
        mutation: this,
        type: 'updated',
        action,
      })
    })
  }
}

export function getDefaultState<
  TData,
  TError,
  TVariables,
  TOnMutateResult,
>(): MutationState<TData, TError, TVariables, TOnMutateResult> {
  return {
    context: undefined,
    data: undefined,
    error: null,
    failureCount: 0,
    failureReason: null,
    isPaused: false,
    status: 'idle',
    variables: undefined,
    submittedAt: 0,
  }
}
