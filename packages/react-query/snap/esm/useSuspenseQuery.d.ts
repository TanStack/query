import type { UseSuspenseQueryOptions, UseSuspenseQueryResult } from './types';
import type { DefaultError, QueryClient, QueryKey } from '@tanstack/query-core';
export declare function useSuspenseQuery<TQueryFnData = unknown, TError = DefaultError, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>(options: UseSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, queryClient?: QueryClient): UseSuspenseQueryResult<TData, TError>;
//# sourceMappingURL=useSuspenseQuery.d.ts.map