import { QueryObserver } from '@tanstack/query-core'
import { useBaseQuery } from './useBaseQuery'
import type {
  DefaultError,
  DefinedQueryObserverResult,
  Enabled,
  InitialDataFunction,
  NonUndefinedGuard,
  QueryKey,
  QueryObserverOptions,
} from '@tanstack/query-core'
import type { UseBaseQueryReturnType } from './useBaseQuery'
import type {
  DeepUnwrapRef,
  MaybeRef,
  MaybeRefDeep,
  MaybeRefOrGetter,
  ShallowOption,
} from './types'
import type { QueryClient } from './queryClient'
import { ComputedRef, Ref } from 'vue'

export type UseQueryOptionsBase<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = {
  [Property in keyof QueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >]: Property extends 'enabled'
    ?
        | MaybeRefOrGetter<boolean | undefined>
        | (() => Enabled<
            TQueryFnData,
            TError,
            TQueryData,
            DeepUnwrapRef<TQueryKey>
          >)
    : MaybeRefDeep<
        QueryObserverOptions<
          TQueryFnData,
          TError,
          TData,
          TQueryData,
          DeepUnwrapRef<TQueryKey>
        >[Property]
      >
} & ShallowOption

export type UseQueryOptionsRef<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> =
  | Ref<UseQueryOptionsBase<TQueryFnData, TError, TData, TQueryData, TQueryKey>>
  | ComputedRef<
      UseQueryOptionsBase<TQueryFnData, TError, TData, TQueryData, TQueryKey>
    >

export type UseQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> =
  | UseQueryOptionsBase<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  | UseQueryOptionsRef<TQueryFnData, TError, TData, TQueryData, TQueryKey>

export type UndefinedInitialQueryOptionsBase<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = UseQueryOptionsBase<
  TQueryFnData,
  TError,
  TData,
  TQueryFnData,
  TQueryKey
> & {
  initialData?:
    | undefined
    | InitialDataFunction<NonUndefinedGuard<TQueryFnData>>
    | NonUndefinedGuard<TQueryFnData>
}

export type UndefinedInitialQueryOptionsRef<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = UseQueryOptionsRef<TQueryFnData, TError, TData, TQueryFnData, TQueryKey> & {
  initialData?:
    | undefined
    | InitialDataFunction<NonUndefinedGuard<TQueryFnData>>
    | NonUndefinedGuard<TQueryFnData>
}

export type UndefinedInitialQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> =
  | UndefinedInitialQueryOptionsBase<TQueryFnData, TError, TData, TQueryKey>
  | UndefinedInitialQueryOptionsRef<TQueryFnData, TError, TData, TQueryKey>

export type DefinedInitialQueryOptionsBase<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = UseQueryOptionsBase<
  TQueryFnData,
  TError,
  TData,
  TQueryFnData,
  TQueryKey
> & {
  initialData:
    | NonUndefinedGuard<TQueryFnData>
    | (() => NonUndefinedGuard<TQueryFnData>)
}

export type DefinedInitialQueryOptionsRef<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = UseQueryOptionsRef<TQueryFnData, TError, TData, TQueryFnData, TQueryKey> & {
  value: UseQueryOptionsRef<
    TQueryFnData,
    TError,
    TData,
    TQueryFnData,
    TQueryKey
  >['value'] & {
    initialData:
      | NonUndefinedGuard<TQueryFnData>
      | (() => NonUndefinedGuard<TQueryFnData>)
  }
}

export type DefinedInitialQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> =
  | DefinedInitialQueryOptionsBase<TQueryFnData, TError, TData, TQueryKey>
  | DefinedInitialQueryOptionsRef<TQueryFnData, TError, TData, TQueryKey>

export type UseQueryReturnType<TData, TError> = UseBaseQueryReturnType<
  TData,
  TError
>

export type UseQueryDefinedReturnType<TData, TError> = UseBaseQueryReturnType<
  TData,
  TError,
  DefinedQueryObserverResult<TData, TError>
>

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
  options: UndefinedInitialQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): UseQueryReturnType<TData, TError>

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
  return useBaseQuery(QueryObserver, options, queryClient)
}
