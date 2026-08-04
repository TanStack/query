import {
  InfiniteQueryObserver,
  QueryObserver,
  skipToken,
} from '@tanstack/query-core'
import { useBaseQuery } from './useBaseQuery'
import { defaultThrowOnError, splitSlot } from './internal'
import type {
  DefaultError,
  InfiniteData,
  QueryClient,
  QueryKey,
} from '@tanstack/query-core'
import type {
  UseSuspenseInfiniteQueryOptions,
  UseSuspenseInfiniteQueryResult,
  UseSuspenseQueryOptions,
  UseSuspenseQueryResult,
} from './types'

// Signatures match @tanstack/react-query's useSuspenseQuery.ts /
// useSuspenseInfiniteQuery.ts (data is always defined; no placeholderData /
// enabled / throwOnError options). The untyped implementation signature also
// accepts the compiler-injected trailing slot symbol.
export function useSuspenseQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  queryClient?: QueryClient,
): UseSuspenseQueryResult<TData, TError>

export function useSuspenseQuery(options: any, ...rest: Array<any>): any {
  const [user, slot] = splitSlot(rest)
  if (process.env.NODE_ENV !== 'production') {
    if (options.queryFn === skipToken) {
      console.error('skipToken is not allowed for useSuspenseQuery')
    }
  }
  return useBaseQuery(
    {
      ...options,
      enabled: true,
      suspense: true,
      throwOnError: defaultThrowOnError,
      placeholderData: undefined,
    },
    QueryObserver,
    user[0],
    slot,
  )
}

export function useSuspenseInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: UseSuspenseInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  queryClient?: QueryClient,
): UseSuspenseInfiniteQueryResult<TData, TError>

export function useSuspenseInfiniteQuery(
  options: any,
  ...rest: Array<any>
): any {
  const [user, slot] = splitSlot(rest)
  if (process.env.NODE_ENV !== 'production') {
    if (options.queryFn === skipToken) {
      console.error('skipToken is not allowed for useSuspenseInfiniteQuery')
    }
  }
  return useBaseQuery(
    {
      ...options,
      enabled: true,
      suspense: true,
      throwOnError: defaultThrowOnError,
    },
    InfiniteQueryObserver,
    user[0],
    slot,
  )
}
