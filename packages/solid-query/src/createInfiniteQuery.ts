import type { QueryObserver, QueryKey, QueryClient } from '@tanstack/query-core'
import { InfiniteQueryObserver } from '@tanstack/query-core'
import type {
  CreateInfiniteQueryOptions,
  CreateInfiniteQueryResult,
} from './types'
import { createBaseQuery } from './createBaseQuery'
import { createMemo } from 'solid-js'

export function createInfiniteQuery<
  TQueryFnData,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: () => QueryClient,
): CreateInfiniteQueryResult<TData, TError> {
  return createBaseQuery(
    createMemo(() => options()),
    InfiniteQueryObserver as typeof QueryObserver,
    queryClient,
  ) as CreateInfiniteQueryResult<TData, TError>
}
