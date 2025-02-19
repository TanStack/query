import { Removable } from './removable';
import type { QueryClient } from './queryClient';
import type { CancelOptions, DefaultError, FetchStatus, QueryKey, QueryMeta, QueryOptions, QueryStatus, SetDataOptions } from './types';
import type { QueryObserver } from './queryObserver';
interface QueryConfig<TQueryFnData, TError, TData, TQueryKey extends QueryKey = QueryKey> {
    client: QueryClient;
    queryKey: TQueryKey;
    queryHash: string;
    options?: QueryOptions<TQueryFnData, TError, TData, TQueryKey>;
    defaultOptions?: QueryOptions<TQueryFnData, TError, TData, TQueryKey>;
    state?: QueryState<TData, TError>;
}
export interface QueryState<TData = unknown, TError = DefaultError> {
    data: TData | undefined;
    dataUpdateCount: number;
    dataUpdatedAt: number;
    error: TError | null;
    errorUpdateCount: number;
    errorUpdatedAt: number;
    fetchFailureCount: number;
    fetchFailureReason: TError | null;
    fetchMeta: FetchMeta | null;
    isInvalidated: boolean;
    status: QueryStatus;
    fetchStatus: FetchStatus;
}
export interface FetchContext<TQueryFnData, TError, TData, TQueryKey extends QueryKey = QueryKey> {
    fetchFn: () => unknown | Promise<unknown>;
    fetchOptions?: FetchOptions;
    signal: AbortSignal;
    options: QueryOptions<TQueryFnData, TError, TData, any>;
    client: QueryClient;
    queryKey: TQueryKey;
    state: QueryState<TData, TError>;
}
export interface QueryBehavior<TQueryFnData = unknown, TError = DefaultError, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey> {
    onFetch: (context: FetchContext<TQueryFnData, TError, TData, TQueryKey>, query: Query) => void;
}
export type FetchDirection = 'forward' | 'backward';
export interface FetchMeta {
    fetchMore?: {
        direction: FetchDirection;
    };
}
export interface FetchOptions<TData = unknown> {
    cancelRefetch?: boolean;
    meta?: FetchMeta;
    initialPromise?: Promise<TData>;
}
interface FailedAction<TError> {
    type: 'failed';
    failureCount: number;
    error: TError;
}
interface FetchAction {
    type: 'fetch';
    meta?: FetchMeta;
}
interface SuccessAction<TData> {
    data: TData | undefined;
    type: 'success';
    dataUpdatedAt?: number;
    manual?: boolean;
}
interface ErrorAction<TError> {
    type: 'error';
    error: TError;
}
interface InvalidateAction {
    type: 'invalidate';
}
interface PauseAction {
    type: 'pause';
}
interface ContinueAction {
    type: 'continue';
}
interface SetStateAction<TData, TError> {
    type: 'setState';
    state: Partial<QueryState<TData, TError>>;
    setStateOptions?: SetStateOptions;
}
export type Action<TData, TError> = ContinueAction | ErrorAction<TError> | FailedAction<TError> | FetchAction | InvalidateAction | PauseAction | SetStateAction<TData, TError> | SuccessAction<TData>;
export interface SetStateOptions {
    meta?: any;
}
export declare class Query<TQueryFnData = unknown, TError = DefaultError, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey> extends Removable {
    #private;
    queryKey: TQueryKey;
    queryHash: string;
    options: QueryOptions<TQueryFnData, TError, TData, TQueryKey>;
    state: QueryState<TData, TError>;
    observers: Array<QueryObserver<any, any, any, any, any>>;
    constructor(config: QueryConfig<TQueryFnData, TError, TData, TQueryKey>);
    get meta(): QueryMeta | undefined;
    get promise(): Promise<TData> | undefined;
    setOptions(options?: QueryOptions<TQueryFnData, TError, TData, TQueryKey>): void;
    protected optionalRemove(): void;
    setData(newData: TData, options?: SetDataOptions & {
        manual: boolean;
    }): TData;
    setState(state: Partial<QueryState<TData, TError>>, setStateOptions?: SetStateOptions): void;
    cancel(options?: CancelOptions): Promise<void>;
    destroy(): void;
    reset(): void;
    isActive(): boolean;
    isDisabled(): boolean;
    isStale(): boolean;
    isStaleByTime(staleTime?: number): boolean;
    onFocus(): void;
    onOnline(): void;
    addObserver(observer: QueryObserver<any, any, any, any, any>): void;
    removeObserver(observer: QueryObserver<any, any, any, any, any>): void;
    getObserversCount(): number;
    invalidate(): void;
    fetch(options?: QueryOptions<TQueryFnData, TError, TData, TQueryKey>, fetchOptions?: FetchOptions<TQueryFnData>): Promise<TData>;
}
export declare function fetchState<TQueryFnData, TError, TData, TQueryKey extends QueryKey>(data: TData | undefined, options: QueryOptions<TQueryFnData, TError, TData, TQueryKey>): {
    readonly error?: null | undefined;
    readonly status?: "pending" | undefined;
    readonly fetchFailureCount: 0;
    readonly fetchFailureReason: null;
    readonly fetchStatus: "fetching" | "paused";
};
export {};
//# sourceMappingURL=query.d.ts.map