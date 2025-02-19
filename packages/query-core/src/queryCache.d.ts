import { Query } from './query';
import { Subscribable } from './subscribable';
import type { QueryFilters } from './utils';
import type { Action, QueryState } from './query';
import type { DefaultError, NotifyEvent, QueryKey, QueryOptions, WithRequired } from './types';
import type { QueryClient } from './queryClient';
import type { QueryObserver } from './queryObserver';
interface QueryCacheConfig {
    onError?: (error: DefaultError, query: Query<unknown, unknown, unknown>) => void;
    onSuccess?: (data: unknown, query: Query<unknown, unknown, unknown>) => void;
    onSettled?: (data: unknown | undefined, error: DefaultError | null, query: Query<unknown, unknown, unknown>) => void;
}
interface NotifyEventQueryAdded extends NotifyEvent {
    type: 'added';
    query: Query<any, any, any, any>;
}
interface NotifyEventQueryRemoved extends NotifyEvent {
    type: 'removed';
    query: Query<any, any, any, any>;
}
interface NotifyEventQueryUpdated extends NotifyEvent {
    type: 'updated';
    query: Query<any, any, any, any>;
    action: Action<any, any>;
}
interface NotifyEventQueryObserverAdded extends NotifyEvent {
    type: 'observerAdded';
    query: Query<any, any, any, any>;
    observer: QueryObserver<any, any, any, any, any>;
}
interface NotifyEventQueryObserverRemoved extends NotifyEvent {
    type: 'observerRemoved';
    query: Query<any, any, any, any>;
    observer: QueryObserver<any, any, any, any, any>;
}
interface NotifyEventQueryObserverResultsUpdated extends NotifyEvent {
    type: 'observerResultsUpdated';
    query: Query<any, any, any, any>;
}
interface NotifyEventQueryObserverOptionsUpdated extends NotifyEvent {
    type: 'observerOptionsUpdated';
    query: Query<any, any, any, any>;
    observer: QueryObserver<any, any, any, any, any>;
}
export type QueryCacheNotifyEvent = NotifyEventQueryAdded | NotifyEventQueryRemoved | NotifyEventQueryUpdated | NotifyEventQueryObserverAdded | NotifyEventQueryObserverRemoved | NotifyEventQueryObserverResultsUpdated | NotifyEventQueryObserverOptionsUpdated;
type QueryCacheListener = (event: QueryCacheNotifyEvent) => void;
export interface QueryStore {
    has: (queryHash: string) => boolean;
    set: (queryHash: string, query: Query) => void;
    get: (queryHash: string) => Query | undefined;
    delete: (queryHash: string) => void;
    values: () => IterableIterator<Query>;
}
export declare class QueryCache extends Subscribable<QueryCacheListener> {
    #private;
    config: QueryCacheConfig;
    constructor(config?: QueryCacheConfig);
    build<TQueryFnData = unknown, TError = DefaultError, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>(client: QueryClient, options: WithRequired<QueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey'>, state?: QueryState<TData, TError>): Query<TQueryFnData, TError, TData, TQueryKey>;
    add(query: Query<any, any, any, any>): void;
    remove(query: Query<any, any, any, any>): void;
    clear(): void;
    get<TQueryFnData = unknown, TError = DefaultError, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>(queryHash: string): Query<TQueryFnData, TError, TData, TQueryKey> | undefined;
    getAll(): Array<Query>;
    find<TQueryFnData = unknown, TError = DefaultError, TData = TQueryFnData>(filters: WithRequired<QueryFilters, 'queryKey'>): Query<TQueryFnData, TError, TData> | undefined;
    findAll(filters?: QueryFilters): Array<Query>;
    notify(event: QueryCacheNotifyEvent): void;
    onFocus(): void;
    onOnline(): void;
}
export {};
//# sourceMappingURL=queryCache.d.ts.map