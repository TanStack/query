import type { InfiniteData } from '@tanstack/query-core'
import type { CreateInfiniteQueryOptions } from './types'
import type { DefaultError, QueryKey } from '@tanstack/query-core'

export function infiniteQueryOptions<
  TQueryFnData,
  TError = DefaultError,
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
): CreateInfiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryFnData,
  TQueryKey,
  TPageParam
> {
  return options
}
