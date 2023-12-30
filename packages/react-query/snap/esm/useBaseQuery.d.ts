import type { UseBaseQueryOptions } from './types';
import type { QueryClient, QueryKey, QueryObserver } from '@tanstack/query-core';
export declare function useBaseQuery<TQueryFnData, TError, TData, TQueryData, TQueryKey extends QueryKey>(options: UseBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>, Observer: typeof QueryObserver, queryClient?: QueryClient): import("packages/query-core/build/modern/queryClient-qZFrH27l").ad<TData, TError>;
//# sourceMappingURL=useBaseQuery.d.ts.map