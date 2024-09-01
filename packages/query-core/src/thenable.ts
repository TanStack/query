/**
 * Thenable types which matches React's types for promises
 * @see https://github.com/facebook/react/blob/main/packages/shared/ReactTypes.js#L112-L138
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
