import type {
  QueryClient,
  QueryKey,
  RegisteredError,
} from '@tanstack/query-core'
import { QueryObserver } from '@tanstack/query-core'
import { createMemo } from 'solid-js'
import { createBaseQuery } from './createBaseQuery'
import type {
  CreateQueryOptions,
  CreateQueryResult,
  DefinedCreateQueryResult,
  FunctionedParams,
  SolidQueryOptions,
} from './types'

type UndefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = RegisteredError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = FunctionedParams<
  SolidQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
    initialData?: undefined
  }
>

type DefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = RegisteredError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = FunctionedParams<
  SolidQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
    initialData: TQueryFnData | (() => TQueryFnData)
  }
>

export function createQuery<
  TQueryFnData = unknown,
  TError = RegisteredError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: () => QueryClient,
): CreateQueryResult<TData, TError>

export function createQuery<
  TQueryFnData = unknown,
  TError = RegisteredError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: () => QueryClient,
): DefinedCreateQueryResult<TData, TError>
export function createQuery<
  TQueryFnData,
  TError = RegisteredError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: () => QueryClient,
) {
  return createBaseQuery(
    createMemo(() => options()),
    QueryObserver,
    queryClient,
  )
}
