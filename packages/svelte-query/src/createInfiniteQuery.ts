import { InfiniteQueryObserver } from '@tanstack/query-core'
import { createBaseQuery } from './createBaseQuery.svelte.js'
import type {
  DefaultError,
  InfiniteData,
  InfiniteQueryMode,
  QueryClient,
  QueryKey,
  QueryObserver,
} from '@tanstack/query-core'
import type {
  Accessor,
  CreateBaseQueryOptions,
  CreateInfiniteQueryOptions,
  CreateInfiniteQueryResult,
} from './types.js'

export function createInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: Accessor<
    CreateInfiniteQueryOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam,
      undefined
    >
  >,
  queryClient?: Accessor<QueryClient>,
): CreateInfiniteQueryResult<TData, TError, TPageParam, undefined>
export function createInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: Accessor<
    CreateInfiniteQueryOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam,
      InfiniteQueryMode
    >
  >,
  queryClient?: Accessor<QueryClient>,
): CreateInfiniteQueryResult<
  TData,
  TError,
  TPageParam,
  InfiniteQueryMode
>
export function createInfiniteQuery(
  options: any,
  queryClient?: Accessor<QueryClient>,
): any {
  return createBaseQuery(
    options as Accessor<
      CreateBaseQueryOptions<
        any,
        any,
        any,
        InfiniteData<any, any>,
        any
      >
    >,
    InfiniteQueryObserver as typeof QueryObserver,
    queryClient,
  ) as any
}
