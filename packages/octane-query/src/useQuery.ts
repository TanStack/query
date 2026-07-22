import { QueryObserver } from '@tanstack/query-core'
import { useBaseQuery } from './useBaseQuery'
import type { DefaultError, QueryClient, QueryKey } from '@tanstack/query-core'
import type {
  DefinedUseQueryResult,
  UseQueryOptions,
  UseQueryResult,
} from './types'
import type {
  DefinedInitialDataOptions,
  UndefinedInitialDataOptions,
} from './queryOptions'

// Overloads match @tanstack/react-query's useQuery.ts: `initialData` narrows the
// result to DefinedUseQueryResult. The untyped implementation signature also
// accepts the compiler-injected trailing slot symbol (never visible to users).
export function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: DefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): DefinedUseQueryResult<NoInfer<TData>, TError>

export function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UndefinedInitialDataOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): UseQueryResult<NoInfer<TData>, TError>

export function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): UseQueryResult<NoInfer<TData>, TError>

export function useQuery(options: any, ...rest: Array<any>): any {
  // `[queryClient?, slot?]` — the slot (symbol) is the compiler-injected trailing
  // arg; an explicit client is the first non-symbol arg.
  const tail = rest[rest.length - 1]
  const slot = typeof tail === 'symbol' ? tail : undefined
  const queryClient = typeof rest[0] !== 'symbol' ? rest[0] : undefined
  return useBaseQuery(options, QueryObserver, queryClient, slot)
}
