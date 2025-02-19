import { Subscribable } from './subscribable';
import type { QueryClient } from './queryClient';
import type { DefaultError, MutateOptions, MutationObserverOptions, MutationObserverResult } from './types';
import type { Action } from './mutation';
type MutationObserverListener<TData, TError, TVariables, TContext> = (result: MutationObserverResult<TData, TError, TVariables, TContext>) => void;
export declare class MutationObserver<TData = unknown, TError = DefaultError, TVariables = void, TContext = unknown> extends Subscribable<MutationObserverListener<TData, TError, TVariables, TContext>> {
    #private;
    options: MutationObserverOptions<TData, TError, TVariables, TContext>;
    constructor(client: QueryClient, options: MutationObserverOptions<TData, TError, TVariables, TContext>);
    protected bindMethods(): void;
    setOptions(options: MutationObserverOptions<TData, TError, TVariables, TContext>): void;
    protected onUnsubscribe(): void;
    onMutationUpdate(action: Action<TData, TError, TVariables, TContext>): void;
    getCurrentResult(): MutationObserverResult<TData, TError, TVariables, TContext>;
    reset(): void;
    mutate(variables: TVariables, options?: MutateOptions<TData, TError, TVariables, TContext>): Promise<TData>;
}
export {};
//# sourceMappingURL=mutationObserver.d.ts.map