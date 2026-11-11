import type {
  DefaultError,
  OmitKeyof,
  QueriesPlaceholderDataFunction,
  QueryFunction,
  QueryKey,
  ThrowOnError,
} from '@tanstack/query-core'
import type {
  CreateQueryOptions,
  CreateQueryResult,
  DefinedCreateQueryResult,
} from './types.js'

// Ported from `svelte-query/src/createQueries.svelte.ts`, with Marko's result types.

// `placeholderData` functions always receive `undefined` inside `<queries>`.
// `subscribed` is an option of the tag, so it stays out of the per-query type.
type CreateQueryOptionsForCreateQueries<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = OmitKeyof<
  CreateQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  'placeholderData' | 'subscribed'
> & {
  placeholderData?: TQueryFnData | QueriesPlaceholderDataFunction<TQueryFnData>
}

// Avoid TS depth-limit errors with large array literals.
type MAXIMUM_DEPTH = 20

// Widen the symbol so inference works even when `skipToken` is not immutable.
type SkipTokenForCreateQueries = symbol

type GetCreateQueryOptionsForCreateQueries<T> = T extends {
  queryFnData: infer TQueryFnData
  error?: infer TError
  data: infer TData
}
  ? CreateQueryOptionsForCreateQueries<TQueryFnData, TError, TData>
  : T extends { queryFnData: infer TQueryFnData; error?: infer TError }
    ? CreateQueryOptionsForCreateQueries<TQueryFnData, TError>
    : T extends { data: infer TData; error?: infer TError }
      ? CreateQueryOptionsForCreateQueries<unknown, TError, TData>
      : T extends [infer TQueryFnData, infer TError, infer TData]
        ? CreateQueryOptionsForCreateQueries<TQueryFnData, TError, TData>
        : T extends [infer TQueryFnData, infer TError]
          ? CreateQueryOptionsForCreateQueries<TQueryFnData, TError>
          : T extends [infer TQueryFnData]
            ? CreateQueryOptionsForCreateQueries<TQueryFnData>
            : T extends {
                  queryFn?:
                    | QueryFunction<infer TQueryFnData, infer TQueryKey>
                    | SkipTokenForCreateQueries
                  select?: (data: any) => infer TData
                  throwOnError?: ThrowOnError<any, infer TError, any, any>
                }
              ? CreateQueryOptionsForCreateQueries<
                  TQueryFnData,
                  unknown extends TError ? DefaultError : TError,
                  unknown extends TData ? TQueryFnData : TData,
                  TQueryKey
                >
              : CreateQueryOptionsForCreateQueries

type GetDefinedOrUndefinedQueryResult<T, TData, TError = unknown> = T extends {
  initialData?: infer TInitialData
}
  ? unknown extends TInitialData
    ? CreateQueryResult<TData, TError>
    : TInitialData extends TData
      ? DefinedCreateQueryResult<TData, TError>
      : TInitialData extends () => infer TInitialDataResult
        ? unknown extends TInitialDataResult
          ? CreateQueryResult<TData, TError>
          : TInitialDataResult extends TData
            ? DefinedCreateQueryResult<TData, TError>
            : CreateQueryResult<TData, TError>
        : CreateQueryResult<TData, TError>
  : CreateQueryResult<TData, TError>

type GetCreateQueryResult<T> = T extends {
  queryFnData: any
  error?: infer TError
  data: infer TData
}
  ? GetDefinedOrUndefinedQueryResult<T, TData, TError>
  : T extends { queryFnData: infer TQueryFnData; error?: infer TError }
    ? GetDefinedOrUndefinedQueryResult<T, TQueryFnData, TError>
    : T extends { data: infer TData; error?: infer TError }
      ? GetDefinedOrUndefinedQueryResult<T, TData, TError>
      : T extends [any, infer TError, infer TData]
        ? GetDefinedOrUndefinedQueryResult<T, TData, TError>
        : T extends [infer TQueryFnData, infer TError]
          ? GetDefinedOrUndefinedQueryResult<T, TQueryFnData, TError>
          : T extends [infer TQueryFnData]
            ? GetDefinedOrUndefinedQueryResult<T, TQueryFnData>
            : T extends {
                  queryFn?:
                    | QueryFunction<infer TQueryFnData, any>
                    | SkipTokenForCreateQueries
                  select?: (data: any) => infer TData
                  throwOnError?: ThrowOnError<any, infer TError, any, any>
                }
              ? GetDefinedOrUndefinedQueryResult<
                  T,
                  unknown extends TData ? TQueryFnData : TData,
                  unknown extends TError ? DefaultError : TError
                >
              : CreateQueryResult

/** Infers and enforces the type of each entry of `queries`. */
export type QueriesOptions<
  T extends Array<any>,
  TResults extends Array<any> = [],
  TDepth extends ReadonlyArray<number> = [],
> = TDepth['length'] extends MAXIMUM_DEPTH
  ? Array<CreateQueryOptionsForCreateQueries>
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
                CreateQueryOptionsForCreateQueries<
                  infer TQueryFnData,
                  infer TError,
                  infer TData,
                  infer TQueryKey
                >
              >
            ? Array<
                CreateQueryOptionsForCreateQueries<
                  TQueryFnData,
                  TError,
                  TData,
                  TQueryKey
                >
              >
            : Array<CreateQueryOptionsForCreateQueries>

/** Maps each entry of `queries` to its result type. */
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

/** The options of `<queries>`: the queries to run and an optional `combine`. */
export interface CreateQueriesOptions<
  T extends Array<any>,
  TCombinedResult = QueriesResults<T>,
> {
  /**
   * The options of each query to run.
   */
  queries:
    | readonly [...QueriesOptions<T>]
    | readonly [
        ...{ [K in keyof T]: GetCreateQueryOptionsForCreateQueries<T[K]> },
      ]
  /**
   * Maps the results to one value. In Marko the value is serialized from the
   * server to the browser, so it must be serializable.
   */
  combine?: (result: QueriesResults<T>) => TCombinedResult
  /**
   * Set to `false` to stop observing the queries: the tag keeps its last
   * results and no fetch is triggered by it. One flag for the whole tag; it is
   * not accepted per query.
   */
  subscribed?: boolean
}

/**
 * What `<queries>` returns: one result per query, or `combine`'s return value
 * when `combine` is given.
 */
export type CreateQueriesResult<
  T extends Array<any>,
  TCombined = unknown,
> = unknown extends TCombined ? QueriesResults<T> : TCombined
