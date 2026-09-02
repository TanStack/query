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
 * The core `QueryObserverOptions`, with Solid's `reconcile` option added.
 *
 * @template TQueryFnData - The type your `queryFn` resolves to.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TQueryData - The type of the data actually held in the query cache.
 * @template TQueryKey - The type of your `queryKey`.
 */
export interface QueryObserverOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> extends OmitKeyof<
  QueryCoreObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey,
    TPageParam
  >,
  'structuralSharing'
> {
  /**
   * Set this to a reconciliation key to enable reconciliation between query results.
   * Set this to `false` to disable reconciliation between query results.
   * Set this to a function which accepts the old and new data and returns resolved data of the same type to implement custom reconciliation logic.
   * Defaults reconciliation to false.
   */
  reconcile?:
    | string
    | false
    | ((oldData: TData | undefined, newData: TData) => TData)
}

/**
 * The core `InfiniteQueryObserverOptions`, with Solid's `reconcile` option added.
 *
 * @template TQueryFnData - The type of a single page, as your `queryFn` resolves it.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TQueryKey - The type of your `queryKey`.
 * @template TPageParam - The type of the parameter passed to `queryFn` to fetch a given page.
 */
export interface InfiniteQueryObserverOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> extends OmitKeyof<
  QueryCoreInfiniteQueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  'structuralSharing'
> {
  /**
   * Set this to a reconciliation key to enable reconciliation between query results.
   * Set this to `false` to disable reconciliation between query results.
   * Set this to a function which accepts the old and new data and returns resolved data of the same type to implement custom reconciliation logic.
   * Defaults reconciliation to false.
   */
  reconcile?:
    | string
    | false
    | ((oldData: TData | undefined, newData: TData) => TData)
}

/**
 * The default options a `QueryClient` applies to every query, with Solid's `reconcile` option added to
 * `queries`.
 *
 * @template TError - The default type of errors thrown by queries and mutations using this `QueryClient`.
 */
export interface DefaultOptions<
  TError = DefaultError,
> extends CoreDefaultOptions<TError> {
  queries?: OmitKeyof<QueryObserverOptions<unknown, TError>, 'queryKey'>
}

/**
 * The config accepted by `new QueryClient(config)`, with Solid's extended {@link DefaultOptions}.
 */
export interface QueryClientConfig extends QueryCoreClientConfig {
  defaultOptions?: DefaultOptions
}

/**
 * The core `@tanstack/query-core` `QueryClient`, typed so its `defaultOptions.queries` accepts Solid's
 * `reconcile` option.
 */
export class QueryClient extends QueryCoreClient {
  constructor(config: QueryClientConfig = {}) {
    super(config)
  }
}
