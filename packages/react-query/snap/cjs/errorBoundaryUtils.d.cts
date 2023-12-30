import type { DefaultedQueryObserverOptions, Query, QueryKey, QueryObserverResult, ThrowOnError } from '@tanstack/query-core';
import type { QueryErrorResetBoundaryValue } from './QueryErrorResetBoundary';
export declare const ensurePreventErrorBoundaryRetry: <TQueryFnData, TError, TData, TQueryData, TQueryKey extends QueryKey>(options: DefaultedQueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>, errorResetBoundary: QueryErrorResetBoundaryValue) => void;
export declare const useClearResetErrorBoundary: (errorResetBoundary: QueryErrorResetBoundaryValue) => void;
export declare const getHasError: <TData, TError, TQueryFnData, TQueryData, TQueryKey extends QueryKey>({ result, errorResetBoundary, throwOnError, query, }: {
    result: QueryObserverResult<TData, TError>;
    errorResetBoundary: QueryErrorResetBoundaryValue;
    throwOnError: ThrowOnError<TQueryFnData, TError, TQueryData, TQueryKey>;
    query: Query<TQueryFnData, TError, TQueryData, TQueryKey>;
}) => boolean;
