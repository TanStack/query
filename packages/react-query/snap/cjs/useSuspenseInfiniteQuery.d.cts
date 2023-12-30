import type { DefaultError, InfiniteData, QueryClient, QueryKey } from '@tanstack/query-core';
import type { UseSuspenseInfiniteQueryOptions, UseSuspenseInfiniteQueryResult } from './types';
export declare function useSuspenseInfiniteQuery<TQueryFnData, TError = DefaultError, TData = InfiniteData<TQueryFnData>, TQueryKey extends QueryKey = QueryKey, TPageParam = unknown>(options: UseSuspenseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey, TPageParam>, queryClient?: QueryClient): UseSuspenseInfiniteQueryResult<TData, TError>;
