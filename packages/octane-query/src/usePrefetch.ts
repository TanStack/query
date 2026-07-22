import { resolveClient } from './context'
import { splitSlot } from './internal'
import type {
  DefaultError,
  FetchInfiniteQueryOptions,
  QueryClient,
  QueryKey,
} from '@tanstack/query-core'
import type { UsePrefetchQueryOptions } from './types'

// Signatures match @tanstack/react-query's usePrefetchQuery.tsx /
// usePrefetchInfiniteQuery.tsx.
export function usePrefetchQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UsePrefetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): void

export function usePrefetchQuery(options: any, ...rest: Array<any>): void {
  const [user] = splitSlot(rest)
  const client = resolveClient(user[0])
  if (!client.getQueryState(options.queryKey)) {
    client.prefetchQuery(options)
  }
}

export function usePrefetchInfiniteQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: FetchInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  queryClient?: QueryClient,
): void

export function usePrefetchInfiniteQuery(
  options: any,
  ...rest: Array<any>
): void {
  const [user] = splitSlot(rest)
  const client = resolveClient(user[0])
  if (!client.getQueryState(options.queryKey)) {
    client.prefetchInfiniteQuery(options)
  }
}
