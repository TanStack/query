import { useBaseQuery } from './useBaseQuery'
import {
  PaginatedQueryConfig,
  PaginatedQueryResult,
  QueryKey,
  QueryKeyWithoutArray,
  QueryKeyWithoutObject,
  QueryKeyWithoutObjectAndArray,
  TupleQueryFunction,
  TupleQueryKey,
} from '../core/types'
import { useQueryArgs } from './useQueryArgs'

// A paginated query is more like a "lag" query, which means
// as the query key changes, we keep the results from the
// last query and use them as placeholder data in the next one
// We DON'T use it as initial data though. That's important

// TYPES

export interface UsePaginatedQueryObjectConfig<
  TResult,
  TError,
  TKey extends TupleQueryKey
> {
  queryKey: QueryKey
  queryFn?: TupleQueryFunction<TResult, TKey>
  config?: PaginatedQueryConfig<TResult, TError>
}

// HOOK

// Parameter syntax with optional config
export function usePaginatedQuery<
  TResult,
  TError,
  TKey extends QueryKeyWithoutObject
>(
  queryKey: TKey,
  queryConfig?: PaginatedQueryConfig<TResult, TError>
): PaginatedQueryResult<TResult, TError>

// Parameter syntax with query function and optional config
export function usePaginatedQuery<
  TResult,
  TError,
  TKey extends QueryKeyWithoutObjectAndArray
>(
  queryKey: TKey,
  queryFn: TupleQueryFunction<TResult, [TKey]>,
  queryConfig?: PaginatedQueryConfig<TResult, TError>
): PaginatedQueryResult<TResult, TError>

export function usePaginatedQuery<TResult, TError, TKey extends TupleQueryKey>(
  queryKey: TKey,
  queryFn: TupleQueryFunction<TResult, TKey>,
  queryConfig?: PaginatedQueryConfig<TResult, TError>
): PaginatedQueryResult<TResult, TError>

// Object syntax
export function usePaginatedQuery<
  TResult,
  TError,
  TKey extends QueryKeyWithoutArray
>(
  config: UsePaginatedQueryObjectConfig<TResult, TError, [TKey]>
): PaginatedQueryResult<TResult, TError>

export function usePaginatedQuery<TResult, TError, TKey extends TupleQueryKey>(
  config: UsePaginatedQueryObjectConfig<TResult, TError, TKey>
): PaginatedQueryResult<TResult, TError>

// Implementation
export function usePaginatedQuery<TResult, TError>(
  ...args: any[]
): PaginatedQueryResult<TResult, TError> {
  let config = useQueryArgs<TResult, TError>(args)[1]
  config = { ...config, keepPreviousData: true }
  const result = useBaseQuery<TResult, TError>(config)
  return {
    ...result,
    resolvedData: result.data,
    latestData:
      result.query.state.data === result.data ? result.data : undefined,
  }
}
