import { useBaseQuery } from './useBaseQuery'
import {
  QueryConfig,
  QueryKey,
  QueryKeyWithoutArray,
  QueryKeyWithoutObject,
  QueryKeyWithoutObjectAndArray,
  QueryResult,
  TupleQueryFunction,
  TupleQueryKey,
} from '../core/types'
import { useQueryArgs } from './useQueryArgs'

// TYPES

export interface UseQueryObjectConfig<
  TResult,
  TError,
  TKey extends TupleQueryKey
> {
  queryKey: QueryKey
  queryFn?: TupleQueryFunction<TResult, [TKey]>
  config?: QueryConfig<TResult, TError>
}

// HOOK

// Parameter syntax with optional config
export function useQuery<TResult, TError, TKey extends QueryKeyWithoutObject>(
  queryKey: TKey,
  queryConfig?: QueryConfig<TResult, TError>
): QueryResult<TResult, TError>

// Parameter syntax with query function and optional config
export function useQuery<
  TResult,
  TError,
  TKey extends QueryKeyWithoutObjectAndArray
>(
  queryKey: TKey,
  queryFn: TupleQueryFunction<TResult, [TKey]>,
  queryConfig?: QueryConfig<TResult, TError>
): QueryResult<TResult, TError>

// Parameter syntax with query function and optional config
export function useQuery<TResult, TError, TKey extends TupleQueryKey>(
  queryKey: TKey,
  queryFn: TupleQueryFunction<TResult, TKey>,
  queryConfig?: QueryConfig<TResult, TError>
): QueryResult<TResult, TError>

// Object syntax
export function useQuery<TResult, TError, TKey extends QueryKeyWithoutArray>(
  config: UseQueryObjectConfig<TResult, TError, [TKey]>
): QueryResult<TResult, TError>

export function useQuery<TResult, TError, TKey extends TupleQueryKey>(
  config: UseQueryObjectConfig<TResult, TError, TKey>
): QueryResult<TResult, TError>

// Implementation
export function useQuery<TResult, TError>(
  ...args: any[]
): QueryResult<TResult, TError> {
  const config = useQueryArgs<TResult, TError>(args)[1]
  return useBaseQuery<TResult, TError>(config)
}
