import { QueryObserver } from '@tanstack/query-core'
import { useBaseQuery } from './useBaseQuery'
import type { QueryKey } from '@tanstack/query-core'
import type { UseSuspenseQueryOptions, UseSuspenseQueryResult } from './types'

export function useSuspenseQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(options: UseSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey>) {
  return useBaseQuery(
    {
      ...options,
      enabled: true,
      useErrorBoundary: true,
      suspense: true,
      placeholderData: undefined,
      networkMode: 'always',
      onSuccess: undefined,
      onError: undefined,
      onSettled: undefined,
    },
    QueryObserver,
  ) as UseSuspenseQueryResult<TData, TError>
}
