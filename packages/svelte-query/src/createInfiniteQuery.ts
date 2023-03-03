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
} from './types'
import { createBaseQuery } from './createBaseQuery'

export function createInfiniteQuery<
  TQueryFnData,
  TError = RegisteredError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: CreateInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryFnData,
    TQueryKey,
    TPageParam
  >,
  queryClient?: QueryClient,
): CreateInfiniteQueryResult<TData, TError> {
  return createBaseQuery(
    options,
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    InfiniteQueryObserver as typeof QueryObserver,
    queryClient,
  ) as CreateInfiniteQueryResult<TData, TError>
}
