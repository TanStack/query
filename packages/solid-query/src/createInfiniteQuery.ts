import type { QueryObserver, QueryKey } from '@tanstack/query-core'
import { InfiniteQueryObserver } from '@tanstack/query-core'
import type {
  CreateInfiniteQueryOptions,
  CreateInfiniteQueryResult,
} from './types'
import { createBaseQuery } from './createBaseQuery'
import { createMemo } from 'solid-js'

export function createInfiniteQuery<
  TQueryFnData,
  TError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): CreateInfiniteQueryResult<TData, TError> {
  return createBaseQuery(
    createMemo(() => options()),
    InfiniteQueryObserver as typeof QueryObserver,
  ) as CreateInfiniteQueryResult<TData, TError>
}
