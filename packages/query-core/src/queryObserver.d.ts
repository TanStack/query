import { Subscribable } from './subscribable';
import type { FetchOptions, Query } from './query';
import type { QueryClient } from './queryClient';
import type { DefaultError, DefaultedQueryObserverOptions, QueryKey, QueryObserverOptions, QueryObserverResult, RefetchOptions } from './types';
type QueryObserverListener<TData, TError> = (result: QueryObserverResult<TData, TError>) => void;
export interface NotifyOptions {
    listeners?: boolean;
}
interface ObserverFetchOptions extends FetchOptions {
    throwOnError?: boolean;
}
export declare class QueryObserver<TQueryFnData = unknown, TError = DefaultError, TData = TQueryFnData, TQueryData = TQueryFnData, TQueryKey extends QueryKey = QueryKey> extends Subscribable<QueryObserverListener<TData, TError>> {
    #private;
    options: QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>;
    constructor(client: QueryClient, options: QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>);
    protected bindMethods(): void;
    protected onSubscribe(): void;
    protected onUnsubscribe(): void;
    shouldFetchOnReconnect(): boolean;
    shouldFetchOnWindowFocus(): boolean;
    destroy(): void;
    setOptions(options: QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>, notifyOptions?: NotifyOptions): void;
    getOptimisticResult(options: DefaultedQueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>): QueryObserverResult<TData, TError>;
    getCurrentResult(): QueryObserverResult<TData, TError>;
    trackResult(result: QueryObserverResult<TData, TError>, onPropTracked?: (key: keyof QueryObserverResult) => void): QueryObserverResult<TData, TError>;
    trackProp(key: keyof QueryObserverResult): void;
    getCurrentQuery(): Query<TQueryFnData, TError, TQueryData, TQueryKey>;
    refetch({ ...options }?: RefetchOptions): Promise<QueryObserverResult<TData, TError>>;
    fetchOptimistic(options: QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>): Promise<QueryObserverResult<TData, TError>>;
    protected fetch(fetchOptions: ObserverFetchOptions): Promise<QueryObserverResult<TData, TError>>;
    protected createResult(query: Query<TQueryFnData, TError, TQueryData, TQueryKey>, options: QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>): QueryObserverResult<TData, TError>;
    updateResult(notifyOptions?: NotifyOptions): void;
    onQueryUpdate(): void;
}
export {};
//# sourceMappingURL=queryObserver.d.ts.map