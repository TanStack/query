import type { DefaultError, Enabled, FetchStatus, MutationKey, MutationStatus, QueryFunction, QueryKey, QueryOptions, StaleTime } from './types';
import type { Mutation } from './mutation';
import type { FetchOptions, Query } from './query';
export interface QueryFilters<TQueryFnData = unknown, TError = DefaultError, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey> {
    /**
     * Filter to active queries, inactive queries or all queries
     */
    type?: QueryTypeFilter;
    /**
     * Match query key exactly
     */
    exact?: boolean;
    /**
     * Include queries matching this predicate function
     */
    predicate?: (query: Query<TQueryFnData, TError, TData, TQueryKey>) => boolean;
    /**
     * Include queries matching this query key
     */
    queryKey?: TQueryKey;
    /**
     * Include or exclude stale queries
     */
    stale?: boolean;
    /**
     * Include queries matching their fetchStatus
     */
    fetchStatus?: FetchStatus;
}
export interface MutationFilters<TData = unknown, TError = DefaultError, TVariables = unknown, TContext = unknown> {
    /**
     * Match mutation key exactly
     */
    exact?: boolean;
    /**
     * Include mutations matching this predicate function
     */
    predicate?: (mutation: Mutation<TData, TError, TVariables, TContext>) => boolean;
    /**
     * Include mutations matching this mutation key
     */
    mutationKey?: MutationKey;
    /**
     * Filter by mutation status
     */
    status?: MutationStatus;
}
export type Updater<TInput, TOutput> = TOutput | ((input: TInput) => TOutput);
export type QueryTypeFilter = 'all' | 'active' | 'inactive';
export declare const isServer: boolean;
export declare function noop(): void;
export declare function noop(): undefined;
export declare function functionalUpdate<TInput, TOutput>(updater: Updater<TInput, TOutput>, input: TInput): TOutput;
export declare function isValidTimeout(value: unknown): value is number;
export declare function timeUntilStale(updatedAt: number, staleTime?: number): number;
export declare function resolveStaleTime<TQueryFnData = unknown, TError = DefaultError, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>(staleTime: undefined | StaleTime<TQueryFnData, TError, TData, TQueryKey>, query: Query<TQueryFnData, TError, TData, TQueryKey>): number | undefined;
export declare function resolveEnabled<TQueryFnData = unknown, TError = DefaultError, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>(enabled: undefined | Enabled<TQueryFnData, TError, TData, TQueryKey>, query: Query<TQueryFnData, TError, TData, TQueryKey>): boolean | undefined;
export declare function matchQuery(filters: QueryFilters, query: Query<any, any, any, any>): boolean;
export declare function matchMutation(filters: MutationFilters, mutation: Mutation<any, any>): boolean;
export declare function hashQueryKeyByOptions<TQueryKey extends QueryKey = QueryKey>(queryKey: TQueryKey, options?: Pick<QueryOptions<any, any, any, any>, 'queryKeyHashFn'>): string;
/**
 * Default query & mutation keys hash function.
 * Hashes the value into a stable hash.
 */
export declare function hashKey(queryKey: QueryKey | MutationKey): string;
/**
 * Checks if key `b` partially matches with key `a`.
 */
export declare function partialMatchKey(a: QueryKey, b: QueryKey): boolean;
/**
 * This function returns `a` if `b` is deeply equal.
 * If not, it will replace any deeply equal children of `b` with those of `a`.
 * This can be used for structural sharing between JSON values for example.
 */
export declare function replaceEqualDeep<T>(a: unknown, b: T): T;
/**
 * Shallow compare objects.
 */
export declare function shallowEqualObjects<T extends Record<string, any>>(a: T, b: T | undefined): boolean;
export declare function isPlainArray(value: unknown): boolean;
export declare function isPlainObject(o: any): o is Object;
export declare function sleep(timeout: number): Promise<void>;
export declare function replaceData<TData, TOptions extends QueryOptions<any, any, any, any>>(prevData: TData | undefined, data: TData, options: TOptions): TData;
export declare function keepPreviousData<T>(previousData: T | undefined): T | undefined;
export declare function addToEnd<T>(items: Array<T>, item: T, max?: number): Array<T>;
export declare function addToStart<T>(items: Array<T>, item: T, max?: number): Array<T>;
export declare const skipToken: unique symbol;
export type SkipToken = typeof skipToken;
export declare function ensureQueryFn<TQueryFnData = unknown, TQueryKey extends QueryKey = QueryKey>(options: {
    queryFn?: QueryFunction<TQueryFnData, TQueryKey> | SkipToken;
    queryHash?: string;
}, fetchOptions?: FetchOptions<TQueryFnData>): QueryFunction<TQueryFnData, TQueryKey>;
//# sourceMappingURL=utils.d.ts.map