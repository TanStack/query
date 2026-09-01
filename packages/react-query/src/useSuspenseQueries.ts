'use client'
import { skipToken } from '@tanstack/query-core'
import { useQueries } from './useQueries'
import { defaultThrowOnError } from './suspense'
import type { UseSuspenseQueryOptions, UseSuspenseQueryResult } from './types'
import type {
  DefaultError,
  OmitKeyof,
  QueriesPlaceholderDataFunction,
  QueryClient,
  QueryFunction,
  QueryKey,
  ThrowOnError,
} from '@tanstack/query-core'

// `placeholderData` functions in useQueries never receive previous query data.
type UseSuspenseQueryOptionsForUseSuspenseQueries<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = OmitKeyof<
  UseSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  'placeholderData'
> & {
  placeholderData?: TQueryFnData | QueriesPlaceholderDataFunction<TQueryFnData>
}

// Avoid TS depth-limit error in case of large array literal
type MAXIMUM_DEPTH = 20

// Widen the type of the symbol to enable type inference even if skipToken is not immutable.
type SkipTokenForUseQueries = symbol

type GetUseSuspenseQueryOptions<T> =
  // Part 1: responsible for applying explicit type parameter to function arguments, if object { queryFnData: TQueryFnData, error: TError, data: TData }
  T extends {
    queryFnData: infer TQueryFnData
    error?: infer TError
    data: infer TData
  }
    ? UseSuspenseQueryOptionsForUseSuspenseQueries<TQueryFnData, TError, TData>
    : T extends { queryFnData: infer TQueryFnData; error?: infer TError }
      ? UseSuspenseQueryOptionsForUseSuspenseQueries<TQueryFnData, TError>
      : T extends { data: infer TData; error?: infer TError }
        ? UseSuspenseQueryOptionsForUseSuspenseQueries<unknown, TError, TData>
        : // Part 2: responsible for applying explicit type parameter to function arguments, if tuple [TQueryFnData, TError, TData]
          T extends [infer TQueryFnData, infer TError, infer TData]
          ? UseSuspenseQueryOptionsForUseSuspenseQueries<
              TQueryFnData,
              TError,
              TData
            >
          : T extends [infer TQueryFnData, infer TError]
            ? UseSuspenseQueryOptionsForUseSuspenseQueries<TQueryFnData, TError>
            : T extends [infer TQueryFnData]
              ? UseSuspenseQueryOptionsForUseSuspenseQueries<TQueryFnData>
              : // Part 3: responsible for inferring and enforcing type if no explicit parameter was provided
                T extends {
                    queryFn?:
                      | QueryFunction<infer TQueryFnData, infer TQueryKey>
                      | SkipTokenForUseQueries
                    select?: (data: any) => infer TData
                    throwOnError?: ThrowOnError<any, infer TError, any, any>
                  }
                ? UseSuspenseQueryOptionsForUseSuspenseQueries<
                    TQueryFnData,
                    TError,
                    TData,
                    TQueryKey
                  >
                : T extends {
                      queryFn?:
                        | QueryFunction<infer TQueryFnData, infer TQueryKey>
                        | SkipTokenForUseQueries
                      throwOnError?: ThrowOnError<any, infer TError, any, any>
                    }
                  ? UseSuspenseQueryOptionsForUseSuspenseQueries<
                      TQueryFnData,
                      TError,
                      TQueryFnData,
                      TQueryKey
                    >
                  : // Fallback
                    UseSuspenseQueryOptionsForUseSuspenseQueries

type GetUseSuspenseQueryResult<T> =
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
                    queryFn?:
                      | QueryFunction<infer TQueryFnData, any>
                      | SkipTokenForUseQueries
                    select?: (data: any) => infer TData
                    throwOnError?: ThrowOnError<any, infer TError, any, any>
                  }
                ? UseSuspenseQueryResult<
                    unknown extends TData ? TQueryFnData : TData,
                    unknown extends TError ? DefaultError : TError
                  >
                : T extends {
                      queryFn?:
                        | QueryFunction<infer TQueryFnData, any>
                        | SkipTokenForUseQueries
                      throwOnError?: ThrowOnError<any, infer TError, any, any>
                    }
                  ? UseSuspenseQueryResult<
                      TQueryFnData,
                      unknown extends TError ? DefaultError : TError
                    >
                  : // Fallback
                    UseSuspenseQueryResult

/**
 * SuspenseQueriesOptions reducer recursively unwraps function arguments to infer/enforce type param
 */
export type SuspenseQueriesOptions<
  T extends Array<any>,
  TResults extends Array<any> = [],
  TDepth extends ReadonlyArray<number> = [],
> = TDepth['length'] extends MAXIMUM_DEPTH
  ? Array<UseSuspenseQueryOptionsForUseSuspenseQueries>
  : T extends []
    ? []
    : T extends [infer Head]
      ? [...TResults, GetUseSuspenseQueryOptions<Head>]
      : T extends [infer Head, ...infer Tails]
        ? SuspenseQueriesOptions<
            [...Tails],
            [...TResults, GetUseSuspenseQueryOptions<Head>],
            [...TDepth, 1]
          >
        : Array<unknown> extends T
          ? T
          : // If T is *some* array but we couldn't assign unknown[] to it, then it must hold some known/homogeneous type!
            // use this to infer the param types in the case of Array.map() argument
            T extends Array<
                UseSuspenseQueryOptionsForUseSuspenseQueries<
                  infer TQueryFnData,
                  infer TError,
                  infer TData,
                  infer TQueryKey
                >
              >
            ? Array<
                UseSuspenseQueryOptionsForUseSuspenseQueries<
                  TQueryFnData,
                  TError,
                  TData,
                  TQueryKey
                >
              >
            : // Fallback
              Array<UseSuspenseQueryOptionsForUseSuspenseQueries>

/**
 * SuspenseQueriesResults reducer recursively maps type param to results
 */
export type SuspenseQueriesResults<
  T extends Array<any>,
  TResults extends Array<any> = [],
  TDepth extends ReadonlyArray<number> = [],
> = TDepth['length'] extends MAXIMUM_DEPTH
  ? Array<UseSuspenseQueryResult>
  : T extends []
    ? []
    : T extends [infer Head]
      ? [...TResults, GetUseSuspenseQueryResult<Head>]
      : T extends [infer Head, ...infer Tails]
        ? SuspenseQueriesResults<
            [...Tails],
            [...TResults, GetUseSuspenseQueryResult<Head>],
            [...TDepth, 1]
          >
        : { [K in keyof T]: GetUseSuspenseQueryResult<T[K]> }

export function useSuspenseQueries<
  T extends Array<any>,
  TCombinedResult = SuspenseQueriesResults<T>,
>(
  options: {
    queries:
      | readonly [...SuspenseQueriesOptions<T>]
      | readonly [...{ [K in keyof T]: GetUseSuspenseQueryOptions<T[K]> }]
    combine?: (result: SuspenseQueriesResults<T>) => TCombinedResult
  },
  queryClient?: QueryClient,
): TCombinedResult

export function useSuspenseQueries<
  T extends Array<any>,
  TCombinedResult = SuspenseQueriesResults<T>,
>(
  options: {
    queries: readonly [...SuspenseQueriesOptions<T>]
    combine?: (result: SuspenseQueriesResults<T>) => TCombinedResult
  },
  queryClient?: QueryClient,
): TCombinedResult

export function useSuspenseQueries(options: any, queryClient?: QueryClient) {
  return useQueries(
    {
      ...options,
      queries: options.queries.map((query: any) => {
        if (process.env.NODE_ENV !== 'production') {
          if (query.queryFn === skipToken) {
            console.error('skipToken is not allowed for useSuspenseQueries')
          }
        }

        return {
          ...query,
          suspense: true,
          throwOnError: defaultThrowOnError,
          enabled: true,
        }
      }),
    },
    queryClient,
  )
}
