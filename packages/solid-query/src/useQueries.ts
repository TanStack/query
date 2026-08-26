import { QueryObserver } from '@tanstack/query-core'
import { $TRACK, createMemo, repeat } from 'solid-js'
import { useBaseQuery } from './useBaseQuery'
import type { QueryOptions, UseQueryResult } from './types'
import type { Accessor } from 'solid-js'
import type { QueryClient } from './QueryClient'
import type {
  DefaultError,
  OmitKeyof,
  QueriesPlaceholderDataFunction,
  QueryFunction,
  QueryKey,
  ThrowOnError,
} from '@tanstack/query-core'

// This defines the `UseQueryOptions` that are accepted in `QueriesOptions` & `GetOptions`.
// `placeholderData` function does not have a parameter
type UseQueryOptionsForUseQueries<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = OmitKeyof<
  QueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  'placeholderData'
> & {
  placeholderData?: TQueryFnData | QueriesPlaceholderDataFunction<TQueryFnData>
  /**
   * @deprecated The `suspense` option has been removed. Suspense is the
   * model: each result's `data` is an async read that suspends into the
   * nearest `<Loading>` boundary while its first fetch is in flight, same
   * as `useQuery`. Setting `suspense` is a no-op.
   */
  suspense?: boolean
}

// Avoid TS depth-limit error in case of large array literal
type MAXIMUM_DEPTH = 20

// Widen the type of the symbol to enable type inference even if skipToken is not immutable.
type SkipTokenForUseQueries = symbol

type GetOptions<T> =
  // Part 1: responsible for applying explicit type parameter to function arguments, if object { queryFnData: TQueryFnData, error: TError, data: TData }
  T extends {
    queryFnData: infer TQueryFnData
    error?: infer TError
    data: infer TData
  }
    ? UseQueryOptionsForUseQueries<TQueryFnData, TError, TData>
    : T extends { queryFnData: infer TQueryFnData; error?: infer TError }
      ? UseQueryOptionsForUseQueries<TQueryFnData, TError>
      : T extends { data: infer TData; error?: infer TError }
        ? UseQueryOptionsForUseQueries<unknown, TError, TData>
        : // Part 2: responsible for applying explicit type parameter to function arguments, if tuple [TQueryFnData, TError, TData]
          T extends [infer TQueryFnData, infer TError, infer TData]
          ? UseQueryOptionsForUseQueries<TQueryFnData, TError, TData>
          : T extends [infer TQueryFnData, infer TError]
            ? UseQueryOptionsForUseQueries<TQueryFnData, TError>
            : T extends [infer TQueryFnData]
              ? UseQueryOptionsForUseQueries<TQueryFnData>
              : // Part 3: responsible for inferring and enforcing type if no explicit parameter was provided
                T extends {
                    queryFn?:
                      | QueryFunction<infer TQueryFnData, infer TQueryKey>
                      | SkipTokenForUseQueries
                    select?: (data: any) => infer TData
                    throwOnError?: ThrowOnError<any, infer TError, any, any>
                  }
                ? UseQueryOptionsForUseQueries<
                    TQueryFnData,
                    unknown extends TError ? DefaultError : TError,
                    unknown extends TData ? TQueryFnData : TData,
                    TQueryKey
                  >
                : // Fallback
                  UseQueryOptionsForUseQueries

type GetResults<T> =
  // Part 1: responsible for mapping explicit type parameter to function result, if object
  T extends { queryFnData: any; error?: infer TError; data: infer TData }
    ? UseQueryResult<TData, TError>
    : T extends { queryFnData: infer TQueryFnData; error?: infer TError }
      ? UseQueryResult<TQueryFnData, TError>
      : T extends { data: infer TData; error?: infer TError }
        ? UseQueryResult<TData, TError>
        : // Part 2: responsible for mapping explicit type parameter to function result, if tuple
          T extends [any, infer TError, infer TData]
          ? UseQueryResult<TData, TError>
          : T extends [infer TQueryFnData, infer TError]
            ? UseQueryResult<TQueryFnData, TError>
            : T extends [infer TQueryFnData]
              ? UseQueryResult<TQueryFnData>
              : // Part 3: responsible for mapping inferred type to results, if no explicit parameter was provided
                T extends {
                    queryFn?:
                      | QueryFunction<infer TQueryFnData, any>
                      | SkipTokenForUseQueries
                    select?: (data: any) => infer TData
                    throwOnError?: ThrowOnError<any, infer TError, any, any>
                  }
                ? UseQueryResult<
                    unknown extends TData ? TQueryFnData : TData,
                    unknown extends TError ? DefaultError : TError
                  >
                : // Fallback
                  UseQueryResult

/**
 * QueriesOptions reducer recursively snapshots function arguments to infer/enforce type param
 */
type QueriesOptions<
  T extends Array<any>,
  TResult extends Array<any> = [],
  TDepth extends ReadonlyArray<number> = [],
> = TDepth['length'] extends MAXIMUM_DEPTH
  ? Array<UseQueryOptionsForUseQueries>
  : T extends []
    ? []
    : T extends [infer Head]
      ? [...TResult, GetOptions<Head>]
      : T extends [infer Head, ...infer Tail]
        ? QueriesOptions<
            [...Tail],
            [...TResult, GetOptions<Head>],
            [...TDepth, 1]
          >
        : ReadonlyArray<unknown> extends T
          ? T
          : // If T is *some* array but we couldn't assign unknown[] to it, then it must hold some known/homogeneous type!
            // use this to infer the param types in the case of Array.map() argument
            T extends Array<
                UseQueryOptionsForUseQueries<
                  infer TQueryFnData,
                  infer TError,
                  infer TData,
                  infer TQueryKey
                >
              >
            ? Array<
                UseQueryOptionsForUseQueries<
                  TQueryFnData,
                  TError,
                  TData,
                  TQueryKey
                >
              >
            : // Fallback
              Array<UseQueryOptionsForUseQueries>

/**
 * QueriesResults reducer recursively maps type param to results
 */
type QueriesResults<
  T extends Array<any>,
  TResult extends Array<any> = [],
  TDepth extends ReadonlyArray<number> = [],
> = TDepth['length'] extends MAXIMUM_DEPTH
  ? Array<UseQueryResult>
  : T extends []
    ? []
    : T extends [infer Head]
      ? [...TResult, GetResults<Head>]
      : T extends [infer Head, ...infer Tail]
        ? QueriesResults<
            [...Tail],
            [...TResult, GetResults<Head>],
            [...TDepth, 1]
          >
        : { [K in keyof T]: GetResults<T[K]> }

export function useQueries<
  T extends Array<any>,
  TCombinedResult = QueriesResults<T>,
>(
  queriesOptions: Accessor<{
    queries:
      | readonly [...QueriesOptions<T>]
      | readonly [...{ [K in keyof T]: GetOptions<T[K]> }]
    combine?: (result: QueriesResults<T>) => TCombinedResult
  }>,
  queryClient?: Accessor<QueryClient>,
): TCombinedResult {
  /**
   * One read layer per position, count-keyed: each row owns a full
   * `useBaseQuery` (observer lifecycle, version signal, async data node)
   * whose options stay reactive through the per-index accessor — option
   * changes flow into the existing row without tearing it down, while
   * length changes create/dispose tail rows. Every result has identical
   * semantics to `useQuery`: reads suspend, settled data is non-nullable.
   */
  const length = createMemo(() => queriesOptions().queries.length)
  const results = repeat(length, (index) => {
    // When the array shrinks, cache events can reach this row's
    // subscriptions before disposal runs; the row keeps answering with its
    // last options rather than reading past the end of the shorter array.
    let lastOptions: any
    return useBaseQuery(
      () => {
        const next = queriesOptions().queries[index]
        if (next !== undefined) lastOptions = next
        return lastOptions
      },
      QueryObserver,
      queryClient,
    )
  })

  const combined = createMemo(() => {
    const combine = queriesOptions().combine
    const list = results() as unknown as QueriesResults<T>
    return combine
      ? combine(list)
      : (list as unknown as TCombinedResult)
  })

  // A stable facade over the combined result. Property reads pull through
  // the memo so consumers track exactly what they touch; $TRACK hands list
  // helpers (<For>, mapArray) the underlying array for diffing.
  return new Proxy([] as unknown as TCombinedResult & object, {
    get(_, prop) {
      if (prop === $TRACK) return combined()
      return Reflect.get(combined() as object, prop)
    },
    has(_, prop) {
      if (prop === $TRACK) return true
      return Reflect.has(combined() as object, prop)
    },
    ownKeys() {
      return Reflect.ownKeys(combined() as object)
    },
    getOwnPropertyDescriptor(_, prop) {
      const descriptor = Reflect.getOwnPropertyDescriptor(
        combined() as object,
        prop,
      )
      if (descriptor) descriptor.configurable = true
      return descriptor
    },
  }) as TCombinedResult
}
