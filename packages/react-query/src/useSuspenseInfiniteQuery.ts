'use client'
import { InfiniteQueryObserver } from '@tanstack/query-core'
import { useBaseQuery } from './useBaseQuery'
import type { QueryObserver } from '@tanstack/query-core'
import type {
  DefaultError,
  InfiniteData,
  QueryClient,
  QueryKey,
} from '@tanstack/query-core'
import type { DefinedUseInfiniteQueryResult } from './types'
import type { UseInfiniteQueryOptions } from './types'

export function useSuspenseInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: Omit<
    UseInfiniteQueryOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryFnData,
      TQueryKey,
      TPageParam
    >,
    'enabled' | 'suspense' | 'throwOnError' | 'placeholderData'
  >,
  queryClient?: QueryClient,
): Omit<DefinedUseInfiniteQueryResult<TData, TError>, 'isPlaceholderData'> {
  return useBaseQuery(
    {
      ...options,
      enabled: true,
      suspense: true,
      throwOnError: true,
    },
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    InfiniteQueryObserver as typeof QueryObserver,
    queryClient,
  ) as DefinedUseInfiniteQueryResult<TData, TError>
}
