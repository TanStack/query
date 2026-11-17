import type {
  DefaultError,
  DefinedQueryObserverResult,
  OmitKeyof,
  QueriesPlaceholderDataFunction,
  QueryFunction,
  QueryKey,
  QueryObserverResult,
  dataTagErrorSymbol,
} from '@tanstack/query-core'
import type {
  CreateQueryOptions,
  CreateQueryResult,
  DefinedCreateQueryResult,
} from './types'

type QueryObserverOptionsForCreateQueries<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = OmitKeyof<
  CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  'placeholderData'
> & {
  placeholderData?: TQueryFnData | QueriesPlaceholderDataFunction<TQueryFnData>
}

type QueryError<T> = T extends {
  queryKey: { [dataTagErrorSymbol]: infer TError }
}
  ? TError
  : T extends CreateQueryOptions<any, infer TError, any, any>
    ? unknown extends TError
      ? DefaultError
      : TError
    : DefaultError

type MAXIMUM_DEPTH = 20
type SkipTokenForCreateQueries = symbol

type GetCreateQueryOptionsForCreateQueries<T> = T extends {
  queryFnData: infer TQueryFnData
  error?: infer TError
  data: infer TData
}
  ? QueryObserverOptionsForCreateQueries<TQueryFnData, TError, TData>
  : T extends { queryFnData: infer TQueryFnData; error?: infer TError }
    ? QueryObserverOptionsForCreateQueries<TQueryFnData, TError>
    : T extends { data: infer TData; error?: infer TError }
      ? QueryObserverOptionsForCreateQueries<unknown, TError, TData>
      : T extends [infer TQueryFnData, infer TError, infer TData]
        ? QueryObserverOptionsForCreateQueries<TQueryFnData, TError, TData>
        : T extends [infer TQueryFnData, infer TError]
          ? QueryObserverOptionsForCreateQueries<TQueryFnData, TError>
          : T extends [infer TQueryFnData]
            ? QueryObserverOptionsForCreateQueries<TQueryFnData>
            : T extends {
                  queryFn?:
                    | QueryFunction<infer TQueryFnData, infer TQueryKey>
                    | SkipTokenForCreateQueries
                  select?: (data: any) => infer TData
                }
              ? QueryObserverOptionsForCreateQueries<
                  TQueryFnData,
                  QueryError<T>,
                  unknown extends TData ? TQueryFnData : TData,
                  TQueryKey
                >
              : QueryObserverOptionsForCreateQueries

type IsDefinedInitialData<T, TData> = T extends TData
  ? true
  : T extends () => infer TValue
    ? unknown extends TValue
      ? false
      : TValue extends TData
        ? true
        : false
    : false

type GenericGetDefinedOrUndefinedQueryResult<T, TData, TUndefined, TDefined> =
  T extends { initialData?: infer TInitialData }
    ? unknown extends TInitialData
      ? TUndefined
      : IsDefinedInitialData<TInitialData, TData> extends true
        ? TDefined
        : TUndefined
    : TUndefined

type InferDataAndError<T> = T extends {
  queryFnData: any
  error?: infer TError
  data: infer TData
}
  ? { data: TData; error: TError }
  : T extends { queryFnData: infer TQueryFnData; error?: infer TError }
    ? { data: TQueryFnData; error: TError }
    : T extends { data: infer TData; error?: infer TError }
      ? { data: TData; error: TError }
      : T extends [any, infer TError, infer TData]
        ? { data: TData; error: TError }
        : T extends [infer TQueryFnData, infer TError]
          ? { data: TQueryFnData; error: TError }
          : T extends [infer TQueryFnData]
            ? { data: TQueryFnData; error: unknown }
            : T extends {
                  queryFn?:
                    | QueryFunction<infer TQueryFnData, any>
                    | SkipTokenForCreateQueries
                  select?: (data: any) => infer TData
                }
              ? {
                  data: unknown extends TData ? TQueryFnData : TData
                  error: QueryError<T>
                }
              : { data: unknown; error: DefaultError }

type GetCreateQueryResult<T> = GenericGetDefinedOrUndefinedQueryResult<
  T,
  InferDataAndError<T>['data'],
  CreateQueryResult<
    InferDataAndError<T>['data'],
    InferDataAndError<T>['error']
  >,
  DefinedCreateQueryResult<
    InferDataAndError<T>['data'],
    InferDataAndError<T>['error']
  >
>

type GetQueryObserverResult<T> = GenericGetDefinedOrUndefinedQueryResult<
  T,
  InferDataAndError<T>['data'],
  QueryObserverResult<
    InferDataAndError<T>['data'],
    InferDataAndError<T>['error']
  >,
  DefinedQueryObserverResult<
    InferDataAndError<T>['data'],
    InferDataAndError<T>['error']
  >
>

/**
 * The `queries` array accepted by `injectQueries`. Recursively unwraps each tuple element so every entry's
 * `queryFn`/`select` are inferred individually, up to 20 elements — past that, tuple
 * recursion falls back to a single homogeneous options type. An opaque array (e.g. `unknown[]`) is returned
 * as-is; a non-tuple array of a known element type is mapped to that element type instead, with no such
 * limit.
 * @template T - The type of the `queries` array as written at the call site.
 * @template TResults - The internal accumulator that this type builds during recursion. It is not meant to
 * be set explicitly.
 * @template TDepth - The internal recursion-depth counter, checked against the 20-element limit. It is not
 * meant to be set explicitly.
 */
export type QueriesOptions<
  T extends Array<any>,
  TResults extends Array<any> = [],
  TDepth extends ReadonlyArray<number> = [],
> = TDepth['length'] extends MAXIMUM_DEPTH
  ? Array<QueryObserverOptionsForCreateQueries>
  : T extends []
    ? []
    : T extends [infer Head]
      ? [...TResults, GetCreateQueryOptionsForCreateQueries<Head>]
      : T extends [infer Head, ...infer Tails]
        ? QueriesOptions<
            [...Tails],
            [...TResults, GetCreateQueryOptionsForCreateQueries<Head>],
            [...TDepth, 1]
          >
        : ReadonlyArray<unknown> extends T
          ? T
          : T extends Array<
                QueryObserverOptionsForCreateQueries<
                  infer TQueryFnData,
                  infer TError,
                  infer TData,
                  infer TQueryKey
                >
              >
            ? Array<
                QueryObserverOptionsForCreateQueries<
                  TQueryFnData,
                  TError,
                  TData,
                  TQueryKey
                >
              >
            : Array<QueryObserverOptionsForCreateQueries>

/**
 * The result type returned by `injectQueries`, when no `combine` is provided. Mirrors {@link QueriesOptions}:
 * each tuple element's result type is inferred individually, up to 20 elements — past that, tuple recursion
 * falls back to a single homogeneous {@link CreateQueryResult} type. A non-tuple array is mapped per-element
 * instead, with no such limit — every entry keeps its individually inferred type regardless of array length.
 * @template T - The type of the `queries` array, as inferred by {@link QueriesOptions}.
 * @template TResults - The internal accumulator that this type builds during recursion. It is not meant to
 * be set explicitly.
 * @template TDepth - The internal recursion-depth counter, checked against the 20-element limit. It is not
 * meant to be set explicitly.
 */
export type QueriesResults<
  T extends Array<any>,
  TResults extends Array<any> = [],
  TDepth extends ReadonlyArray<number> = [],
> = TDepth['length'] extends MAXIMUM_DEPTH
  ? Array<CreateQueryResult>
  : T extends []
    ? []
    : T extends [infer Head]
      ? [...TResults, GetCreateQueryResult<Head>]
      : T extends [infer Head, ...infer Tails]
        ? QueriesResults<
            [...Tails],
            [...TResults, GetCreateQueryResult<Head>],
            [...TDepth, 1]
          >
        : { [K in keyof T]: GetCreateQueryResult<T[K]> }

type RawQueriesResults<
  T extends Array<any>,
  TResults extends Array<any> = [],
  TDepth extends ReadonlyArray<number> = [],
> = TDepth['length'] extends MAXIMUM_DEPTH
  ? Array<QueryObserverResult>
  : T extends []
    ? []
    : T extends [infer Head]
      ? [...TResults, GetQueryObserverResult<Head>]
      : T extends [infer Head, ...infer Tails]
        ? RawQueriesResults<
            [...Tails],
            [...TResults, GetQueryObserverResult<Head>],
            [...TDepth, 1]
          >
        : { [K in keyof T]: GetQueryObserverResult<T[K]> }

/**
 * The options for `injectQueries`: the `queries` to run, and an optional `combine` function that
 * derives a single result from all the query results.
 */
export interface InjectQueriesOptions<
  T extends Array<any>,
  TCombinedResult = QueriesResults<T>,
> {
  /**
   * The array of query options to run, one query per element. Entries can be added, removed, or replaced
   * reactively.
   */
  queries:
    | readonly [...QueriesOptions<T>]
    | readonly [
        ...{ [K in keyof T]: GetCreateQueryOptionsForCreateQueries<T[K]> },
      ]
  /**
   * Combines the plain results of all the queries into a single value, which `injectQueries` returns
   * instead of the results array. The value is recomputed reactively.
   */
  combine?: (result: RawQueriesResults<T>) => TCombinedResult
}
