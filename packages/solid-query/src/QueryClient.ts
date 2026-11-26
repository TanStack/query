import { QueryClient as QueryCoreClient } from '@tanstack/query-core'
import type {
  DefaultOptions as CoreDefaultOptions,
  DefaultError,
  InfiniteData,
  MutationKey,
  OmitKeyof,
  QueryClientConfig as QueryCoreClientConfig,
  InfiniteQueryObserverOptions as QueryCoreInfiniteQueryObserverOptions,
  QueryObserverOptions as QueryCoreObserverOptions,
  QueryKey,
} from '@tanstack/query-core'
import type { MutationOptions, ThrowOnError } from './types'

/**
 * The core `QueryObserverOptions`, with Solid's `reconcile` option added.
 * @template TQueryFnData - The type your `queryFn` resolves to.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TQueryData - The type of the data actually held in the query cache.
 * @template TQueryKey - The type of your `queryKey`.
 * @template TPageParam - The type of the parameter passed to `queryFn` to fetch a given page, when this type
 * is shared with an infinite query's observer options. Defaults to `never` for regular queries.
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
  'structuralSharing' | 'suspense'
> {
  /**
   * A boolean or predicate that sends errors to the nearest error boundary.
   * This option is ignored when `notifyOnChangeProps` is `'none'`.
   * @defaultValue false
   */
  throwOnError?: ThrowOnError<TQueryFnData, TError, TQueryData, TQueryKey>
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
  'structuralSharing' | 'suspense'
> {
  /**
   * A boolean or predicate that sends errors to the nearest error boundary.
   * This option is ignored when `notifyOnChangeProps` is `'none'`.
   * @defaultValue false
   */
  throwOnError?: ThrowOnError<
    TQueryFnData,
    TError,
    InfiniteData<TQueryFnData, TPageParam>,
    TQueryKey
  >

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
 * @template TError - The default type of errors thrown by queries and mutations using this `QueryClient`.
 */
export interface DefaultOptions<
  TError = DefaultError,
> extends CoreDefaultOptions<TError> {
  /**
   * Default options applied to every query, unless overridden per-query, including Solid's
   * `reconcile` option.
   */
  queries?: OmitKeyof<
    NonNullable<CoreDefaultOptions<TError>['queries']>,
    'structuralSharing'
  > &
    Pick<QueryObserverOptions<unknown, TError>, 'reconcile' | 'throwOnError'>
  /** Default mutation options, including whether to throw errors to an error boundary. */
  mutations?: CoreDefaultOptions<TError>['mutations'] &
    Pick<MutationOptions<unknown, TError, unknown>, 'throwOnError'>
}

/**
 * The config accepted by `new QueryClient(config)`, with Solid's extended {@link DefaultOptions}.
 */
export interface QueryClientConfig extends QueryCoreClientConfig {
  /**
   * The default options of the queries and mutations of this `QueryClient`.
   */
  defaultOptions?: DefaultOptions
}

/**
 * The core `@tanstack/query-core` `QueryClient`, typed so its `defaultOptions.queries` accepts Solid's
 * `reconcile` option.
 */
export class QueryClient extends QueryCoreClient {
  declare getDefaultOptions: () => DefaultOptions
  declare setDefaultOptions: (options: DefaultOptions) => void
  declare getQueryDefaults: (
    queryKey: QueryKey,
  ) => ReturnType<QueryCoreClient['getQueryDefaults']> &
    Pick<QueryObserverOptions<any, any, any, any>, 'throwOnError'>
  declare getMutationDefaults: (
    mutationKey: MutationKey,
  ) => ReturnType<QueryCoreClient['getMutationDefaults']> &
    Pick<MutationOptions<any, any, any, any>, 'throwOnError'>
  declare setQueryDefaults: <
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryData = TQueryFnData,
  >(
    queryKey: QueryKey,
    options: Partial<
      Omit<
        QueryObserverOptions<TQueryFnData, TError, TData, TQueryData>,
        'queryKey' | 'reconcile'
      >
    >,
  ) => void
  declare setMutationDefaults: <
    TData = unknown,
    TError = DefaultError,
    TVariables = void,
    TOnMutateResult = unknown,
  >(
    mutationKey: MutationKey,
    options: Omit<
      MutationOptions<TData, TError, TVariables, TOnMutateResult>,
      'mutationKey'
    >,
  ) => void

  constructor(config: QueryClientConfig = {}) {
    super(config)
  }
}
