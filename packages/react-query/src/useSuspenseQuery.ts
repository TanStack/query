'use client'
import { QueryObserver } from '@tanstack/query-core'
import { useBaseQuery } from './useBaseQuery'
import type { QueryKey } from '@tanstack/query-core'
import type { UseSuspenseQueryOptions, UseSuspenseQueryResult } from './types'

// HOOK

export function useSuspenseQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): UseSuspenseQueryResult<TData, TError> {
  return useBaseQuery(
    {
      ...options,
      enabled: true,
      suspense: true,
      placeholderData: undefined,
    },
    QueryObserver,
  ) as UseSuspenseQueryResult<TData, TError>
}
