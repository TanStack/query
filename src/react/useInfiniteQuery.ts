import {
  InfiniteQueryConfig,
  InfiniteQueryResult,
  QueryFunction,
  QueryKey,
  TypedQueryFunction,
  TypedQueryFunctionArgs,
} from '../core/types'
import { getQueryArgs } from '../core/utils'
import { useBaseQuery } from './useBaseQuery'

// TYPES

export interface UseInfiniteQueryObjectConfig<TResult, TError> {
  queryKey: QueryKey
  queryFn?: QueryFunction<TResult>
  config?: InfiniteQueryConfig<TResult, TError>
}

// HOOK

// Parameter syntax with optional config
export function useInfiniteQuery<TResult = unknown, TError = unknown>(
  queryKey: QueryKey,
  queryConfig?: InfiniteQueryConfig<TResult, TError>
): InfiniteQueryResult<TResult, TError>

// Parameter syntax with query function and optional config
export function useInfiniteQuery<
  TResult,
  TError,
  TArgs extends TypedQueryFunctionArgs
>(
  queryKey: QueryKey,
  queryFn: TypedQueryFunction<TResult, TArgs>,
  queryConfig?: InfiniteQueryConfig<TResult, TError>
): InfiniteQueryResult<TResult, TError>

export function useInfiniteQuery<TResult = unknown, TError = unknown>(
  queryKey: QueryKey,
  queryFn: QueryFunction<TResult>,
  queryConfig?: InfiniteQueryConfig<TResult, TError>
): InfiniteQueryResult<TResult, TError>

// Object syntax
export function useInfiniteQuery<TResult = unknown, TError = unknown>(
  config: UseInfiniteQueryObjectConfig<TResult, TError>
): InfiniteQueryResult<TResult, TError>

// Implementation
export function useInfiniteQuery<TResult, TError>(
  arg1: any,
  arg2?: any,
  arg3?: any
): InfiniteQueryResult<TResult, TError> {
  const [queryKey, config] = getQueryArgs<TResult[], TError>(arg1, arg2, arg3)
  return useBaseQuery(queryKey, { ...config, infinite: true })
}
