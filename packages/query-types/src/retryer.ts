import type { CancelOptions, DefaultError, NetworkMode } from './types'

export interface RetryerConfig<TData = unknown, TError = DefaultError> {
  fn: () => TData | Promise<TData>
  initialPromise?: Promise<TData>
  onCancel?: (error: TError) => void
  onFail?: (failureCount: number, error: TError) => void
  onPause?: () => void
  onContinue?: () => void
  retry?: RetryValue<TError>
  retryDelay?: RetryDelayValue<TError>
  networkMode: NetworkMode | undefined
  canRun: () => boolean
}

/**
 * Runs a function with retries, and can pause, continue, or cancel it. Queries and mutations use
 * one for each fetch or execution.
 */
export interface Retryer<TData = unknown> {
  /**
   * The promise that resolves with the data, or rejects once retries are exhausted or it is
   * cancelled.
   */
  promise: Promise<TData>
  /**
   * Cancels the run, rejecting `promise` with a `CancelledError`.
   */
  cancel: (cancelOptions?: CancelOptions) => void
  /**
   * Resumes a paused run, and returns `promise`.
   */
  continue: () => Promise<unknown>
  /**
   * Stops further retries. The current attempt still finishes.
   */
  cancelRetry: () => void
  /**
   * Allows retries again after `cancelRetry`.
   */
  continueRetry: () => void
  /**
   * Returns whether the run can start now, based on the network mode and `canRun`.
   */
  canStart: () => boolean
  /**
   * Starts the run, or waits until it can start, and returns `promise`.
   */
  start: () => Promise<TData>
  /**
   * Returns whether `promise` is still pending, resolved, or rejected.
   */
  status: () => 'pending' | 'resolved' | 'rejected'
}

export type RetryerStatus = 'pending' | 'resolved' | 'rejected'

/** @inline */
export type RetryValue<TError> = boolean | number | ShouldRetryFunction<TError>

/** @inline */
export type ShouldRetryFunction<TError = DefaultError> = (
  failureCount: number,
  error: TError,
) => boolean

/** @inline */
export type RetryDelayValue<TError> = number | RetryDelayFunction<TError>

/** @inline */
export type RetryDelayFunction<TError = DefaultError> = (
  failureCount: number,
  error: TError,
) => number
