import { QueryObserver, QueryFunction } from '@tanstack/query-core';
import { CreateQueryOptions, CreateQueryResult, SolidQueryKey } from './types'
import { createComputed } from 'solid-js'
import { createStore } from 'solid-js/store';
import { parseQueryArgs } from './utils'
import { createBaseQuery } from './createBaseQuery';

// There are several ways to create a query.
// 1. createQuery(options: CreateQueryOptions)
// 2. createQuery(querykey: () => Serializable[], options: CreateQueryOptions)
// 3. createQuery(querykey: () => Serializable[], queryFunc: Fetcher Function,  options: CreateQueryOptions)
// 4. The fourth overload is a combination of all three function params
export function createQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends () => readonly unknown[] = SolidQueryKey
>(
  options: CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>
): CreateQueryResult<TData, TError>
export function createQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends () => readonly unknown[] = SolidQueryKey
>(
  queryKey: SolidQueryKey,
  options?: Omit<
    CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    'queryKey'
  >
): CreateQueryResult<TData, TError>
export function createQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends () => readonly unknown[] = SolidQueryKey
>(
  queryKey: TQueryKey,
  queryFn: QueryFunction<TQueryFnData, ReturnType<TQueryKey>>,
  options?: Omit<
    CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    'queryKey' | 'queryFn'
  >
): CreateQueryResult<TData, TError>
export function createQuery<
  TQueryFnData,
  TError,
  TData = TQueryFnData,
  TQueryKey extends () => readonly unknown[] = SolidQueryKey
>(
  arg1: TQueryKey | CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  arg2?:
    | QueryFunction<TQueryFnData, ReturnType<TQueryKey>>
    | CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  arg3?: CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>
): CreateQueryResult<TData, TError> {
  // The parseQuery Args functions helps normalize the arguments into the correct form.
  // Whatever the parameters are, they are normalized into the correct form.
  const [parsedOptions, setParsedOptions] = createStore(parseQueryArgs(arg1, arg2, arg3))

  // Watch for changes in the options and update the parsed options.
  createComputed(() => {
    const newParsedOptions = parseQueryArgs(arg1, arg2, arg3)
    setParsedOptions(newParsedOptions)
  })

  return createBaseQuery(parsedOptions, QueryObserver);
}
