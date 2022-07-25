import {
  parseQueryArgs,
  QueryFunction,
  QueryKey,
  QueryObserver,
} from '@tanstack/query-core'
import { DefinedUseQueryResult, UseQueryOptions, UseQueryResult } from './types'
import { useBaseQuery } from './useBaseQuery'

export type UseQueryParamsOverloads<
  Options extends { queryKey?: unknown; queryFn?: unknown },
> =
  | [options: Options]
  | [queryKey: Options['queryKey'], options?: Omit<Options, 'queryKey'>]
  | [
      queryKey: Options['queryKey'],
      queryFn: Options['queryFn'],
      options?: Omit<Options, 'queryKey' | 'queryFn'>,
    ]

// HOOK

export function useQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  ...args: UseQueryParamsOverloads<
    Omit<
      UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
      'initialData'
    > & { initialData?: () => undefined }
  >
): UseQueryResult<TData, TError>

export function useQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  ...args: UseQueryParamsOverloads<
    Omit<
      UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
      'initialData'
    > & { initialData: TQueryFnData | (() => TQueryFnData) }
  >
): DefinedUseQueryResult<TData, TError>

export function useQuery<
  TQueryFnData,
  TError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  arg1: TQueryKey | UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  arg2?:
    | QueryFunction<TQueryFnData, TQueryKey>
    | UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  arg3?: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): UseQueryResult<TData, TError> {
  const parsedOptions = parseQueryArgs(arg1, arg2, arg3)
  return useBaseQuery(parsedOptions, QueryObserver)
}
