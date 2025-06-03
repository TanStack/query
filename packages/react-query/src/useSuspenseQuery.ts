import { QueryObserver } from '@tanstack/query-core'
import { useBaseQuery } from './useBaseQuery'
import type {
  DefinedQueryObserverResult,
  DistributiveOmit,
  OmitKeyof,
  QueryKey,
} from '@tanstack/query-core'
import type { UseQueryOptions } from './types'

export type UseSuspenseQueryResult<
  TData = unknown,
  TError = unknown,
> = DistributiveOmit<
  DefinedQueryObserverResult<TData, TError>,
  'isPlaceholderData'
>

export type UseSuspenseQueryOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = OmitKeyof<
  UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  | 'enabled'
  | 'useErrorBoundary'
  | 'suspense'
  | 'placeholderData'
  | 'networkMode'
  | 'onSuccess'
  | 'onError'
  | 'onSettled'
  | 'getPreviousPageParam'
  | 'getNextPageParam'
>

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
    },
    QueryObserver,
  ) as UseSuspenseQueryResult<TData, TError>
}
