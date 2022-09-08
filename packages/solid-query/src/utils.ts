
import {  CreateQueryOptions, SolidQueryKey } from './types'
import { QueryFunction } from '@tanstack/query-core'

export function isQueryKey(value: unknown): value is SolidQueryKey {
  return typeof value === 'function'
}

// The parseQuery Args functions helps normalize the arguments into the correct form.
// Whatever the parameters are, they are normalized into the correct form.
export function parseQueryArgs<
  TQueryFnData,
  TError,
  TData = TQueryFnData,
  TQueryKey extends () => readonly unknown[] = SolidQueryKey,
>(
  arg1: TQueryKey | CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  arg2?:
    | QueryFunction<TQueryFnData, ReturnType<TQueryKey>>
    | CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  arg3?: CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>
): CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey> {
  if(!isQueryKey(arg1)) {
    const { queryKey: solidKey, ...opts } = arg1 as any
    if (solidKey) {
      return {
        ...opts,
        queryKey: solidKey(),
      } 
    } 
    return arg1 
  }

  if (typeof arg2 === 'function') {
    return { ...arg3, queryKey: arg1(), queryFn: arg2 } as any
  }

  return { ...arg2, queryKey: arg1() } as any
}