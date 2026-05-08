import { getCurrentScope, watchEffect } from 'vue-demi'
import { noop } from '@tanstack/query-core'
import { useQueryClient } from './useQueryClient'
import { toValueDeep } from './utils'
import type { DefaultError, QueryKey } from '@tanstack/query-core'
import type { QueryClient } from './queryClient'
import type { InfiniteQueryExecuteOptions, MaybeRefDeep } from './types'

export type UsePrefetchInfiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey,
  TPageParam,
> = InfiniteQueryExecuteOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
>

export function usePrefetchInfiniteQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options:
    | MaybeRefDeep<
        UsePrefetchInfiniteQueryOptions<
          TQueryFnData,
          TError,
          TData,
          TQueryKey,
          TPageParam
        >
      >
    | (() => MaybeRefDeep<
        UsePrefetchInfiniteQueryOptions<
          TQueryFnData,
          TError,
          TData,
          TQueryKey,
          TPageParam
        >
      >),
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
    const clonedOptions = toValueDeep<
      UsePrefetchInfiniteQueryOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryKey,
        TPageParam
      >
    >(options)

    if (!client.getQueryState(clonedOptions.queryKey)) {
      void client.infiniteQuery(clonedOptions).then(noop).catch(noop)
    }
  })
}
