/**
 * Thenable types which matches React's types for promises
 *
 * React seemingly uses `.status`, `.value` and `.reason` properties on a promises to optimistically unwrap data from promises
 *
 * @see https://github.com/facebook/react/blob/main/packages/shared/ReactTypes.js#L112-L138
 * @see https://github.com/facebook/react/blob/4f604941569d2e8947ce1460a0b2997e835f37b9/packages/react-debug-tools/src/ReactDebugHooks.js#L224-L227
 */

interface Fulfilled<T> {
  status: 'fulfilled'
  value: T
  reason?: never
}
interface Rejected {
  status: 'rejected'
  reason: unknown
  value?: never
}
interface Pending<T> {
  status: 'pending'
  value?: never
  reason?: never

  /**
   * Resolve the promise with a value.
   * Will remove the `resolve` and `reject` properties from the promise.
   */
  resolve: (value: T) => void
  /**
   * Reject the promise with a reason.
   * Will remove the `resolve` and `reject` properties from the promise.
   */
  reject: (reason: unknown) => void
}

export type FulfilledThenable<T> = Promise<T> & Fulfilled<T>
export type RejectedThenable<T> = Promise<T> & Rejected
export type PendingThenable<T> = Promise<T> & Pending<T>

export type Thenable<T> =
  | FulfilledThenable<T>
  | RejectedThenable<T>
  | PendingThenable<T>

export function pendingThenable<T>(): PendingThenable<T> {
  let resolve: PendingThenable<T>['resolve']
  let reject: PendingThenable<T>['reject']
  const thenable = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve
    reject = _reject
  }) as PendingThenable<T>

  thenable.catch(() => {
    // prevent unhandled rejection errors
  })

  thenable.status = 'pending'

  function completeThenable(data: Fulfilled<T> | Rejected) {
    Object.assign(thenable, data)

    // clear pending props props to avoid calling them twice
    delete (thenable as Partial<PendingThenable<T>>).resolve
    delete (thenable as Partial<PendingThenable<T>>).reject
  }

  thenable.resolve = (value) => {
    completeThenable({
      status: 'fulfilled',
      value,
    })

    resolve(value)
  }
  thenable.reject = (reason) => {
    completeThenable({
      status: 'rejected',
      reason,
    })

    reject(reason)
  }

  return thenable
}
