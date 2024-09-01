/**
 * Thenable types which matches React's types for promises
 *
 * React seemingly uses `.status`, `.value` and `.reason` properties on a promises to optimistically unwrap data from promises
 *
 * @see https://github.com/facebook/react/blob/main/packages/shared/ReactTypes.js#L112-L138
 * @see https://github.com/facebook/react/blob/4f604941569d2e8947ce1460a0b2997e835f37b9/packages/react-debug-tools/src/ReactDebugHooks.js#L224-L227
 */

type FulfilledThenable<T> = Promise<T> & { status: 'fulfilled'; value: T }
type RejectedThenable<T> = Promise<T> & { status: 'rejected'; reason: unknown }
type PendingThenable<T> = Promise<T> & { status: 'pending' }

export type Thenable<T> =
  | FulfilledThenable<T>
  | RejectedThenable<T>
  | PendingThenable<T>

export function fulfilledThenable<T>(value: T): FulfilledThenable<T> {
  const thenable = Promise.resolve(value) as FulfilledThenable<T>
  thenable.status = 'fulfilled'
  thenable.value = value
  return thenable
}

export function rejectedThenable<T>(reason: unknown): RejectedThenable<T> {
  const thenable = Promise.reject(reason) as RejectedThenable<T>
  return thenable
}

export function pendingThenable<T>(): PendingThenable<T> {
  const thenable = Promise.resolve() as PendingThenable<T>
  thenable.status = 'pending'
  return thenable
}
