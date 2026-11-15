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

/**
 * The default options a `QueryClient` applies to every query and mutation.
 * @template TError - The default type of errors thrown by queries and mutations using this `QueryClient`.
 */
export interface DefaultOptions<
  TError = DefaultError,
> extends CoreDefaultOptions<TError> {
  /**
   * Default options applied to every query, unless overridden per-query.
   */
  queries?: OmitKeyof<QueryObserverOptions<unknown, TError>, 'queryKey'>
}

/**
 * The config accepted by `new QueryClient(config)`, with Solid's {@link DefaultOptions}.
 */
export interface QueryClientConfig extends QueryCoreClientConfig {
  /**
   * The default options of the queries and mutations of this `QueryClient`.
   */
  defaultOptions?: DefaultOptions
}

/**
 * The core `@tanstack/query-core` `QueryClient`, typed with Solid's {@link QueryClientConfig}.
 */
export class QueryClient extends QueryCoreClient {
  constructor(config: QueryClientConfig = {}) {
    super(config)
  }
}
