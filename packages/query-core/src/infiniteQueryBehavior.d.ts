import type { QueryBehavior } from './query';
import type { InfiniteData, InfiniteQueryPageParamsOptions } from './types';
export declare function infiniteQueryBehavior<TQueryFnData, TError, TData, TPageParam>(pages?: number): QueryBehavior<TQueryFnData, TError, InfiniteData<TData, TPageParam>>;
/**
 * Checks if there is a next page.
 */
export declare function hasNextPage(options: InfiniteQueryPageParamsOptions<any, any>, data?: InfiniteData<unknown>): boolean;
/**
 * Checks if there is a previous page.
 */
export declare function hasPreviousPage(options: InfiniteQueryPageParamsOptions<any, any>, data?: InfiniteData<unknown>): boolean;
//# sourceMappingURL=infiniteQueryBehavior.d.ts.map