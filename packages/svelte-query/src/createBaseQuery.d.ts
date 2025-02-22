import type { QueryClient, QueryKey, QueryObserver } from '@tanstack/query-core'
import type {
  CreateBaseQueryOptions,
  CreateBaseQueryResult,
  StoreOrVal,
} from './types.js'
export declare function createBaseQuery<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey,
>(
  options: StoreOrVal<
    CreateBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  >,
  Observer: typeof QueryObserver,
  queryClient?: QueryClient,
): CreateBaseQueryResult<TData, TError>
//# sourceMappingURL=createBaseQuery.d.ts.map
