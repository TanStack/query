import type {
  QueryObserver,
  QueryKey,
  QueryClient,
  RegisteredError,
  InfiniteData,
} from '@tanstack/query-core'
import { InfiniteQueryObserver } from '@tanstack/query-core'
import type {
  CreateInfiniteQueryOptions,
  CreateInfiniteQueryResult,
  WritableOrVal,
} from './types'
import { createBaseQuery } from './createBaseQuery'

export function createInfiniteQuery<
  TQueryFnData,
  TError = RegisteredError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: WritableOrVal<
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
    InfiniteQueryObserver as typeof QueryObserver,
    queryClient,
  ) as CreateInfiniteQueryResult<TData, TError>
}
