import { getCurrentScope, unref, watchEffect } from 'vue-demi'
import { useQueryClient } from './useQueryClient'
import { cloneDeepUnref } from './utils'
import type {
  DefaultError,
  FetchInfiniteQueryOptions,
  FetchQueryOptions,
  GetNextPageParamFunction,
  InfiniteData,
  InitialPageParam,
  OmitKeyof,
  QueryKey,
  SkipToken,
} from '@tanstack/query-core'
import type { QueryClient } from './queryClient'
import type { MaybeRefDeep, MaybeRefOrGetter } from './types'

type PrefetchInfinitePages<TQueryFnData, TPageParam> =
  | {
      pages?: never
      getNextPageParam?: GetNextPageParamFunction<TPageParam, TQueryFnData>
    }
  | {
      pages: number
      getNextPageParam: GetNextPageParamFunction<TPageParam, TQueryFnData>
    }

export type UsePrefetchInfiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey,
  TPageParam,
> = OmitKeyof<
  FetchQueryOptions<
    TQueryFnData,
    TError,
    InfiniteData<TData, TPageParam>,
    TQueryKey,
    TPageParam
  >,
  'queryFn' | 'initialPageParam'
> &
  InitialPageParam<TPageParam> & {
    queryFn?: Exclude<
      FetchQueryOptions<
        TQueryFnData,
        TError,
        InfiniteData<TData, TPageParam>,
        TQueryKey,
        TPageParam
      >['queryFn'],
      SkipToken
    >
  } & PrefetchInfinitePages<TQueryFnData, TPageParam>

function isGetter<T>(value: MaybeRefOrGetter<T>): value is () => T {
  return typeof value === 'function'
}

export function usePrefetchInfiniteQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: MaybeRefOrGetter<
    MaybeRefDeep<
      UsePrefetchInfiniteQueryOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryKey,
        TPageParam
      >
    >
  >,
  queryClient?: QueryClient,
): void {
  if (process.env.NODE_ENV === 'development') {
    if (!getCurrentScope()) {
      console.warn(
        'vue-query composable like "useQuery()" should only be used inside a "setup()" function or a running effect scope. They might otherwise lead to memory leaks.',
      )
    }
  }

  const client = queryClient || useQueryClient()

  watchEffect(() => {
    const resolvedOptions = isGetter(options) ? options() : unref(options)
    const clonedOptions: UsePrefetchInfiniteQueryOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    > = cloneDeepUnref(resolvedOptions)

    if (!client.getQueryState(clonedOptions.queryKey)) {
      void client.prefetchInfiniteQuery(
        clonedOptions as FetchInfiniteQueryOptions<
          TQueryFnData,
          TError,
          TData,
          TQueryKey,
          TPageParam
        >,
      )
    }
  })
}
