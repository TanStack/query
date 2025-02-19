import { Removable } from './removable';
import type { DefaultError, MutationMeta, MutationOptions, MutationStatus } from './types';
import type { MutationCache } from './mutationCache';
import type { MutationObserver } from './mutationObserver';
interface MutationConfig<TData, TError, TVariables, TContext> {
    mutationId: number;
    mutationCache: MutationCache;
    options: MutationOptions<TData, TError, TVariables, TContext>;
    state?: MutationState<TData, TError, TVariables, TContext>;
}
export interface MutationState<TData = unknown, TError = DefaultError, TVariables = unknown, TContext = unknown> {
    context: TContext | undefined;
    data: TData | undefined;
    error: TError | null;
    failureCount: number;
    failureReason: TError | null;
    isPaused: boolean;
    status: MutationStatus;
    variables: TVariables | undefined;
    submittedAt: number;
}
interface FailedAction<TError> {
    type: 'failed';
    failureCount: number;
    error: TError | null;
}
interface PendingAction<TVariables, TContext> {
    type: 'pending';
    isPaused: boolean;
    variables?: TVariables;
    context?: TContext;
}
interface SuccessAction<TData> {
    type: 'success';
    data: TData;
}
interface ErrorAction<TError> {
    type: 'error';
    error: TError;
}
interface PauseAction {
    type: 'pause';
}
interface ContinueAction {
    type: 'continue';
}
export type Action<TData, TError, TVariables, TContext> = ContinueAction | ErrorAction<TError> | FailedAction<TError> | PendingAction<TVariables, TContext> | PauseAction | SuccessAction<TData>;
export declare class Mutation<TData = unknown, TError = DefaultError, TVariables = unknown, TContext = unknown> extends Removable {
    #private;
    state: MutationState<TData, TError, TVariables, TContext>;
    options: MutationOptions<TData, TError, TVariables, TContext>;
    readonly mutationId: number;
    constructor(config: MutationConfig<TData, TError, TVariables, TContext>);
    setOptions(options: MutationOptions<TData, TError, TVariables, TContext>): void;
    get meta(): MutationMeta | undefined;
    addObserver(observer: MutationObserver<any, any, any, any>): void;
    removeObserver(observer: MutationObserver<any, any, any, any>): void;
    protected optionalRemove(): void;
    continue(): Promise<unknown>;
    execute(variables: TVariables): Promise<TData>;
}
export declare function getDefaultState<TData, TError, TVariables, TContext>(): MutationState<TData, TError, TVariables, TContext>;
export {};
//# sourceMappingURL=mutation.d.ts.map