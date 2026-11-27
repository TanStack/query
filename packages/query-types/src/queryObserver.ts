import type { QueryOf, RuntimeBinding } from './binding'
import type { FetchOptions, QueryState } from './query'
import type {
  DefaultError,
  DefaultedQueryObserverOptions,
  QueryKey,
  QueryObserverOptions,
  QueryObserverResult,
  QueryOptions,
} from './types'

type QueryObserverListener<TData, TError> = (
  result: QueryObserverResult<TData, TError>,
) => void

interface ObserverFetchOptions extends FetchOptions {
  throwOnError?: boolean
}

/** A cached view of an observer for one set of render options. */
export interface QueryObserverResultReader<TResult> {
  /** Read the result, retaining its reference while all fields are unchanged. */
  getSnapshot: () => TResult
  /** Apply this reader's options and reusable computation state after commit. */
  commit: () => void
}

type ProjectionFailure<TError> = {
  error: TError
  errorUpdatedAt: number
}

/**
 * Selection and placeholder computation state shared by reads of the same result.
 * @internal
 */
export interface QueryObserverResultContext<
  TRuntime extends RuntimeBinding,
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey,
> {
  /** The memo key and failure of the most recent selection. */
  selection?: {
    key: {
      input: TQueryData
      select: (data: TQueryData) => TData
      structuralSharing: QueryOptions<
        TRuntime,
        TQueryFnData,
        TError,
        TQueryData,
        TQueryKey
      >['structuralSharing']
    }
    failure?: ProjectionFailure<TError>
  }
  /** The last successful selection, used if selection fails. */
  selected?: {
    data: TData
    query?: QueryOf<TRuntime, TQueryFnData, TError, TQueryData, TQueryKey>
  }
  /** The unselected placeholder or factory error. */
  placeholder?: {
    key: {
      placeholderData: QueryObserverOptions<
        TRuntime,
        TQueryFnData,
        TError,
        TData,
        TQueryData,
        TQueryKey
      >['placeholderData']
      structuralSharing: QueryOptions<
        TRuntime,
        TQueryFnData,
        TError,
        TQueryData,
        TQueryKey
      >['structuralSharing']
      previousQuery:
        | QueryOf<TRuntime, TQueryFnData, TError, TQueryData, TQueryKey>
        | undefined
      previousState: QueryState<TQueryData, TError> | undefined
      previousOptions:
        | QueryOptions<TRuntime, TQueryFnData, TError, TQueryData, TQueryKey>
        | undefined
    }
    sourceQuery?: QueryOf<TRuntime, TQueryFnData, TError, TQueryData, TQueryKey>
    input: TQueryData | undefined
    failure?: ProjectionFailure<TError>
  }
}

/**
 * Options supplied to an observer by a caller or already resolved by the client.
 * @internal
 */
export type ObserverOptionsInput<
  TRuntime extends RuntimeBinding,
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> =
  | QueryObserverOptions<
      TRuntime,
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    >
  | DefaultedQueryObserverOptions<
      TRuntime,
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    >

export type { QueryObserverListener, ObserverFetchOptions, ProjectionFailure }
