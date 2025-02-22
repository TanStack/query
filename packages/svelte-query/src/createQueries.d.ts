import type { Readable } from 'svelte/store';
import type { StoreOrVal } from './types.js';
import type { DefaultError, DefinedQueryObserverResult, OmitKeyof, QueriesPlaceholderDataFunction, QueryClient, QueryFunction, QueryKey, QueryObserverOptions, QueryObserverResult, ThrowOnError } from '@tanstack/query-core';
type QueryObserverOptionsForCreateQueries<TQueryFnData = unknown, TError = DefaultError, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey> = OmitKeyof<QueryObserverOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>, 'placeholderData'> & {
    placeholderData?: TQueryFnData | QueriesPlaceholderDataFunction<TQueryFnData>;
};
type MAXIMUM_DEPTH = 20;
type SkipTokenForUseQueries = symbol;
type GetQueryObserverOptionsForCreateQueries<T> = T extends {
    queryFnData: infer TQueryFnData;
    error?: infer TError;
    data: infer TData;
} ? QueryObserverOptionsForCreateQueries<TQueryFnData, TError, TData> : T extends {
    queryFnData: infer TQueryFnData;
    error?: infer TError;
} ? QueryObserverOptionsForCreateQueries<TQueryFnData, TError> : T extends {
    data: infer TData;
    error?: infer TError;
} ? QueryObserverOptionsForCreateQueries<unknown, TError, TData> : T extends [infer TQueryFnData, infer TError, infer TData] ? QueryObserverOptionsForCreateQueries<TQueryFnData, TError, TData> : T extends [infer TQueryFnData, infer TError] ? QueryObserverOptionsForCreateQueries<TQueryFnData, TError> : T extends [infer TQueryFnData] ? QueryObserverOptionsForCreateQueries<TQueryFnData> : T extends {
    queryFn?: QueryFunction<infer TQueryFnData, infer TQueryKey> | SkipTokenForUseQueries;
    select?: (data: any) => infer TData;
    throwOnError?: ThrowOnError<any, infer TError, any, any>;
} ? QueryObserverOptionsForCreateQueries<TQueryFnData, unknown extends TError ? DefaultError : TError, unknown extends TData ? TQueryFnData : TData, TQueryKey> : QueryObserverOptionsForCreateQueries;
type GetDefinedOrUndefinedQueryResult<T, TData, TError = unknown> = T extends {
    initialData?: infer TInitialData;
} ? unknown extends TInitialData ? QueryObserverResult<TData, TError> : TInitialData extends TData ? DefinedQueryObserverResult<TData, TError> : TInitialData extends () => infer TInitialDataResult ? unknown extends TInitialDataResult ? QueryObserverResult<TData, TError> : TInitialDataResult extends TData ? DefinedQueryObserverResult<TData, TError> : QueryObserverResult<TData, TError> : QueryObserverResult<TData, TError> : QueryObserverResult<TData, TError>;
type GetCreateQueryResult<T> = T extends {
    queryFnData: any;
    error?: infer TError;
    data: infer TData;
} ? GetDefinedOrUndefinedQueryResult<T, TData, TError> : T extends {
    queryFnData: infer TQueryFnData;
    error?: infer TError;
} ? GetDefinedOrUndefinedQueryResult<T, TQueryFnData, TError> : T extends {
    data: infer TData;
    error?: infer TError;
} ? GetDefinedOrUndefinedQueryResult<T, TData, TError> : T extends [any, infer TError, infer TData] ? GetDefinedOrUndefinedQueryResult<T, TData, TError> : T extends [infer TQueryFnData, infer TError] ? GetDefinedOrUndefinedQueryResult<T, TQueryFnData, TError> : T extends [infer TQueryFnData] ? GetDefinedOrUndefinedQueryResult<T, TQueryFnData> : T extends {
    queryFn?: QueryFunction<infer TQueryFnData, any> | SkipTokenForUseQueries;
    select?: (data: any) => infer TData;
    throwOnError?: ThrowOnError<any, infer TError, any, any>;
} ? GetDefinedOrUndefinedQueryResult<T, unknown extends TData ? TQueryFnData : TData, unknown extends TError ? DefaultError : TError> : QueryObserverResult;
/**
 * QueriesOptions reducer recursively unwraps function arguments to infer/enforce type param
 */
export type QueriesOptions<T extends Array<any>, TResults extends Array<any> = [], TDepth extends ReadonlyArray<number> = []> = TDepth['length'] extends MAXIMUM_DEPTH ? Array<QueryObserverOptionsForCreateQueries> : T extends [] ? [] : T extends [infer Head] ? [...TResults, GetQueryObserverOptionsForCreateQueries<Head>] : T extends [infer Head, ...infer Tails] ? QueriesOptions<[
    ...Tails
], [
    ...TResults,
    GetQueryObserverOptionsForCreateQueries<Head>
], [
    ...TDepth,
    1
]> : ReadonlyArray<unknown> extends T ? T : T extends Array<QueryObserverOptionsForCreateQueries<infer TQueryFnData, infer TError, infer TData, infer TQueryKey>> ? Array<QueryObserverOptionsForCreateQueries<TQueryFnData, TError, TData, TQueryKey>> : Array<QueryObserverOptionsForCreateQueries>;
/**
 * QueriesResults reducer recursively maps type param to results
 */
export type QueriesResults<T extends Array<any>, TResults extends Array<any> = [], TDepth extends ReadonlyArray<number> = []> = TDepth['length'] extends MAXIMUM_DEPTH ? Array<QueryObserverResult> : T extends [] ? [] : T extends [infer Head] ? [...TResults, GetCreateQueryResult<Head>] : T extends [infer Head, ...infer Tails] ? QueriesResults<[
    ...Tails
], [
    ...TResults,
    GetCreateQueryResult<Head>
], [
    ...TDepth,
    1
]> : {
    [K in keyof T]: GetCreateQueryResult<T[K]>;
};
export declare function createQueries<T extends Array<any>, TCombinedResult = QueriesResults<T>>({ queries, ...options }: {
    queries: StoreOrVal<[...QueriesOptions<T>]> | StoreOrVal<[
        ...{
            [K in keyof T]: GetQueryObserverOptionsForCreateQueries<T[K]>;
        }
    ]>;
    combine?: (result: QueriesResults<T>) => TCombinedResult;
}, queryClient?: QueryClient): Readable<TCombinedResult>;
export {};
//# sourceMappingURL=createQueries.d.ts.map