import type { UseQueryOptions } from './types'
import type { OmitKeyof, QueryKey, WithRequired } from '@tanstack/query-core'

type SelectedQueryOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = WithRequired<
  OmitKeyof<
    UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    | 'getNextPageParam'
    | 'getPreviousPageParam'
    | 'onSuccess'
    | 'onError'
    | 'onSettled'
    | 'context'
    | 'refetchInterval'
  >,
  'queryKey'
> & {
  select: (data: TQueryFnData) => TData
}

type UnSelectedQueryOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = WithRequired<
  OmitKeyof<
    UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    | 'getNextPageParam'
    | 'getPreviousPageParam'
    | 'onSuccess'
    | 'onError'
    | 'onSettled'
    | 'context'
    | 'refetchInterval'
  >,
  'queryKey'
> & {
  select?: undefined
}

export function queryOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: SelectedQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): SelectedQueryOptions<TQueryFnData, TError, TData, TQueryKey>

export function queryOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UnSelectedQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): UnSelectedQueryOptions<TQueryFnData, TError, TData, TQueryKey>

export function queryOptions(options: unknown) {
  return options
}
