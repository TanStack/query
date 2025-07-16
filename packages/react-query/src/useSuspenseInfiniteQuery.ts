import { useInfiniteQuery } from './useInfiniteQuery'
import type {
  InfiniteData,
  OmitKeyof,
  QueryKey,
  WithRequired,
} from '@tanstack/query-core'
import type { UseInfiniteQueryOptions, UseInfiniteQueryResult } from './types'

export interface UseSuspenseInfiniteQueryResult<
  TData = unknown,
  TError = unknown,
> extends OmitKeyof<
    UseInfiniteQueryResult<TData, TError>,
    keyof Pick<UseInfiniteQueryResult<TData, TError>, 'isPlaceholderData'>
  > {
  data: InfiniteData<TData>
}

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
  return useInfiniteQuery({
    ...options,
    enabled: true,
    suspense: true,
    useErrorBoundary: true,
    networkMode: 'always',
  }) as UseSuspenseInfiniteQueryResult<TData, TError>
}
