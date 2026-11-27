import { queryOptions, useQuery as usePreparedQuery } from '../src'
import type {
  AnyUseQueryOptions,
  DefaultError,
  DefinedInitialDataOptions,
  DefinedUseQueryResult,
  QueryClient,
  QueryKey,
  UndefinedInitialDataOptions,
  UseQueryOptions,
  UseQueryResult,
} from '../src'

/** Runs v6's raw-options tests through the pluggable package's public factory and hook. */
export function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
  client?: QueryClient,
): DefinedUseQueryResult<TData, TError>
export function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
  client?: QueryClient,
): UseQueryResult<TData, TError>
export function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  client?: QueryClient,
): UseQueryResult<TData, TError>
export function useQuery(options: AnyUseQueryOptions, client?: QueryClient) {
  // The v6 bad-arguments test passes an array; exercise the real hook's diagnostic.
  const prepared = Array.isArray(options)
    ? (options as never)
    : queryOptions(options)
  return usePreparedQuery(prepared, client)
}
