'use client'
import { QueryObserver } from '@tanstack/query-core'
import { useBaseQuery } from './useBaseQuery'
import type { UseQueryOptions } from './types'
import type { DefaultError, QueryClient, QueryKey } from '@tanstack/query-core'
import type { DefinedUseQueryResult } from './types'

export function useSuspenseQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: Omit<
    UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    'enabled' | 'suspense' | 'throwOnError' | 'placeholderData'
  >,
  queryClient?: QueryClient,
): DefinedUseQueryResult<TData, TError> {
  return useBaseQuery(
    options,
    QueryObserver,
    queryClient,
  ) as DefinedUseQueryResult<TData, TError>
}
