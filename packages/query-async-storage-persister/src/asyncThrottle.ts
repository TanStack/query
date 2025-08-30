import { noop } from './utils'

interface AsyncThrottleOptions {
  interval?: number
  onError?: (error: unknown) => void
}

export function asyncThrottle<TArgs extends ReadonlyArray<unknown>>(
  func: (...args: TArgs) => Promise<void>,
  { interval = 1000, onError = noop }: AsyncThrottleOptions = {},
) {
  if (typeof func !== 'function') throw new Error('argument is not function.')

  let nextExecutionTime = 0
  let lastArgs = null
  let isExecuting = false
  let isScheduled = false

  return async (...args: TArgs) => {
    lastArgs = args
    if (isScheduled) return
    isScheduled = true
    while (isExecuting) {
      await new Promise((done) => setTimeout(done, interval))
    }
    while (Date.now() < nextExecutionTime) {
      await new Promise((done) =>
        setTimeout(done, nextExecutionTime - Date.now()),
      )
    }
    isScheduled = false
    isExecuting = true
    try {
      await func(...lastArgs)
    } catch (error) {
      try {
        onError(error)
      } catch {}
    }
    nextExecutionTime = Date.now() + interval
    isExecuting = false
  }
}
