import { getCurrentScope, unref, watchEffect } from 'vue-demi'
import { useQueryClient } from './useQueryClient'
import { cloneDeepUnref } from './utils'
import type {
  DefaultError,
  FetchQueryOptions,
  OmitKeyof,
  QueryKey,
  SkipToken,
} from '@tanstack/query-core'
import type { QueryClient } from './queryClient'
import type { MaybeRefDeep, MaybeRefOrGetter } from './types'

export type UsePrefetchQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey,
> = OmitKeyof<
  FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  'queryFn'
> & {
  queryFn?: Exclude<
    FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>['queryFn'],
    SkipToken
  >
}

function isGetter<T>(value: MaybeRefOrGetter<T>): value is () => T {
  return typeof value === 'function'
}

export function usePrefetchQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: MaybeRefOrGetter<
    MaybeRefDeep<
      UsePrefetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>
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
    const clonedOptions: UsePrefetchQueryOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey
    > = cloneDeepUnref(resolvedOptions)

    if (!client.getQueryState(clonedOptions.queryKey)) {
      void client.prefetchQuery(clonedOptions)
    }
  })
}
