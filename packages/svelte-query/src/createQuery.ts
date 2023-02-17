import { QueryObserver } from '@tanstack/query-core'
import type {
  QueryKey,
  QueryClient,
  RegisteredError,
} from '@tanstack/query-core'
import { createBaseQuery } from './createBaseQuery'
import type {
  DefinedCreateQueryResult,
  CreateQueryOptions,
  CreateQueryResult,
  WritableOrVal,
} from './types'

type UndefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = RegisteredError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
  initialData?: undefined
}

type DefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = RegisteredError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
  initialData: TQueryFnData | (() => TQueryFnData)
}

export function createQuery<
  TQueryFnData = unknown,
  TError = RegisteredError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: WritableOrVal<
    UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
  >,
  queryClient?: QueryClient,
): CreateQueryResult<TData, TError>

export function createQuery<
  TQueryFnData = unknown,
  TError = RegisteredError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: WritableOrVal<
    DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>
  >,
  queryClient?: QueryClient,
): DefinedCreateQueryResult<TData, TError>

export function createQuery<
  TQueryFnData,
  TError = RegisteredError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: WritableOrVal<
    CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>
  >,
  queryClient?: QueryClient,
) {
  return createBaseQuery(options, QueryObserver, queryClient)
}
