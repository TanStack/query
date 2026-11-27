import type {
  DefaultError,
  InfiniteData,
  InfiniteQueryPageParamsOptions,
  OmitKeyof,
  QueryKey,
  QueryMeta,
  StaleTime,
  WithRequired,
} from '@tanstack/query-core'
import type * as Core from '@tanstack/query-core'
import type {
  DefaultQueryFn,
  QueryTypeFilter,
  SkipToken,
} from '@tanstack/query-core/primitives'
import type * as CorePrimitives from '@tanstack/query-core/primitives'
import type { DehydrateOptions, HydrateOptions } from './hydration'
import type { MutationCache } from './mutationCache'
import type { placeholderData } from './placeholderData'
import type { Select } from './projectionTypes'
import type { Query } from './query'
import type { QueryCache } from './queryCache'
import type { QueryClient } from './queryClient'
import type { RefetchInterval } from './refetchInterval'
import type { SerialScope } from './serialScope'
import type { QueryFilters } from './utils'

/** @inline */
export type QueryFunction<
  T = unknown,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> = (context: QueryFunctionContext<TQueryKey, TPageParam>) => T | Promise<T>

/** @inline */
export type StaleTimeFunction<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> =
  | StaleTime
  | ((query: Query<TQueryFnData, TError, TData, TQueryKey>) => StaleTime)

/** @inline */
export type QueryBooleanOption<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> =
  | boolean
  | ((query: Query<TQueryFnData, TError, TData, TQueryKey>) => boolean)

/** @inline */
export type QueryPersister<
  T = unknown,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> = [TPageParam] extends [never]
  ? (
      queryFn: QueryFunction<T, TQueryKey, never>,
      context: QueryFunctionContext<TQueryKey>,
      query: Query,
    ) => T | Promise<T>
  : (
      queryFn: QueryFunction<T, TQueryKey, TPageParam>,
      context: QueryFunctionContext<TQueryKey>,
      query: Query,
    ) => T | Promise<T>

/**
 * The object passed to `queryFn`: the `QueryClient`, the `queryKey`, an `AbortSignal` that aborts
 * when the query is cancelled, the query's `meta`, and for infinite queries the `pageParam` of the
 * page being fetched.
 */
export type QueryFunctionContext<
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> = [TPageParam] extends [never]
  ? {
      client: QueryClient
      queryKey: TQueryKey
      signal: AbortSignal
      meta: QueryMeta | undefined
      pageParam?: unknown
    }
  : {
      client: QueryClient
      queryKey: TQueryKey
      signal: AbortSignal
      meta: QueryMeta | undefined
      pageParam: TPageParam
    }

/** @inline */
export type PlaceholderDataFunction<
  TQueryFnData = unknown,
  TError = DefaultError,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = (
  previousData: TQueryData | undefined,
  previousQuery: Query<TQueryFnData, TError, TQueryData, TQueryKey> | undefined,
) => TQueryData | undefined

/** Query cache options. The query function and persister receive this adapter’s client. */
export interface QueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> extends Omit<
  Core.QueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
  'queryFn' | 'persister'
> {
  /**
   * The function that the query will use to request data.
   * Pass `defaultQueryFn` to use the function configured in the client's query defaults.
   * Pass `skipToken` to disable a query without a function where supported.
   * Receives a {@link QueryFunctionContext}.
   * Must return a promise that will either resolve data or throw an error. The data cannot be `undefined`.
   */
  queryFn?:
    | QueryFunction<TQueryFnData, TQueryKey, TPageParam>
    | SkipToken
    | DefaultQueryFn
  /**
   * This option can be used to persist the result of a query to an external storage, bypassing the need to actually
   * call the `queryFn`. Useful for persisting a query's data across e.g. server/client boundaries.
   */
  persister?: QueryPersister<TQueryFnData, NoInfer<TQueryKey>, TPageParam>
}

/** @inline */
export type ThrowOnError<
  TQueryFnData,
  TError,
  TQueryData,
  TQueryKey extends QueryKey,
> =
  | boolean
  | ((
      error: TError,
      query: Query<TQueryFnData, TError, TQueryData, TQueryKey>,
    ) => boolean)

/** Shared observer options, including opt-in selection, placeholder data, and polling. */
export interface QueryObserverOptionsBase<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
>
  extends
    WithRequired<
      QueryOptions<TQueryFnData, TError, TQueryData, TQueryKey, TPageParam>,
      'queryKey'
    >,
    Pick<
      CorePrimitives.QueryObserverOptionsBase<
        TQueryFnData,
        TError,
        TData,
        TQueryData,
        TQueryKey,
        TPageParam
      >,
      | 'refetchIntervalInBackground'
      | 'notifyOnChangeProps'
      | 'suspense'
      | '_optimisticResults'
    > {
  /**
   * Set this to `false` or a function that returns `false` to disable automatic refetching when the query mounts or changes query keys.
   * To refetch the query, use the `refetch` method returned from the `useQuery` instance.
   * Accepts a boolean or function that returns a boolean.
   * @defaultValue true
   */
  enabled?: QueryBooleanOption<TQueryFnData, TError, TQueryData, TQueryKey>
  /**
   * The time in milliseconds after data is considered stale.
   * If set to `Infinity`, the data will never be considered stale.
   * If set to `'static'`, the data will never be considered stale.
   * If set to a function, the function will be executed with the query to compute a `staleTime`.
   * @defaultValue 0
   */
  staleTime?: StaleTimeFunction<TQueryFnData, TError, TQueryData, TQueryKey>
  /** Set refetchInterval(milliseconds) or return it from a callback to poll the query. */
  refetchInterval?:
    | false
    | RefetchInterval<Query<TQueryFnData, TError, TQueryData, TQueryKey>>
    | ((
        query: Query<TQueryFnData, TError, TQueryData, TQueryKey>,
      ) =>
        | false
        | undefined
        | RefetchInterval<Query<TQueryFnData, TError, TQueryData, TQueryKey>>)
  /**
   * If set to `true`, the query will refetch on window focus if the data is stale.
   * If set to `false`, the query will not refetch on window focus.
   * If set to `'always'`, the query will always refetch on window focus (except when `staleTime: 'static'` is used).
   * If set to a function, the function will be executed with the latest data and query to compute the value.
   * @defaultValue true
   */
  refetchOnWindowFocus?:
    | boolean
    | 'always'
    | ((
        query: Query<TQueryFnData, TError, TQueryData, TQueryKey>,
      ) => boolean | 'always')
  /**
   * If set to `true`, the query will refetch on reconnect if the data is stale.
   * If set to `false`, the query will not refetch on reconnect.
   * If set to `'always'`, the query will always refetch on reconnect (except when `staleTime: 'static'` is used).
   * If set to a function, the function will be executed with the latest data and query to compute the value.
   *
   * Defaults to `true` unless `networkMode` is `'always'`.
   */
  refetchOnReconnect?:
    | boolean
    | 'always'
    | ((
        query: Query<TQueryFnData, TError, TQueryData, TQueryKey>,
      ) => boolean | 'always')
  /**
   * If set to `true`, the query will refetch on mount if the data is stale.
   * If set to `false`, will disable additional instances of a query to trigger background refetch.
   * If set to `'always'`, the query will always refetch on mount (except when `staleTime: 'static'` is used).
   * If set to a function, the function will be executed with the latest data and query to compute the value
   * @defaultValue true
   */
  refetchOnMount?:
    | boolean
    | 'always'
    | ((
        query: Query<TQueryFnData, TError, TQueryData, TQueryKey>,
      ) => boolean | 'always')
  /**
   * If set to `false`, the query will not be retried on mount if it contains an error.
   * If set to a function, the function will be executed with the query to compute the value.
   * @defaultValue true
   */
  retryOnMount?: QueryBooleanOption<TQueryFnData, TError, TQueryData, TQueryKey>
  /**
   * Whether errors should be thrown instead of setting the `error` property.
   * If set to `true` or `suspense` is `true`, all errors will be thrown to the error boundary.
   * If set to `false` and `suspense` is `false`, errors are returned as state.
   * If set to a function, it will be passed the error and the query, and it should return a boolean indicating whether to show the error in an error boundary (`true`) or return the error as state (`false`).
   * @defaultValue false
   */
  throwOnError?: ThrowOnError<TQueryFnData, TError, TQueryData, TQueryKey>
  /** Pass [select, transform] to derive the data returned by this observer. */
  select?: Select<TQueryData, TData>
  /** Wrap a value or factory with placeholderData to display it while the query loads. */
  placeholderData?: readonly [
    feature: typeof placeholderData,
    value: PlaceholderValue<TQueryData, TError, TQueryKey>,
  ]
}

/**
 * The options of a `QueryObserver`, and of the hooks built on it like `useQuery`: the
 * {@link QueryOptions} of the query, plus options that control the observer, such as `enabled`,
 * `staleTime`, `refetchInterval`, `select`, and `placeholderData`.
 * Pass a `queryFn` or use `defaultQueryFn` to select the client defaults.
 */
export interface QueryObserverOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> extends WithRequired<
  QueryObserverOptionsBase<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey,
    TPageParam
  >,
  'queryFn'
> {}

/**
 * The {@link QueryObserverOptions} after `defaultQueryOptions` has applied the
 * defaults, so `throwOnError`, `refetchOnReconnect`, and `queryHash` are always set.
 */
export type DefaultedQueryObserverOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> = WithRequired<
  QueryObserverOptionsBase<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey,
    TPageParam
  >,
  'throwOnError' | 'refetchOnReconnect' | 'queryHash'
>

/**
 * The options of an `InfiniteQueryObserver`: {@link QueryObserverOptions} whose query data is
 * {@link InfiniteData}, plus the page param options.
 */
export interface InfiniteQueryObserverOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>
  extends
    QueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      InfiniteData<TQueryFnData, TPageParam>,
      TQueryKey,
      TPageParam
    >,
    InfiniteQueryPageParamsOptions<TQueryFnData, TPageParam> {}

/**
 * The {@link InfiniteQueryObserverOptions} after `defaultQueryOptions` has applied the
 * defaults, so `throwOnError`, `refetchOnReconnect`, and `queryHash` are always set.
 */
export type DefaultedInfiniteQueryObserverOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = DefaultedQueryObserverOptions<
  TQueryFnData,
  TError,
  TData,
  InfiniteData<TQueryFnData, TPageParam>,
  TQueryKey,
  TPageParam
> &
  InfiniteQueryPageParamsOptions<TQueryFnData, TPageParam>

/**
 * The options of `fetchQuery`: the {@link QueryOptions} of the query, plus a `staleTime`
 * that decides whether cached data is returned instead of fetching, and a `select` that only
 * transforms the value the call resolves with.
 */
export interface QueryExecuteOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
>
  extends
    WithRequired<
      QueryOptions<TQueryFnData, TError, TQueryData, TQueryKey, TPageParam>,
      'queryKey'
    >,
    Pick<
      Core.QueryExecuteOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryData,
        TQueryKey,
        TPageParam
      >,
      'initialPageParam'
    > {
  /** Pass [select, transform] to derive the resolved value while retaining the fetched data in the cache. */
  select?: Select<TQueryData, TData>
  /**
   * The time in milliseconds after data is considered stale.
   * If the data is fresh it will be returned from the cache.
   */
  staleTime?: StaleTimeFunction<TQueryFnData, TError, TQueryData, TQueryKey>
}

/**
 * The options of `fetchInfiniteQuery`. Extends {@link QueryExecuteOptions}
 * with `initialPageParam`, `getNextPageParam`, and the optional `pages` count.
 */
export type InfiniteQueryExecuteOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = Omit<
  QueryExecuteOptions<
    TQueryFnData,
    TError,
    TData,
    InfiniteData<TQueryFnData, TPageParam>,
    TQueryKey,
    TPageParam
  >,
  'initialPageParam'
> &
  InfiniteQueryFetchPageOptions<TQueryFnData, TPageParam>

/**
 * The filters of `invalidateQueries`: the {@link QueryFilters} that select the queries
 * to invalidate, plus `refetchType` to choose which of them are refetched.
 */
export interface InvalidateQueryFilters<
  TQueryKey extends QueryKey = QueryKey,
> extends QueryFilters<TQueryKey> {
  /**
   * Controls which of the matched (now-invalidated) queries are refetched in the background.
   *
   * - `'active'`: only queries with at least one active observer are refetched.
   * - `'inactive'`: only queries with no active observer are refetched.
   * - `'all'`: every matched query is refetched, active or not.
   * - `'none'`: no query is refetched; matched queries are only marked as invalidated.
   * @defaultValue 'active'
   */
  refetchType?: QueryTypeFilter | 'none'
}

/**
 * The filters of `refetchQueries`, which select the queries to refetch.
 */
export interface RefetchQueryFilters<
  TQueryKey extends QueryKey = QueryKey,
> extends QueryFilters<TQueryKey> {}

/**
 * The object passed to `mutationFn` and the mutation callbacks: the `QueryClient`, the mutation's
 * `meta`, and its `mutationKey`.
 */
export type MutationFunctionContext = Core.Override<
  Core.MutationFunctionContext,
  { client: QueryClient }
>

/** @inline */
export type MutationFunction<TData = unknown, TVariables = unknown> = (
  variables: TVariables,
  context: MutationFunctionContext,
) => Promise<TData>

/**
 * The options of a mutation: its `mutationFn`, `mutationKey`, callbacks, retries, `scope`, and so
 * on.
 */
export interface MutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> extends Omit<
  Core.MutationOptions<TData, TError, TVariables, TOnMutateResult>,
  'mutationFn' | 'onMutate' | 'onSuccess' | 'onError' | 'onSettled' | 'scope'
> {
  /**
   * The function that performs the asynchronous task this mutation runs.
   * Required, unless a default mutation function has been set for the matching `mutationKey` via
   * `setMutationDefaults`.
   * Receives the `variables` passed to `mutate`, and a {@link MutationFunctionContext} holding the
   * `QueryClient`, the `mutationKey` and `meta`.
   * Must return a promise that resolves the mutation's data.
   */
  mutationFn?: MutationFunction<TData, TVariables>
  /**
   * This function fires before the mutation function runs, and receives the same variables.
   * Useful for optimistic updates applied in the hope that the mutation succeeds.
   * The value it returns is passed to `onSuccess`, `onError` and `onSettled` as `onMutateResult`,
   * which is where an optimistic update is usually rolled back.
   * If a promise is returned, it is awaited before the mutation function runs.
   */
  onMutate?: (
    variables: TVariables,
    context: MutationFunctionContext,
  ) => Promise<TOnMutateResult> | TOnMutateResult
  /**
   * This function fires when the mutation succeeds, and is passed the mutation's result.
   * If a promise is returned, it is awaited before `onSettled` runs.
   */
  onSuccess?: (
    data: TData,
    variables: TVariables,
    onMutateResult: TOnMutateResult,
    context: MutationFunctionContext,
  ) => Promise<unknown> | unknown
  /**
   * This function fires when the mutation encounters an error, and is passed the error.
   * If a promise is returned, it is awaited before `onSettled` runs.
   */
  onError?: (
    error: TError,
    variables: TVariables,
    onMutateResult: TOnMutateResult | undefined,
    context: MutationFunctionContext,
  ) => Promise<unknown> | unknown
  /**
   * This function fires when the mutation either succeeds or errors, and is passed either the data
   * or the error.
   * If a promise is returned, it is awaited before the mutation settles.
   */
  onSettled?: (
    data: TData | undefined,
    error: TError | null,
    variables: TVariables,
    onMutateResult: TOnMutateResult | undefined,
    context: MutationFunctionContext,
  ) => Promise<unknown> | unknown
  /** Pass serialScope(id) to run mutations with this ID in order. */
  scope?: SerialScope
}

/**
 * The options of a `MutationObserver`, and of the hooks built on it like `useMutation`: the
 * {@link MutationOptions}, plus `throwOnError`.
 */
export interface MutationObserverOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>
  extends
    MutationOptions<TData, TError, TVariables, TOnMutateResult>,
    Pick<
      Core.MutationObserverOptions<TData, TError, TVariables, TOnMutateResult>,
      'throwOnError'
    > {}

/**
 * The callbacks that can be passed to `mutate` for a single call. They run after the callbacks of
 * the mutation options.
 */
export interface MutateOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> {
  /**
   * Called when the mutation of this call succeeds, after the `onSuccess` of the mutation options.
   */
  onSuccess?: (
    data: TData,
    variables: TVariables,
    onMutateResult: TOnMutateResult | undefined,
    context: MutationFunctionContext,
  ) => void
  /**
   * Called when the mutation of this call fails, after the `onError` of the mutation options.
   */
  onError?: (
    error: TError,
    variables: TVariables,
    onMutateResult: TOnMutateResult | undefined,
    context: MutationFunctionContext,
  ) => void
  /**
   * Called when the mutation of this call succeeds or fails, after the `onSettled` of the mutation
   * options.
   */
  onSettled?: (
    data: TData | undefined,
    error: TError | null,
    variables: TVariables,
    onMutateResult: TOnMutateResult | undefined,
    context: MutationFunctionContext,
  ) => void
}

/**
 * The parameters of {@link MutateFunction}: `variables`, optional when `TVariables` accepts
 * `undefined`, and the {@link MutateOptions} for that call.
 */
export type MutateFunctionRest<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = undefined extends TVariables
  ? [
      variables?: TVariables,
      options?: MutateOptions<TData, TError, TVariables, TOnMutateResult>,
    ]
  : [
      variables: TVariables,
      options?: MutateOptions<TData, TError, TVariables, TOnMutateResult>,
    ]

/**
 * The `mutate` function of a `MutationObserver`: runs the mutation with the given variables and
 * resolves with its data.
 */
export type MutateFunction<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = (
  ...rest: MutateFunctionRest<TData, TError, TVariables, TOnMutateResult>
) => Promise<TData>

type WithMutationFunction<TResult, TMutate> = Core.Override<
  TResult,
  { mutate: TMutate }
>

/**
 * The properties shared by every state of a mutation result, like `data`, `error`, `variables`,
 * `status`, the `is*` flags, `mutate`, and `reset`.
 */
export type MutationObserverBaseResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = WithMutationFunction<
  Core.MutationObserverBaseResult<TData, TError, TVariables, TOnMutateResult>,
  MutateFunction<TData, TError, TVariables, TOnMutateResult>
>

/**
 * The result of a `MutationObserver`, and of the hooks built on it like `useMutation`. Narrow it by
 * `status` or the `is*` flags to get the type of each state.
 */
export type MutationObserverResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = WithMutationFunction<
  Core.MutationObserverResult<TData, TError, TVariables, TOnMutateResult>,
  MutateFunction<TData, TError, TVariables, TOnMutateResult>
>

/**
 * A mutation result in the `idle` state: the mutation hasn't run yet, or was reset.
 */
export type MutationObserverIdleResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = Extract<
  MutationObserverResult<TData, TError, TVariables, TOnMutateResult>,
  { status: 'idle' }
>

/**
 * A mutation result in the `pending` state while the mutation runs.
 */
export type MutationObserverLoadingResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = Extract<
  MutationObserverResult<TData, TError, TVariables, TOnMutateResult>,
  { status: 'pending' }
>

/**
 * A mutation result in the `error` state after the mutation failed.
 */
export type MutationObserverErrorResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = Extract<
  MutationObserverResult<TData, TError, TVariables, TOnMutateResult>,
  { status: 'error' }
>

/**
 * A mutation result in the `success` state after the mutation succeeded.
 */
export type MutationObserverSuccessResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = Extract<
  MutationObserverResult<TData, TError, TVariables, TOnMutateResult>,
  { status: 'success' }
>

/** The caches and default options to use when creating a pluggable client. */
export interface QueryClientConfig {
  /** The query cache this client is connected to. A new `QueryCache` is created if not provided. */
  queryCache?: QueryCache
  /**
   * The mutation cache this client is connected to. A new `MutationCache` is created if not
   * provided.
   */
  mutationCache?: MutationCache
  /** Default options for all queries and mutations created through this client. */
  defaultOptions?: DefaultOptions
}

/**
 * The default options of a `QueryClient`, applied to every query (`queries`), mutation
 * (`mutations`), `hydrate`, and `dehydrate` call unless overridden.
 */
export interface DefaultOptions<TError = DefaultError> {
  /** Default options applied to every query, unless overridden per-query. */
  queries?: OmitKeyof<
    QueryObserverOptionsBase<unknown, TError>,
    'suspense' | 'queryKey'
  >
  /** Default options applied to every mutation, unless overridden per-mutation. */
  mutations?: MutationObserverOptions<unknown, TError, unknown, unknown>
  /** Default options used when hydrating queries and mutations; see {@link HydrateOptions}. */
  hydrate?: HydrateOptions['defaultOptions']
  /** Default options used when dehydrating the client's caches; see {@link DehydrateOptions}. */
  dehydrate?: DehydrateOptions
}

/** A raw placeholder value or the callback that supplies it for a query. */
export type PlaceholderValue<TQueryData, TError, TQueryKey extends QueryKey> =
  | NonFunctionGuard<TQueryData>
  | PlaceholderDataFunction<
      NonFunctionGuard<TQueryData>,
      TError,
      NonFunctionGuard<TQueryData>,
      TQueryKey
    >

type InfiniteQueryFetchPageOptions<TQueryFnData, TPageParam> = Pick<
  InfiniteQueryPageParamsOptions<TQueryFnData, TPageParam>,
  'initialPageParam' | 'getNextPageParam'
> & {
  /**
   * The number of pages to fetch. Defaults to the number of cached pages,
   * or one page if the cache has no pages.
   */
  pages?: number
}

// oxlint-disable-next-line typescript/no-unsafe-function-type -- excludes all callable and constructable values
type NonFunctionGuard<T> = T extends Function ? never : T

export {
  dataTagSymbol,
  dataTagErrorSymbol,
  unsetMarker,
} from '@tanstack/query-core/primitives'

export type {
  OmitKeyof,
  DefaultError,
  QueryKey,
  InferDataFromTag,
  InferErrorFromTag,
  StaleTime,
  CacheKeyConfig,
  InfiniteData,
  QueryMeta,
  InfiniteQueryPageParamsOptions,
  WithRequired,
  RefetchOptions,
  InvalidateOptions,
  ResetOptions,
  FetchNextPageOptions,
  FetchPreviousPageOptions,
  QueryObserverBaseResult,
  QueryObserverResult,
  InfiniteQueryObserverBaseResult,
  InfiniteQueryObserverResult,
  MutationKey,
  MutationMeta,
  CancelOptions,
  SetDataOptions,
} from '@tanstack/query-core'
