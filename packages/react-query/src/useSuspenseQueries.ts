import { useQueries } from './useQueries'
import type {
  UseQueryOptions,
  UseSuspenseQueryOptions,
  UseSuspenseQueryResult,
} from './types'
import type { NetworkMode, QueryFunction } from '@tanstack/query-core'

// Avoid TS depth-limit error in case of large array literal
type MAXIMUM_DEPTH = 20

type GetSuspenseOptions<T> =
  // Part 1: responsible for applying explicit type parameter to function arguments, if object { queryFnData: TQueryFnData, error: TError, data: TData }
  T extends {
    queryFnData: infer TQueryFnData
    error?: infer TError
    data: infer TData
  }
    ? UseSuspenseQueryOptions<TQueryFnData, TError, TData>
    : T extends { queryFnData: infer TQueryFnData; error?: infer TError }
    ? UseSuspenseQueryOptions<TQueryFnData, TError>
    : T extends { data: infer TData; error?: infer TError }
    ? UseSuspenseQueryOptions<unknown, TError, TData>
    : // Part 2: responsible for applying explicit type parameter to function arguments, if tuple [TQueryFnData, TError, TData]
    T extends [infer TQueryFnData, infer TError, infer TData]
    ? UseSuspenseQueryOptions<TQueryFnData, TError, TData>
    : T extends [infer TQueryFnData, infer TError]
    ? UseSuspenseQueryOptions<TQueryFnData, TError>
    : T extends [infer TQueryFnData]
    ? UseSuspenseQueryOptions<TQueryFnData>
    : // Part 3: responsible for inferring and enforcing type if no explicit parameter was provided
    T extends {
        queryFn?: QueryFunction<infer TQueryFnData, infer TQueryKey>
        select?: (data: any) => infer TData
      }
    ? UseSuspenseQueryOptions<TQueryFnData, unknown, TData, TQueryKey>
    : T extends {
        queryFn?: QueryFunction<infer TQueryFnData, infer TQueryKey>
      }
    ? UseSuspenseQueryOptions<TQueryFnData, unknown, TQueryFnData, TQueryKey>
    : // Fallback
      UseSuspenseQueryOptions

type GetSuspenseResults<T> =
  // Part 1: responsible for mapping explicit type parameter to function result, if object
  T extends { queryFnData: any; error?: infer TError; data: infer TData }
    ? UseSuspenseQueryResult<TData, TError>
    : T extends { queryFnData: infer TQueryFnData; error?: infer TError }
    ? UseSuspenseQueryResult<TQueryFnData, TError>
    : T extends { data: infer TData; error?: infer TError }
    ? UseSuspenseQueryResult<TData, TError>
    : // Part 2: responsible for mapping explicit type parameter to function result, if tuple
    T extends [any, infer TError, infer TData]
    ? UseSuspenseQueryResult<TData, TError>
    : T extends [infer TQueryFnData, infer TError]
    ? UseSuspenseQueryResult<TQueryFnData, TError>
    : T extends [infer TQueryFnData]
    ? UseSuspenseQueryResult<TQueryFnData>
    : // Part 3: responsible for mapping inferred type to results, if no explicit parameter was provided
    T extends {
        queryFn?: QueryFunction<infer TQueryFnData, any>
        select?: (data: any) => infer TData
      }
    ? UseSuspenseQueryResult<unknown extends TData ? TQueryFnData : TData>
    : T extends {
        queryFn?: QueryFunction<infer TQueryFnData, any>
      }
    ? UseSuspenseQueryResult<TQueryFnData>
    : // Fallback
      UseSuspenseQueryResult

/**
 * SuspenseQueriesOptions reducer recursively unwraps function arguments to infer/enforce type param
 */
export type SuspenseQueriesOptions<
  T extends Array<any>,
  TResult extends Array<any> = [],
  TDepth extends ReadonlyArray<number> = [],
> = TDepth['length'] extends MAXIMUM_DEPTH
  ? Array<UseSuspenseQueryOptions>
  : T extends []
  ? []
  : T extends [infer Head]
  ? [...TResult, GetSuspenseOptions<Head>]
  : T extends [infer Head, ...infer Tail]
  ? SuspenseQueriesOptions<
      [...Tail],
      [...TResult, GetSuspenseOptions<Head>],
      [...TDepth, 1]
    >
  : Array<unknown> extends T
  ? T
  : // If T is *some* array but we couldn't assign unknown[] to it, then it must hold some known/homogenous type!
  // use this to infer the param types in the case of Array.map() argument
  T extends Array<
      UseSuspenseQueryOptions<
        infer TQueryFnData,
        infer TError,
        infer TData,
        infer TQueryKey
      >
    >
  ? Array<UseSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey>>
  : // Fallback
    Array<UseSuspenseQueryOptions>

/**
 * SuspenseQueriesResults reducer recursively maps type param to results
 */
export type SuspenseQueriesResults<
  T extends Array<any>,
  TResult extends Array<any> = [],
  TDepth extends ReadonlyArray<number> = [],
> = TDepth['length'] extends MAXIMUM_DEPTH
  ? Array<UseSuspenseQueryResult>
  : T extends []
  ? []
  : T extends [infer Head]
  ? [...TResult, GetSuspenseResults<Head>]
  : T extends [infer Head, ...infer Tail]
  ? SuspenseQueriesResults<
      [...Tail],
      [...TResult, GetSuspenseResults<Head>],
      [...TDepth, 1]
    >
  : T extends Array<
      UseSuspenseQueryOptions<
        infer TQueryFnData,
        infer TError,
        infer TData,
        any
      >
    >
  ? // Dynamic-size (homogenous) UseQueryOptions array: map directly to array of results
    Array<
      UseSuspenseQueryResult<
        unknown extends TData ? TQueryFnData : TData,
        TError
      >
    >
  : // Fallback
    Array<UseSuspenseQueryResult>

export function useSuspenseQueries<T extends any[]>({
  queries,
  context,
}: {
  queries: readonly [...SuspenseQueriesOptions<T>]
  context?: UseQueryOptions['context']
}): SuspenseQueriesResults<T> {
  return useQueries({
    queries: queries.map((query) => ({
      ...query,
      enabled: true,
      useErrorBoundary: true,
      suspense: true,
      placeholderData: undefined,
      networkMode: 'always' as NetworkMode,
    })),
    context,
  }) as SuspenseQueriesResults<T>
}
