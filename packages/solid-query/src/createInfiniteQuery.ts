import type {
  QueryObserver,
  QueryKey,
  QueryClient,
  RegisteredError,
} from '@tanstack/query-core'
import { InfiniteQueryObserver } from '@tanstack/query-core'
import type {
  CreateInfiniteQueryOptions,
  CreateInfiniteQueryResult,
} from './types'
import { createBaseQuery } from './createBaseQuery'
import { createMemo } from 'solid-js'

export function createInfiniteQuery<
  TQueryFnData,
  TError = RegisteredError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: CreateInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  queryClient?: () => QueryClient,
): CreateInfiniteQueryResult<TData, TError> {
  return createBaseQuery(
    createMemo(() => options()),
    InfiniteQueryObserver as typeof QueryObserver,
    queryClient,
  ) as CreateInfiniteQueryResult<TData, TError>
}
