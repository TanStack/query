import { infiniteQuery } from '../src/runtime/infiniteQuery'
import type { WithoutSkipToken } from '@tanstack/query-types/bindings'
import type { QueryClient } from '../src/runtime/queryClient'
import type {
  DefaultError,
  InfiniteData,
  InfiniteQueryExecuteOptions,
  QueryKey,
} from '../src/runtime/types'

export function bindInfiniteQuery(client: QueryClient) {
  function run<
    TQueryFnData,
    TError = DefaultError,
    TData = InfiniteData<TQueryFnData>,
    TQueryKey extends QueryKey = QueryKey,
    TPageParam = unknown,
  >(
    options: WithoutSkipToken<
      InfiniteQueryExecuteOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryKey,
        TPageParam
      >
    >,
  ): Promise<
    Array<TData> extends Array<InfiniteData<TQueryFnData>>
      ? InfiniteData<TQueryFnData, TPageParam>
      : TData
  >
  function run<
    TQueryFnData,
    TError = DefaultError,
    TData = InfiniteData<TQueryFnData>,
    TQueryKey extends QueryKey = QueryKey,
    TPageParam = unknown,
  >(
    options: InfiniteQueryExecuteOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >,
  ): Promise<
    | undefined
    | (Array<TData> extends Array<InfiniteData<TQueryFnData>>
        ? InfiniteData<TQueryFnData, TPageParam>
        : TData)
  >
  function run<
    TQueryFnData,
    TError = DefaultError,
    TData = InfiniteData<TQueryFnData>,
    TQueryKey extends QueryKey = QueryKey,
    TPageParam = unknown,
  >(
    options: InfiniteQueryExecuteOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >,
  ): Promise<
    | undefined
    | (Array<TData> extends Array<InfiniteData<TQueryFnData>>
        ? InfiniteData<TQueryFnData, TPageParam>
        : TData)
  > {
    return infiniteQuery(client, options)
  }
  return run
}
