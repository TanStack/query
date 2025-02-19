/**
 * Thenable types which matches React's types for promises
 *
 * React seemingly uses `.status`, `.value` and `.reason` properties on a promises to optimistically unwrap data from promises
 *
 * @see https://github.com/facebook/react/blob/main/packages/shared/ReactTypes.js#L112-L138
 * @see https://github.com/facebook/react/blob/4f604941569d2e8947ce1460a0b2997e835f37b9/packages/react-debug-tools/src/ReactDebugHooks.js#L224-L227
 */
interface Fulfilled<T> {
    status: 'fulfilled';
    value: T;
}
interface Rejected {
    status: 'rejected';
    reason: unknown;
}
interface Pending<T> {
    status: 'pending';
    /**
     * Resolve the promise with a value.
     * Will remove the `resolve` and `reject` properties from the promise.
     */
    resolve: (value: T) => void;
    /**
     * Reject the promise with a reason.
     * Will remove the `resolve` and `reject` properties from the promise.
     */
    reject: (reason: unknown) => void;
}
export type FulfilledThenable<T> = Promise<T> & Fulfilled<T>;
export type RejectedThenable<T> = Promise<T> & Rejected;
export type PendingThenable<T> = Promise<T> & Pending<T>;
export type Thenable<T> = FulfilledThenable<T> | RejectedThenable<T> | PendingThenable<T>;
export declare function pendingThenable<T>(): PendingThenable<T>;
export {};
//# sourceMappingURL=thenable.d.ts.map