import type { UseSuspenseQueryOptions, UseSuspenseQueryResult } from './types';
import type { DefaultError, QueryClient, QueryFunction, ThrowOnError } from '@tanstack/query-core';
type MAXIMUM_DEPTH = 20;
type GetSuspenseOptions<T> = T extends {
    queryFnData: infer TQueryFnData;
    error?: infer TError;
    data: infer TData;
} ? UseSuspenseQueryOptions<TQueryFnData, TError, TData> : T extends {
    queryFnData: infer TQueryFnData;
    error?: infer TError;
} ? UseSuspenseQueryOptions<TQueryFnData, TError> : T extends {
    data: infer TData;
    error?: infer TError;
} ? UseSuspenseQueryOptions<unknown, TError, TData> : T extends [infer TQueryFnData, infer TError, infer TData] ? UseSuspenseQueryOptions<TQueryFnData, TError, TData> : T extends [infer TQueryFnData, infer TError] ? UseSuspenseQueryOptions<TQueryFnData, TError> : T extends [infer TQueryFnData] ? UseSuspenseQueryOptions<TQueryFnData> : T extends {
    queryFn?: QueryFunction<infer TQueryFnData, infer TQueryKey>;
    select?: (data: any) => infer TData;
    throwOnError?: ThrowOnError<any, infer TError, any, any>;
} ? UseSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey> : T extends {
    queryFn?: QueryFunction<infer TQueryFnData, infer TQueryKey>;
    throwOnError?: ThrowOnError<any, infer TError, any, any>;
} ? UseSuspenseQueryOptions<TQueryFnData, TError, TQueryFnData, TQueryKey> : UseSuspenseQueryOptions;
type GetSuspenseResults<T> = T extends {
    queryFnData: any;
    error?: infer TError;
    data: infer TData;
} ? UseSuspenseQueryResult<TData, TError> : T extends {
    queryFnData: infer TQueryFnData;
    error?: infer TError;
} ? UseSuspenseQueryResult<TQueryFnData, TError> : T extends {
    data: infer TData;
    error?: infer TError;
} ? UseSuspenseQueryResult<TData, TError> : T extends [any, infer TError, infer TData] ? UseSuspenseQueryResult<TData, TError> : T extends [infer TQueryFnData, infer TError] ? UseSuspenseQueryResult<TQueryFnData, TError> : T extends [infer TQueryFnData] ? UseSuspenseQueryResult<TQueryFnData> : T extends {
    queryFn?: QueryFunction<infer TQueryFnData, any>;
    select?: (data: any) => infer TData;
    throwOnError?: ThrowOnError<any, infer TError, any, any>;
} ? UseSuspenseQueryResult<unknown extends TData ? TQueryFnData : TData, unknown extends TError ? DefaultError : TError> : T extends {
    queryFn?: QueryFunction<infer TQueryFnData, any>;
    throwOnError?: ThrowOnError<any, infer TError, any, any>;
} ? UseSuspenseQueryResult<TQueryFnData, unknown extends TError ? DefaultError : TError> : UseSuspenseQueryResult;
/**
 * SuspenseQueriesOptions reducer recursively unwraps function arguments to infer/enforce type param
 */
export type SuspenseQueriesOptions<T extends Array<any>, Result extends Array<any> = [], Depth extends ReadonlyArray<number> = []> = Depth['length'] extends MAXIMUM_DEPTH ? Array<UseSuspenseQueryOptions> : T extends [] ? [] : T extends [infer Head] ? [...Result, GetSuspenseOptions<Head>] : T extends [infer Head, ...infer Tail] ? SuspenseQueriesOptions<[
    ...Tail
], [
    ...Result,
    GetSuspenseOptions<Head>
], [
    ...Depth,
    1
]> : Array<unknown> extends T ? T : T extends Array<UseSuspenseQueryOptions<infer TQueryFnData, infer TError, infer TData, infer TQueryKey>> ? Array<UseSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey>> : Array<UseSuspenseQueryOptions>;
/**
 * SuspenseQueriesResults reducer recursively maps type param to results
 */
export type SuspenseQueriesResults<T extends Array<any>, Result extends Array<any> = [], Depth extends ReadonlyArray<number> = []> = Depth['length'] extends MAXIMUM_DEPTH ? Array<UseSuspenseQueryResult> : T extends [] ? [] : T extends [infer Head] ? [...Result, GetSuspenseResults<Head>] : T extends [infer Head, ...infer Tail] ? SuspenseQueriesResults<[
    ...Tail
], [
    ...Result,
    GetSuspenseResults<Head>
], [
    ...Depth,
    1
]> : T extends Array<UseSuspenseQueryOptions<infer TQueryFnData, infer TError, infer TData, any>> ? Array<UseSuspenseQueryResult<unknown extends TData ? TQueryFnData : TData, unknown extends TError ? DefaultError : TError>> : Array<UseSuspenseQueryResult>;
export declare function useSuspenseQueries<T extends Array<any>, TCombinedResult = SuspenseQueriesResults<T>>(options: {
    queries: readonly [...SuspenseQueriesOptions<T>];
    combine?: (result: SuspenseQueriesResults<T>) => TCombinedResult;
}, queryClient?: QueryClient): TCombinedResult;
export {};
//# sourceMappingURL=useSuspenseQueries.d.ts.map