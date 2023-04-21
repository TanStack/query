import type {
  QueryObserver,
  QueryKey,
  DefaultError,
  InfiniteData,
} from '@tanstack/query-core'
import type { QueryClient } from './QueryClient'
import { InfiniteQueryObserver } from '@tanstack/query-core'
import type {
  CreateInfiniteQueryOptions,
  CreateInfiniteQueryResult,
} from './types'
import { createBaseQuery } from './createBaseQuery'
import { createMemo } from 'solid-js'
import type { Accessor } from 'solid-js'

export function createInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: CreateInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  queryClient?: Accessor<QueryClient>,
): CreateInfiniteQueryResult<TData, TError> {
  return createBaseQuery(
    createMemo(() => options()),
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    InfiniteQueryObserver as typeof QueryObserver,
    queryClient,
  ) as CreateInfiniteQueryResult<TData, TError>
}
