import React from 'react'

import { useBaseQuery } from './useBaseQuery'
import { handleSuspense } from './utils'
import {
  InfiniteQueryConfig,
  InfiniteQueryResult,
  QueryKey,
  QueryKeyWithoutArray,
  QueryKeyWithoutObject,
  QueryKeyWithoutObjectAndArray,
  TupleQueryFunction,
  TupleQueryKey,
} from '../core/types'
import { useQueryArgs } from './useQueryArgs'

// TYPES

export interface UseInfiniteQueryObjectConfig<
  TResult,
  TError,
  TKey extends TupleQueryKey
> {
  queryKey: QueryKey
  queryFn?: TupleQueryFunction<TResult, TKey>
  config?: InfiniteQueryConfig<TResult, TError>
}

// HOOK

// Parameter syntax with optional config
export function useInfiniteQuery<
  TResult,
  TError,
  TKey extends QueryKeyWithoutObject
>(
  queryKey: TKey,
  queryConfig?: InfiniteQueryConfig<TResult, TError>
): InfiniteQueryResult<TResult, TError>

// Parameter syntax with query function and optional config
export function useInfiniteQuery<
  TResult,
  TError,
  TKey extends QueryKeyWithoutObjectAndArray
>(
  queryKey: TKey,
  queryFn: TupleQueryFunction<TResult, [TKey]>,
  queryConfig?: InfiniteQueryConfig<TResult, TError>
): InfiniteQueryResult<TResult, TError>

export function useInfiniteQuery<TResult, TError, TKey extends TupleQueryKey>(
  queryKey: TKey,
  queryFn: TupleQueryFunction<TResult, TKey>,
  queryConfig?: InfiniteQueryConfig<TResult, TError>
): InfiniteQueryResult<TResult, TError>

// Object syntax
export function useInfiniteQuery<
  TResult,
  TError,
  TKey extends QueryKeyWithoutArray
>(
  config: UseInfiniteQueryObjectConfig<TResult, TError, [TKey]>
): InfiniteQueryResult<TResult, TError>

export function useInfiniteQuery<TResult, TError, TKey extends TupleQueryKey>(
  config: UseInfiniteQueryObjectConfig<TResult, TError, TKey>
): InfiniteQueryResult<TResult, TError>

// Implementation
export function useInfiniteQuery<TResult, TError>(
  ...args: any[]
): InfiniteQueryResult<TResult, TError> {
  const [queryKey, config] = useQueryArgs<TResult[], TError>(args)

  config.infinite = true

  const result = useBaseQuery<TResult[], TError>(queryKey, config)
  const query = result.query
  const state = result.query.state

  handleSuspense(config, result)

  const fetchMore = React.useMemo(() => query.fetchMore.bind(query), [query])

  return {
    ...result,
    data: state.data,
    canFetchMore: state.canFetchMore,
    fetchMore,
    isFetching: state.isFetching,
    isFetchingMore: state.isFetchingMore,
  }
}
