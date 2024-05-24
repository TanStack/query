import { InfiniteQueryObserver } from '@tanstack/query-core'
import { createBaseQuery } from './createBaseQuery'
import type {
  DefaultError,
  InfiniteData,
  QueryClient,
  QueryKey,
  QueryObserver,
} from '@tanstack/query-core'
import type {
  CreateInfiniteQueryOptions,
  CreateInfiniteQueryResult,
  StoreOrVal,
} from './types'

export function createInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: StoreOrVal<
    CreateInfiniteQueryOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryFnData,
      TQueryKey,
      TPageParam
    >
  >,
  queryClient?: QueryClient,
): CreateInfiniteQueryResult<TData, TError> {
  return createBaseQuery(
    options,
    InfiniteQueryObserver ,
    queryClient,
  ) as CreateInfiniteQueryResult<TData, TError>
}
