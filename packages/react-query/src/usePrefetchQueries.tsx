import { useQueryClient } from './QueryClientProvider'

import type {
  FetchQueryOptions,
  QueryClient,
  QueryFunction,
  ThrowOnError,
} from '@tanstack/query-core'

// Avoid TS depth-limit error in case of large array literal
type MAXIMUM_DEPTH = 20

// Widen the type of the symbol to enable type inference even if skipToken is not immutable.
type SkipTokenForFetchQuery = symbol

type GetFetchQueryOptions<T> =
  // Part 1: responsible for applying explicit type parameter to function arguments, if object { queryFnData: TQueryFnData, error: TError, data: TData }
  T extends {
    queryFnData: infer TQueryFnData
    error?: infer TError
    data: infer TData
  }
    ? FetchQueryOptions<TQueryFnData, TError, TData>
    : T extends { queryFnData: infer TQueryFnData; error?: infer TError }
      ? FetchQueryOptions<TQueryFnData, TError>
      : T extends { data: infer TData; error?: infer TError }
        ? FetchQueryOptions<unknown, TError, TData>
        : // Part 2: responsible for applying explicit type parameter to function arguments, if tuple [TQueryFnData, TError, TData]
          T extends [infer TQueryFnData, infer TError, infer TData]
          ? FetchQueryOptions<TQueryFnData, TError, TData>
          : T extends [infer TQueryFnData, infer TError]
            ? FetchQueryOptions<TQueryFnData, TError>
            : T extends [infer TQueryFnData]
              ? FetchQueryOptions<TQueryFnData>
              : // Part 3: responsible for inferring and enforcing type if no explicit parameter was provided
                T extends {
                    queryFn?:
                      | QueryFunction<infer TQueryFnData, infer TQueryKey>
                      | SkipTokenForFetchQuery
                    select?: (data: any) => infer TData
                    throwOnError?: ThrowOnError<any, infer TError, any, any>
                  }
                ? FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>
                : T extends {
                      queryFn?:
                        | QueryFunction<infer TQueryFnData, infer TQueryKey>
                        | SkipTokenForFetchQuery
                      throwOnError?: ThrowOnError<any, infer TError, any, any>
                    }
                  ? FetchQueryOptions<
                      TQueryFnData,
                      TError,
                      TQueryFnData,
                      TQueryKey
                    >
                  : // Fallback
                    FetchQueryOptions

/**
 * PrefetchQueriesOptions reducer recursively unwraps function arguments to infer/enforce type param
 */
export type PrefetchQueriesOptions<
  T extends Array<any>,
  TResults extends Array<any> = [],
  TDepth extends ReadonlyArray<number> = [],
> = TDepth['length'] extends MAXIMUM_DEPTH
  ? Array<FetchQueryOptions>
  : T extends []
    ? []
    : T extends [infer Head]
      ? [...TResults, GetFetchQueryOptions<Head>]
      : T extends [infer Head, ...infer Tails]
        ? PrefetchQueriesOptions<
            [...Tails],
            [...TResults, GetFetchQueryOptions<Head>],
            [...TDepth, 1]
          >
        : Array<unknown> extends T
          ? T
          : // If T is *some* array but we couldn't assign unknown[] to it, then it must hold some known/homogenous type!
            // use this to infer the param types in the case of Array.map() argument
            T extends Array<
                FetchQueryOptions<
                  infer TQueryFnData,
                  infer TError,
                  infer TData,
                  infer TQueryKey
                >
              >
            ? Array<FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>>
            : // Fallback
              Array<FetchQueryOptions>

export function usePrefetchQueries<T extends Array<any>>(
  options: {
    queries:
      | readonly [...PrefetchQueriesOptions<T>]
      | readonly [...{ [K in keyof T]: GetFetchQueryOptions<T[K]> }]
  },
  queryClient?: QueryClient,
) {
  const client = useQueryClient(queryClient)
  const queries = options.queries as ReadonlyArray<FetchQueryOptions>

  for (const query of queries) {
    if (!client.getQueryState(query.queryKey)) {
      client.prefetchQuery(query)
    }
  }
}
