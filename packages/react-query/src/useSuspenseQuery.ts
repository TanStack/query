'use client'
import { QueryObserver } from '@tanstack/query-core'
import { useBaseQuery } from './useBaseQuery'
import type { UseSuspenseQueryOptions, UseSuspenseQueryResult } from './types'
import type { DefaultError, QueryClient, QueryKey } from '@tanstack/query-core'

export function useSuspenseQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): UseSuspenseQueryResult<TData, TError> {
  return useBaseQuery(
    {
      ...options,
      enabled: true,
      suspense: true,
      throwOnError: true,
    },
    QueryObserver,
    queryClient,
  ) as UseSuspenseQueryResult<TData, TError>
}
