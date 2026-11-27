import type { RuntimeBinding } from './binding'
import type { QueryFunctionContext, QueryKey } from './types'

export type BaseStreamedQueryParams<
  TRuntime extends RuntimeBinding,
  TQueryFnData,
  TQueryKey extends QueryKey,
> = {
  /** Returns an `AsyncIterable` or a promise that resolves to one. */
  streamFn: (
    context: QueryFunctionContext<TRuntime, TQueryKey>,
  ) => AsyncIterable<TQueryFnData> | Promise<AsyncIterable<TQueryFnData>>
  /**
   * Defines how refetches are handled.
   * - `'reset'` (default): resets the query to its initial state before reading the stream.
   * - `'append'`: appends new data to the existing data.
   * - `'replace'`: writes all data to the cache once the stream ends.
   */
  refetchMode?: 'append' | 'reset' | 'replace'
}

export type SimpleStreamedQueryParams<
  TRuntime extends RuntimeBinding,
  TQueryFnData,
  TQueryKey extends QueryKey,
> = BaseStreamedQueryParams<TRuntime, TQueryFnData, TQueryKey> & {
  reducer?: never
  initialValue?: never
}

export type ReducibleStreamedQueryParams<
  TRuntime extends RuntimeBinding,
  TQueryFnData,
  TData,
  TQueryKey extends QueryKey,
> = BaseStreamedQueryParams<TRuntime, TQueryFnData, TQueryKey> & {
  /**
   * Combines the accumulated data with the next chunk. Provide `initialValue` with a custom reducer.
   */
  reducer: (acc: TData, chunk: TQueryFnData) => TData
  /**
   * The starting value for the reducer when there is no cached data or when
   * `refetchMode` is `'replace'` during a refetch.
   */
  initialValue: TData
}

export type StreamedQueryParams<
  TRuntime extends RuntimeBinding,
  TQueryFnData,
  TData,
  TQueryKey extends QueryKey,
> =
  | SimpleStreamedQueryParams<TRuntime, TQueryFnData, TQueryKey>
  | ReducibleStreamedQueryParams<TRuntime, TQueryFnData, TData, TQueryKey>
