import type { CancelOptions, DefaultError, NetworkMode } from './types';
interface RetryerConfig<TData = unknown, TError = DefaultError> {
    fn: () => TData | Promise<TData>;
    initialPromise?: Promise<TData>;
    abort?: () => void;
    onError?: (error: TError) => void;
    onSuccess?: (data: TData) => void;
    onFail?: (failureCount: number, error: TError) => void;
    onPause?: () => void;
    onContinue?: () => void;
    retry?: RetryValue<TError>;
    retryDelay?: RetryDelayValue<TError>;
    networkMode: NetworkMode | undefined;
    canRun: () => boolean;
}
export interface Retryer<TData = unknown> {
    promise: Promise<TData>;
    cancel: (cancelOptions?: CancelOptions) => void;
    continue: () => Promise<unknown>;
    cancelRetry: () => void;
    continueRetry: () => void;
    canStart: () => boolean;
    start: () => Promise<TData>;
}
export type RetryValue<TError> = boolean | number | ShouldRetryFunction<TError>;
type ShouldRetryFunction<TError = DefaultError> = (failureCount: number, error: TError) => boolean;
export type RetryDelayValue<TError> = number | RetryDelayFunction<TError>;
type RetryDelayFunction<TError = DefaultError> = (failureCount: number, error: TError) => number;
export declare function canFetch(networkMode: NetworkMode | undefined): boolean;
export declare class CancelledError extends Error {
    revert?: boolean;
    silent?: boolean;
    constructor(options?: CancelOptions);
}
export declare function isCancelledError(value: any): value is CancelledError;
export declare function createRetryer<TData = unknown, TError = DefaultError>(config: RetryerConfig<TData, TError>): Retryer<TData>;
export {};
//# sourceMappingURL=retryer.d.ts.map