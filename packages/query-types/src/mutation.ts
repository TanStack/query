import type { MutationCacheOf, QueryClientOf, RuntimeBinding } from './binding'
import type { DefaultError, MutationOptions, MutationStatus } from './types'

interface MutationConfig<
  TRuntime extends RuntimeBinding,
  TData,
  TError,
  TVariables,
  TOnMutateResult,
> {
  client: QueryClientOf<TRuntime>
  mutationId: number
  mutationCache: MutationCacheOf<TRuntime>
  options: MutationOptions<TRuntime, TData, TError, TVariables, TOnMutateResult>
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

interface MutationFailedAction<TError> {
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

interface MutationSuccessAction<TData> {
  type: 'success'
  data: TData
}

interface MutationErrorAction<TError> {
  type: 'error'
  error: TError
}

interface MutationPauseAction {
  type: 'pause'
}

interface MutationContinueAction {
  type: 'continue'
}

/**
 * The actions a mutation dispatches to update its state, e.g. when it starts, fails, pauses, or
 * succeeds.
 */
export type MutationAction<TData, TError, TVariables, TOnMutateResult> =
  | MutationContinueAction
  | MutationErrorAction<TError>
  | MutationFailedAction<TError>
  | PendingAction<TVariables, TOnMutateResult>
  | MutationPauseAction
  | MutationSuccessAction<TData>

export type {
  MutationConfig,
  MutationFailedAction,
  PendingAction,
  MutationSuccessAction,
  MutationErrorAction,
  MutationPauseAction,
  MutationContinueAction,
}
