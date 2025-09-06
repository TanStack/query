import { InfiniteQueryObserver } from '@tanstack/query-core'
import { useBaseQuery } from './useBaseQuery'
import type {
  InfiniteQueryObserverSuccessResult,
  OmitKeyof,
  QueryKey,
  QueryObserver,
  WithRequired,
} from '@tanstack/query-core'
import type {
  UseInfiniteQueryOptions,
  UseSuspenseInfiniteQueryResult,
} from './types'

export type UseSuspenseInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = WithRequired<
  OmitKeyof<
    UseInfiniteQueryOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryFnData,
      TQueryKey
    >,
    | 'suspense'
    | 'useErrorBoundary'
    | 'enabled'
    | 'placeholderData'
    | 'networkMode'
    | 'initialData'
  >,
  'queryKey'
>

export function useSuspenseInfiniteQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseSuspenseInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey
  >,
): UseSuspenseInfiniteQueryResult<TData, TError> {
  return useBaseQuery(
    {
      ...options,
      enabled: true,
      suspense: true,
      useErrorBoundary: true,
      networkMode: 'always',
    },
    InfiniteQueryObserver as typeof QueryObserver,
  ) as InfiniteQueryObserverSuccessResult<TData, TError>
}
