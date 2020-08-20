import {
  PaginatedQueryConfig,
  PaginatedQueryResult,
  QueryFunction,
  QueryKey,
  TypedQueryFunction,
  TypedQueryFunctionArgs,
} from '../core/types'
import { getQueryArgs } from '../core/utils'
import { useBaseQuery } from './useBaseQuery'

// A paginated query is more like a "lag" query, which means
// as the query key changes, we keep the results from the
// last query and use them as placeholder data in the next one
// We DON'T use it as initial data though. That's important

// TYPES

export interface UsePaginatedQueryObjectConfig<TResult, TError> {
  queryKey: QueryKey
  queryFn?: QueryFunction<TResult>
  config?: PaginatedQueryConfig<TResult, TError>
}

// HOOK

// Parameter syntax with optional config
export function usePaginatedQuery<TResult = unknown, TError = unknown>(
  queryKey: QueryKey,
  queryConfig?: PaginatedQueryConfig<TResult, TError>
): PaginatedQueryResult<TResult, TError>

// Parameter syntax with query function and optional config
export function usePaginatedQuery<
  TResult,
  TError,
  TArgs extends TypedQueryFunctionArgs
>(
  queryKey: QueryKey,
  queryFn: TypedQueryFunction<TResult, TArgs>,
  queryConfig?: PaginatedQueryConfig<TResult, TError>
): PaginatedQueryResult<TResult, TError>

export function usePaginatedQuery<TResult = unknown, TError = unknown>(
  queryKey: QueryKey,
  queryFn: QueryFunction<TResult>,
  queryConfig?: PaginatedQueryConfig<TResult, TError>
): PaginatedQueryResult<TResult, TError>

// Object syntax
export function usePaginatedQuery<TResult = unknown, TError = unknown>(
  config: UsePaginatedQueryObjectConfig<TResult, TError>
): PaginatedQueryResult<TResult, TError>

// Implementation
export function usePaginatedQuery<TResult, TError>(
  ...args: any[]
): PaginatedQueryResult<TResult, TError> {
  const config = getQueryArgs<TResult, TError>(args)[1]
  const result = useBaseQuery<TResult, TError>({
    ...config,
    keepPreviousData: true,
  })
  return {
    ...result,
    resolvedData: result.data,
    latestData:
      result.query.state.data === result.data ? result.data : undefined,
  }
}
