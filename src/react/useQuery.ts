import {
  QueryConfig,
  QueryFunction,
  QueryKey,
  QueryResult,
  TypedQueryFunction,
  TypedQueryFunctionArgs,
} from '../core/types'
import { getQueryArgs } from '../core/utils'
import { useBaseQuery } from './useBaseQuery'

// TYPES

export interface UseQueryObjectConfig<TResult, TError> {
  queryKey: QueryKey
  queryFn?: QueryFunction<TResult>
  config?: QueryConfig<TResult, TError>
}

// HOOK

// Parameter syntax with optional config
export function useQuery<TResult = unknown, TError = unknown>(
  queryKey: QueryKey,
  queryConfig?: QueryConfig<TResult, TError>
): QueryResult<TResult, TError>

// Parameter syntax with query function and optional config
export function useQuery<TResult, TError, TArgs extends TypedQueryFunctionArgs>(
  queryKey: QueryKey,
  queryFn: TypedQueryFunction<TResult, TArgs>,
  queryConfig?: QueryConfig<TResult, TError>
): QueryResult<TResult, TError>

export function useQuery<TResult = unknown, TError = unknown>(
  queryKey: QueryKey,
  queryFn: QueryFunction<TResult>,
  queryConfig?: QueryConfig<TResult, TError>
): QueryResult<TResult, TError>

// Object syntax
export function useQuery<TResult = unknown, TError = unknown>(
  config: UseQueryObjectConfig<TResult, TError>
): QueryResult<TResult, TError>

// Implementation
export function useQuery<TResult, TError>(
  ...args: any[]
): QueryResult<TResult, TError> {
  const config = getQueryArgs<TResult, TError>(args)[1]
  return useBaseQuery<TResult, TError>(config)
}
