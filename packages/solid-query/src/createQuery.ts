import { QueryObserver } from '@tanstack/query-core'
import { createMemo } from 'solid-js'
import { createBaseQuery } from './createBaseQuery'
import type { DefaultError, QueryKey } from '@tanstack/query-core'
import type { QueryClient } from './QueryClient'
import type { Accessor } from 'solid-js'
import type {
  CreateQueryOptions,
  CreateQueryResult,
  DefinedCreateQueryResult,
  FunctionedParams,
  SolidQueryOptions,
} from './types'

type UndefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = FunctionedParams<
  SolidQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
    initialData?: undefined
  }
>

type DefinedInitialDataOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = FunctionedParams<
  SolidQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
    initialData: TQueryFnData | (() => TQueryFnData)
  }
>

export function queryOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TOptions extends UndefinedInitialDataOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey
  > = UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
>(options: TOptions): TOptions

export function queryOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TOptions extends DefinedInitialDataOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey
  > = DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
>(options: TOptions): TOptions

export function queryOptions(options: unknown) {
  return options
}

export function createQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: () => QueryClient,
): CreateQueryResult<TData, TError>

export function createQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: () => QueryClient,
): DefinedCreateQueryResult<TData, TError>
export function createQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: Accessor<QueryClient>,
) {
  return createBaseQuery(
    createMemo(() => options()),
    QueryObserver,
    queryClient,
  )
}
