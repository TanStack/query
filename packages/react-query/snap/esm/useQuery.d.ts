import type { DefaultError, QueryClient, QueryKey } from '@tanstack/query-core';
import type { DefinedUseQueryResult, UseQueryOptions, UseQueryResult } from './types';
import type { DefinedInitialDataOptions, UndefinedInitialDataOptions } from './queryOptions';
export declare function useQuery<TQueryFnData = unknown, TError = DefaultError, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>(options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>, queryClient?: QueryClient): UseQueryResult<TData, TError>;
export declare function useQuery<TQueryFnData = unknown, TError = DefaultError, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>(options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>, queryClient?: QueryClient): DefinedUseQueryResult<TData, TError>;
export declare function useQuery<TQueryFnData = unknown, TError = DefaultError, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>(options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, queryClient?: QueryClient): UseQueryResult<TData, TError>;
//# sourceMappingURL=useQuery.d.ts.map