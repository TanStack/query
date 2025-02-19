import { QueryObserver } from './queryObserver';
import { Subscribable } from './subscribable';
import type { QueryObserverOptions, QueryObserverResult } from './types';
import type { QueryClient } from './queryClient';
import type { NotifyOptions } from './queryObserver';
type QueriesObserverListener = (result: Array<QueryObserverResult>) => void;
type CombineFn<TCombinedResult> = (result: Array<QueryObserverResult>) => TCombinedResult;
export interface QueriesObserverOptions<TCombinedResult = Array<QueryObserverResult>> {
    combine?: CombineFn<TCombinedResult>;
}
export declare class QueriesObserver<TCombinedResult = Array<QueryObserverResult>> extends Subscribable<QueriesObserverListener> {
    #private;
    constructor(client: QueryClient, queries: Array<QueryObserverOptions<any, any, any, any, any>>, options?: QueriesObserverOptions<TCombinedResult>);
    protected onSubscribe(): void;
    protected onUnsubscribe(): void;
    destroy(): void;
    setQueries(queries: Array<QueryObserverOptions>, options?: QueriesObserverOptions<TCombinedResult>, notifyOptions?: NotifyOptions): void;
    getCurrentResult(): Array<QueryObserverResult>;
    getQueries(): import("@tanstack/svelte-query").Query<unknown, Error, unknown, readonly unknown[]>[];
    getObservers(): QueryObserver<unknown, Error, unknown, unknown, readonly unknown[]>[];
    getOptimisticResult(queries: Array<QueryObserverOptions>, combine: CombineFn<TCombinedResult> | undefined): [
        rawResult: Array<QueryObserverResult>,
        combineResult: (r?: Array<QueryObserverResult>) => TCombinedResult,
        trackResult: () => Array<QueryObserverResult>
    ];
}
export {};
//# sourceMappingURL=queriesObserver.d.ts.map