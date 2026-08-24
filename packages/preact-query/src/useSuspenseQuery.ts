import { QueryObserver, skipToken } from '@tanstack/query-core'
import type { DefaultError, QueryClient, QueryKey } from '@tanstack/query-core'

import { defaultThrowOnError } from './suspense'
import type { UseSuspenseQueryOptions, UseSuspenseQueryResult } from './types'
import { useBaseQuery } from './useBaseQuery'

/**
 * The options for `useSuspenseQuery` are the same as for `useQuery`, except for `throwOnError`, `enabled`, and
 * `placeholderData`.
 *
 * @returns The same object as `useQuery`, except that `data` is guaranteed to be defined, `isPlaceholderData`
 * is missing, and `status` is either `success` or `error` (with the derived flags set accordingly).
 *
 * Caveat: cancellation does not work.
 */
export function useSuspenseQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): UseSuspenseQueryResult<TData, TError> {
  if (process.env.NODE_ENV !== 'production') {
    if ((options.queryFn as any) === skipToken) {
      console.error('skipToken is not allowed for useSuspenseQuery')
    }
  }

  return useBaseQuery(
    {
      ...options,
      enabled: true,
      suspense: true,
      throwOnError: defaultThrowOnError,
      placeholderData: undefined,
    },
    QueryObserver,
    queryClient,
  ) as UseSuspenseQueryResult<TData, TError>
}
