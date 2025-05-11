import type { DefaultError, QueryKey } from './types'
import type { Query } from './query'

const Static: unique symbol = Symbol()

export const StaleTime = {
  Static,
}

export type AllowedStaleTime = number | typeof StaleTime.Static

export function isStaticStaleTime(
  staleTime: unknown,
): staleTime is typeof StaleTime.Static {
  return staleTime === StaleTime.Static
}

export type StaleTimeFn<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> =
  | AllowedStaleTime
  | ((query: Query<TQueryFnData, TError, TData, TQueryKey>) => AllowedStaleTime)

export function resolveStaleTime<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  staleTime: undefined | StaleTimeFn<TQueryFnData, TError, TData, TQueryKey>,
  query: Query<TQueryFnData, TError, TData, TQueryKey>,
): AllowedStaleTime | undefined {
  return typeof staleTime === 'function' ? staleTime(query) : staleTime
}
