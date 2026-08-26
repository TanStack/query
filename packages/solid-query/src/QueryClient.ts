import { QueryClient as QueryCoreClient } from '@tanstack/query-core'
import type {
  DefaultOptions as CoreDefaultOptions,
  DefaultError,
  OmitKeyof,
  QueryClientConfig as QueryCoreClientConfig,
  InfiniteQueryObserverOptions as QueryCoreInfiniteQueryObserverOptions,
  QueryObserverOptions as QueryCoreObserverOptions,
  QueryKey,
} from '@tanstack/query-core'

/**
 * Core observer options pass through unchanged. The old adapter omitted
 * `structuralSharing` and replaced it with a store-level `reconcile`
 * option; with reads derived directly from cache state, core's
 * cache-level structural sharing is exactly what keeps the data memo
 * referentially stable, so it is exposed again and `reconcile` is gone.
 */
export type QueryObserverOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> = QueryCoreObserverOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey,
  TPageParam
>

export type InfiniteQueryObserverOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = QueryCoreInfiniteQueryObserverOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
>

export interface DefaultOptions<
  TError = DefaultError,
> extends CoreDefaultOptions<TError> {
  queries?: OmitKeyof<QueryObserverOptions<unknown, TError>, 'queryKey'>
}

export interface QueryClientConfig extends QueryCoreClientConfig {
  defaultOptions?: DefaultOptions
}

export class QueryClient extends QueryCoreClient {
  constructor(config: QueryClientConfig = {}) {
    super(config)
  }
}
