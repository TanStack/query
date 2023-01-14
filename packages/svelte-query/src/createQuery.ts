import { QueryObserver, parseQueryArgs } from '@tanstack/query-core'
import type { QueryFunction, QueryKey } from '@tanstack/query-core'
import { createBaseQuery } from './createBaseQuery'
import type {
  DefinedCreateQueryResult,
  CreateQueryOptions,
  CreateQueryResult,
} from './types'

export function createQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: Omit<
    CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    'initialData'
  > & {
    initialData?: () => undefined
  },
): CreateQueryResult<TData, TError>

export function createQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: Omit<
    CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    'initialData'
  > & {
    initialData: TQueryFnData | (() => TQueryFnData)
  },
): DefinedCreateQueryResult<TData, TError>

export function createQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): CreateQueryResult<TData, TError>

export function createQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  queryKey: TQueryKey,
  options?: Omit<
    CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    'queryKey' | 'initialData'
  > & { initialData?: () => undefined },
): CreateQueryResult<TData, TError>

export function createQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  queryKey: TQueryKey,
  options?: Omit<
    CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    'queryKey' | 'initialData'
  > & { initialData: TQueryFnData | (() => TQueryFnData) },
): DefinedCreateQueryResult<TData, TError>

export function createQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  queryKey: TQueryKey,
  options?: Omit<
    CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    'queryKey'
  >,
): CreateQueryResult<TData, TError>

export function createQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  queryKey: TQueryKey,
  queryFn: QueryFunction<TQueryFnData, TQueryKey>,
  options?: Omit<
    CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    'queryKey' | 'queryFn' | 'initialData'
  > & { initialData?: () => undefined },
): CreateQueryResult<TData, TError>

export function createQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  queryKey: TQueryKey,
  queryFn: QueryFunction<TQueryFnData, TQueryKey>,
  options?: Omit<
    CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    'queryKey' | 'queryFn' | 'initialData'
  > & { initialData: TQueryFnData | (() => TQueryFnData) },
): DefinedCreateQueryResult<TData, TError>

export function createQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  queryKey: TQueryKey,
  queryFn: QueryFunction<TQueryFnData, TQueryKey>,
  options?: Omit<
    CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    'queryKey' | 'queryFn'
  >,
): CreateQueryResult<TData, TError>

export function createQuery<
  TQueryFnData,
  TError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  arg1: TQueryKey | CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  arg2?:
    | QueryFunction<TQueryFnData, TQueryKey>
    | CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  arg3?: CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): CreateQueryResult<TData, TError> {
  const parsedOptions = parseQueryArgs(arg1, arg2, arg3)
  const result = createBaseQuery(parsedOptions, QueryObserver)
  return result
}
