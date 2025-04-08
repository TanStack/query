import { InfiniteQueryObserver } from '@tanstack/query-core'
import { createBaseQuery } from './createBaseQuery.svelte.js'
import type {
  DefaultError,
  InfiniteData,
  QueryClient,
  QueryKey,
  QueryObserver,
} from '@tanstack/query-core'
import type {
  Accessor,
  CreateInfiniteQueryOptions,
  CreateInfiniteQueryResult,
} from './types.js'

export function createInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: Accessor<
    CreateInfiniteQueryOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryFnData,
      TQueryKey,
      TPageParam
    >
  >,
  queryClient?: Accessor<QueryClient>,
): CreateInfiniteQueryResult<TData, TError> {
  return createBaseQuery(
    options,
    InfiniteQueryObserver as typeof QueryObserver,
    queryClient,
  ) as CreateInfiniteQueryResult<TData, TError>
}
