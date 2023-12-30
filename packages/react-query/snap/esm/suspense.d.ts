import type { DefaultedQueryObserverOptions, Query, QueryKey, QueryObserver, QueryObserverResult } from '@tanstack/query-core';
import type { QueryErrorResetBoundaryValue } from './QueryErrorResetBoundary';
export declare const defaultThrowOnError: <TQueryFnData = unknown, TError = Error, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>(_error: TError, query: Query<TQueryFnData, TError, TData, TQueryKey>) => boolean;
export declare const ensureStaleTime: (defaultedOptions: DefaultedQueryObserverOptions<any, any, any, any, any>) => void;
export declare const willFetch: (result: QueryObserverResult<any, any>, isRestoring: boolean) => boolean;
export declare const shouldSuspend: (defaultedOptions: DefaultedQueryObserverOptions<any, any, any, any, any> | undefined, result: QueryObserverResult<any, any>) => boolean | undefined;
export declare const fetchOptimistic: <TQueryFnData, TError, TData, TQueryData, TQueryKey extends QueryKey>(defaultedOptions: DefaultedQueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>, observer: QueryObserver<TQueryFnData, TError, TData, TQueryData, TQueryKey>, errorResetBoundary: QueryErrorResetBoundaryValue) => Promise<void | QueryObserverResult<TData, TError>>;
//# sourceMappingURL=suspense.d.ts.map