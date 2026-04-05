import type {
  DefaultError,
  InfiniteData,
  InfiniteQueryMode,
  QueryKey,
} from '@tanstack/query-core'
import type { CreateInfiniteQueryOptions } from './types.js'

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
    TQueryKey,
    TPageParam,
    undefined
  >,
): CreateInfiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam,
  undefined
>
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
    TQueryKey,
    TPageParam,
    InfiniteQueryMode
  >,
): CreateInfiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam,
  InfiniteQueryMode
>
export function infiniteQueryOptions(options: any): any {
  return options
}
