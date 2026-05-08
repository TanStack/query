import { getCurrentScope, watchEffect } from 'vue-demi'
import { noop } from '@tanstack/query-core'
import { useQueryClient } from './useQueryClient'
import { toValueDeep } from './utils'
import type { DefaultError, QueryKey } from '@tanstack/query-core'
import type { QueryClient } from './queryClient'
import type { MaybeRefDeep, QueryExecuteOptions } from './types'

export type UsePrefetchQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey,
> = QueryExecuteOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryFnData,
  TQueryKey,
  never
>

export function usePrefetchQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options:
    | MaybeRefDeep<
        UsePrefetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>
      >
    | (() => MaybeRefDeep<
        UsePrefetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>
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
      UsePrefetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>
    >(options)

    if (!client.getQueryState(clonedOptions.queryKey)) {
      void client.query(clonedOptions).then(noop).catch(noop)
    }
  })
}
