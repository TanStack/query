import { QueryObserver } from '@tanstack/query-core'
import { useBaseQuery } from './useBaseQuery'
import type { ToRefs } from 'vue-demi'
import type {
  DefaultError,
  DefinedQueryObserverResult,
  QueryKey,
  QueryObserverOptions,
  QueryObserverResult,
  WithRequired,
} from '@tanstack/query-core'
import type { UseBaseQueryReturnType } from './useBaseQuery'
import type {
  DeepUnwrapRef,
  DistributiveOmit,
  MaybeRef,
  MaybeRefDeep,
  MaybeRefOrGetter,
} from './types'
import type { QueryClient } from './queryClient'

type NonUndefinedGuard<T> = T extends undefined ? never : T

export type UseQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = MaybeRef<{
  [Property in keyof QueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >]: Property extends 'queryFn'
    ? QueryObserverOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryData,
        DeepUnwrapRef<TQueryKey>
      >[Property]
    : Property extends 'enabled'
    ? MaybeRefOrGetter<
        QueryObserverOptions<
          TQueryFnData,
          TError,
          TData,
          TQueryData,
          TQueryKey
        >[Property]
      >
    : MaybeRefDeep<
        WithRequired<
          QueryObserverOptions<
            TQueryFnData,
            TError,
            TData,
            TQueryData,
            TQueryKey
          >,
          'queryKey'
        >[Property]
      >
}>

export type UndefinedInitialQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = UseQueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey> & {
  initialData?: undefined
}

export type DefinedInitialQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = UseQueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey> & {
  initialData:
    | NonUndefinedGuard<TQueryFnData>
    | (() => NonUndefinedGuard<TQueryFnData>)
}

export type UseQueryReturnType<TData, TError> = DistributiveOmit<
  UseBaseQueryReturnType<TData, TError>,
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

export function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UndefinedInitialQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): UseQueryReturnType<TData, TError>

export function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: DefinedInitialQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): UseQueryDefinedReturnType<TData, TError>

export function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryFnData,
    TQueryKey
  >,
  queryClient?: QueryClient,
): UseQueryReturnType<TData, TError>

export function useQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryFnData,
    TQueryKey
  >,
  queryClient?: QueryClient,
):
  | UseQueryReturnType<TData, TError>
  | UseQueryDefinedReturnType<TData, TError> {
  const result = useBaseQuery(QueryObserver, options, queryClient)

  return result
}
