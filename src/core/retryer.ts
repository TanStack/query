import { focusManager } from './focusManager'
import { onlineManager } from './onlineManager'
import { sleep } from './utils'

// TYPES

interface RetryerConfig<TData = unknown, TError = unknown> {
  fn: () => TData | Promise<TData>
  onError?: (error: TError) => void
  onSuccess?: (data: TData) => void
  onFail?: (failureCount: number, error: TError) => void
  onPause?: () => void
  onContinue?: () => void
  retry?: RetryValue<TError>
  retryDelay?: RetryDelayValue<TError>
}

export type RetryValue<TError> = boolean | number | ShouldRetryFunction<TError>

type ShouldRetryFunction<TError = unknown> = (
  failureCount: number,
  error: TError
) => boolean

export type RetryDelayValue<TError> = number | RetryDelayFunction<TError>

type RetryDelayFunction<TError = unknown> = (
  failureCount: number,
  error: TError
) => number

function defaultRetryDelay(failureCount: number) {
  return Math.min(1000 * 2 ** failureCount, 30000)
}

interface Cancelable {
  cancel(): void
}

export function isCancelable(value: any): value is Cancelable {
  return typeof value?.cancel === 'function'
}

export interface CancelOptions {
  revert?: boolean
  silent?: boolean
}

export class CancelledError {
  revert?: boolean
  silent?: boolean
  constructor(options?: CancelOptions) {
    this.revert = options?.revert
    this.silent = options?.silent
  }
}

export function isCancelledError(value: any): value is CancelledError {
  return value instanceof CancelledError
}

// CLASS

export class Retryer<TData = unknown, TError = unknown> {
  cancel: (options?: CancelOptions) => void
  cancelRetry: () => void
  continue: () => void
  failureCount: number
  isPaused: boolean
  isResolved: boolean
  isTransportCancelable: boolean
  promise: Promise<TData>

  constructor(config: RetryerConfig<TData, TError>) {
    let cancelRetry = false
    let cancelFn: ((options?: CancelOptions) => void) | undefined
    let continueFn: ((value?: unknown) => void) | undefined
    let promiseResolve: (data: TData) => void
    let promiseReject: (error: TError) => void

    this.cancel = cancelOptions => cancelFn?.(cancelOptions)
    this.cancelRetry = () => {
      cancelRetry = true
    }
    this.continue = () => continueFn?.()
    this.failureCount = 0
    this.isPaused = false
    this.isResolved = false
    this.isTransportCancelable = false
    this.promise = new Promise<TData>((outerResolve, outerReject) => {
      promiseResolve = outerResolve
      promiseReject = outerReject
    })

    const resolve = (value: any) => {
      if (!this.isResolved) {
        this.isResolved = true
        config.onSuccess?.(value)
        continueFn?.()
        promiseResolve(value)
      }
    }

    const reject = (value: any) => {
      if (!this.isResolved) {
        this.isResolved = true
        config.onError?.(value)
        continueFn?.()
        promiseReject(value)
      }
    }

    const pause = () => {
      return new Promise(continueResolve => {
        continueFn = continueResolve
        this.isPaused = true
        config.onPause?.()
      }).then(() => {
        continueFn = undefined
        this.isPaused = false
        config.onContinue?.()
      })
    }

    // Create loop function
    const run = () => {
      // Do nothing if already resolved
      if (this.isResolved) {
        return
      }

      let promiseOrValue: any

      // Execute query
      try {
        promiseOrValue = config.fn()
      } catch (error) {
        promiseOrValue = Promise.reject(error)
      }

      // Create callback to cancel this fetch
      cancelFn = cancelOptions => {
        if (!this.isResolved) {
          reject(new CancelledError(cancelOptions))

          // Cancel transport if supported
          if (isCancelable(promiseOrValue)) {
            try {
              promiseOrValue.cancel()
            } catch {}
          }
        }
      }

      // Check if the transport layer support cancellation
      this.isTransportCancelable = isCancelable(promiseOrValue)

      Promise.resolve(promiseOrValue)
        .then(resolve)
        .catch(error => {
          // Stop if the fetch is already resolved
          if (this.isResolved) {
            return
          }

          // Do we need to retry the request?
          const retry = config.retry ?? 3
          const retryDelay = config.retryDelay ?? defaultRetryDelay
          const delay =
            typeof retryDelay === 'function'
              ? retryDelay(this.failureCount, error)
              : retryDelay
          const shouldRetry =
            retry === true ||
            (typeof retry === 'number' && this.failureCount < retry) ||
            (typeof retry === 'function' && retry(this.failureCount, error))

          if (cancelRetry || !shouldRetry) {
            // We are done if the query does not need to be retried
            reject(error)
            return
          }

          this.failureCount++

          // Notify on fail
          config.onFail?.(this.failureCount, error)

          // Delay
          sleep(delay)
            // Pause if the document is not visible or when the device is offline
            .then(() => {
              if (!focusManager.isFocused() || !onlineManager.isOnline()) {
                return pause()
              }
            })
            .then(() => {
              if (cancelRetry) {
                reject(error)
              } else {
                run()
              }
            })
        })
    }

    // Start loop
    run()
  }
}
