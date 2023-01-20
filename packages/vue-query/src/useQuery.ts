import type { ToRefs } from 'vue-demi'
import { QueryObserver } from '@tanstack/query-core'
import type {
  QueryKey,
  QueryObserverResult,
  DefinedQueryObserverResult,
  WithRequired,
} from '@tanstack/query-core'
import { useBaseQuery } from './useBaseQuery'
import type { UseQueryReturnType as UQRT } from './useBaseQuery'
import type { VueQueryObserverOptions, DistributiveOmit } from './types'
import type { QueryClient } from './queryClient'

export type UseQueryReturnType<TData, TError> = DistributiveOmit<
  UQRT<TData, TError>,
  'refetch'
> & {
  refetch: QueryObserverResult<TData, TError>['refetch']
}

export type UseQueryDefinedReturnType<TData, TError> = DistributiveOmit<
  ToRefs<Readonly<DefinedQueryObserverResult<TData, TError>>>,
  'refetch'
> & {
  suspense: () => Promise<QueryObserverResult<TData, TError>>
  refetch: QueryObserverResult<TData, TError>['refetch']
}

export type UseQueryOptions<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = WithRequired<
  VueQueryObserverOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>,
  'queryKey'
>

type UndefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
  initialData?: undefined
}

type DefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
  initialData: TQueryFnData | (() => TQueryFnData)
}

export function useQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): UseQueryReturnType<TData, TError>

export function useQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): UseQueryDefinedReturnType<TData, TError>

export function useQuery<
  TQueryFnData,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
):
  | UseQueryReturnType<TData, TError>
  | UseQueryDefinedReturnType<TData, TError> {
  const result = useBaseQuery(QueryObserver, options, queryClient)

  return {
    ...result,
    refetch: result.refetch.value,
  }
}
