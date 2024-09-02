/**
 * Thenable types which matches React's types for promises
 *
 * React seemingly uses `.status`, `.value` and `.reason` properties on a promises to optimistically unwrap data from promises
 *
 * @see https://github.com/facebook/react/blob/main/packages/shared/ReactTypes.js#L112-L138
 * @see https://github.com/facebook/react/blob/4f604941569d2e8947ce1460a0b2997e835f37b9/packages/react-debug-tools/src/ReactDebugHooks.js#L224-L227
 */

export type FulfilledThenable<T> = Promise<T> & {
  status: 'fulfilled'
  value: T
  reason?: never
}
export type RejectedThenable<T> = Promise<T> & {
  status: 'rejected'
  reason: unknown
  value?: never
}
export type PendingThenable<T> = Promise<T> & {
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

  thenable.status = 'pending'
  thenable.resolve = (value) => {
    deletePendingProps()

    Object.assign(thenable, {
      status: 'fulfilled',
      value,
    })

    resolve(value)
  }
  thenable.reject = (reason) => {
    deletePendingProps()

    Object.assign(thenable, {
      status: 'rejected',
      reason,
    })

    reject(reason)
  }
  function deletePendingProps() {
    delete (thenable as Partial<PendingThenable<T>>).resolve
    delete (thenable as Partial<PendingThenable<T>>).reject
  }

  return thenable
}
