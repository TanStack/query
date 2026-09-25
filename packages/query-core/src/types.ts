/* istanbul ignore file */

import type { QueryClient } from './queryClient'
import type { DehydrateOptions, HydrateOptions } from './hydration'
import type { MutationState } from './mutation'
import type { FetchDirection, Query, QueryBehavior } from './query'
import type { RetryDelayValue, RetryValue } from './retryer'
import type { QueryFilters, QueryTypeFilter, SkipToken } from './utils'
import type { QueryCache } from './queryCache'
import type { MutationCache } from './mutationCache'

export type NonUndefinedGuard<T> = T extends undefined ? never : T

export type DistributiveOmit<
  TObject,
  TKey extends keyof TObject,
> = TObject extends any ? Omit<TObject, TKey> : never

export type OmitKeyof<
  TObject,
  TKey extends TStrictly extends 'safely'
    ?
        | keyof TObject
        | (string & Record<never, never>)
        | (number & Record<never, never>)
        | (symbol & Record<never, never>)
    : keyof TObject,
  TStrictly extends 'strictly' | 'safely' = 'strictly',
> = Omit<TObject, TKey>

export type Override<TTargetA, TTargetB> = {
  [AKey in keyof TTargetA]: AKey extends keyof TTargetB
    ? TTargetB[AKey]
    : TTargetA[AKey]
}

/**
 * The interface to augment via declaration merging to override Query's default types repository-wide.
 * Each field it declares replaces the default of the matching type: `defaultError` for {@link DefaultError},
 * `queryKey` for {@link QueryKey}, `mutationKey` for {@link MutationKey}, `queryMeta` for {@link QueryMeta} and
 * `mutationMeta` for {@link MutationMeta}. Leave a field out to keep that type's default.
 * Augment the module you install — `@tanstack/react-query`, `@tanstack/vue-query`,
 * `@tanstack/solid-query`, `@tanstack/svelte-query`, `@tanstack/preact-query`,
 * `@tanstack/angular-query-experimental` or `@tanstack/lit-query`. Augmenting `@tanstack/query-core`
 * works too and covers every adapter at once.
 * @example
 * ```ts
 * // Use the module you installed — here, the React adapter.
 * declare module '@tanstack/react-query' {
 *   interface Register {
 *     defaultError: AxiosError
 *   }
 * }
 * ```
 */
export interface Register {
  // defaultError: Error
  // queryMeta: Record<string, unknown>
  // mutationMeta: Record<string, unknown>
  // queryKey: ReadonlyArray<unknown>
  // mutationKey: ReadonlyArray<unknown>
}

/**
 * The error type used wherever an error is not given an explicit type parameter.
 * Defaults to `Error`; declare `defaultError` on {@link Register} to change it everywhere at once.
 */
export type DefaultError = Register extends {
  defaultError: infer TError
}
  ? TError
  : Error

/**
 * The type of a query key — the serializable array that identifies a query in the cache.
 * Defaults to `ReadonlyArray<unknown>`; declare `queryKey` on {@link Register} to narrow it repository-wide.
 */
export type QueryKey = Register extends {
  queryKey: infer TQueryKey
}
  ? TQueryKey extends ReadonlyArray<unknown>
    ? TQueryKey
    : TQueryKey extends Array<unknown>
      ? TQueryKey
      : ReadonlyArray<unknown>
  : ReadonlyArray<unknown>

export const dataTagSymbol = Symbol()
export type dataTagSymbol = typeof dataTagSymbol
export const dataTagErrorSymbol = Symbol()
export type dataTagErrorSymbol = typeof dataTagErrorSymbol
export const unsetMarker = Symbol()
export type UnsetMarker = typeof unsetMarker
export type AnyDataTag = {
  [dataTagSymbol]: any
  [dataTagErrorSymbol]: any
}
export type DataTag<
  TType,
  TValue,
  TError = UnsetMarker,
> = TType extends AnyDataTag
  ? TType
  : TType & {
      [dataTagSymbol]: TValue
      [dataTagErrorSymbol]: TError
    }

export type QueryKeyWithDataTag<
  TQueryKey extends QueryKey = QueryKey,
  TQueryFnData = unknown,
  TError = DefaultError,
> = {
  queryKey: DataTag<TQueryKey, TQueryFnData, TError>
}

export type InferDataFromTag<TQueryFnData, TTaggedQueryKey extends QueryKey> =
  TTaggedQueryKey extends DataTag<unknown, infer TaggedValue, unknown>
    ? TaggedValue
    : TQueryFnData

export type InferErrorFromTag<TError, TTaggedQueryKey extends QueryKey> =
  TTaggedQueryKey extends DataTag<unknown, unknown, infer TaggedError>
    ? TaggedError extends UnsetMarker
      ? TError
      : TaggedError
    : TError

/** @inline */
export type QueryFunction<
  T = unknown,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> = (context: QueryFunctionContext<TQueryKey, TPageParam>) => T | Promise<T>

/** @inline */
export type StaleTime = number | 'static'

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
      /**
       * @deprecated
       * if you want access to the direction, you can add it to the pageParam
       */
      direction?: unknown
    }
  : {
      client: QueryClient
      queryKey: TQueryKey
      signal: AbortSignal
      pageParam: TPageParam
      /**
       * @deprecated
       * if you want access to the direction, you can add it to the pageParam
       */
      direction: FetchDirection
      meta: QueryMeta | undefined
    }

/** @inline */
export type InitialDataFunction<T> = () => T | undefined

type NonFunctionGuard<T> = T extends Function ? never : T

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

export type QueriesPlaceholderDataFunction<TQueryData> = (
  previousData: undefined,
  previousQuery: undefined,
) => TQueryData | undefined

/** @inline */
export type QueryKeyHashFunction<TQueryKey extends QueryKey> = (
  queryKey: TQueryKey,
) => string

/** @inline */
export type GetPreviousPageParamFunction<TPageParam, TQueryFnData = unknown> = (
  firstPage: TQueryFnData,
  allPages: Array<TQueryFnData>,
  firstPageParam: TPageParam,
  allPageParams: Array<TPageParam>,
) => TPageParam | undefined | null

/** @inline */
export type GetNextPageParamFunction<TPageParam, TQueryFnData = unknown> = (
  lastPage: TQueryFnData,
  allPages: Array<TQueryFnData>,
  lastPageParam: TPageParam,
  allPageParams: Array<TPageParam>,
) => TPageParam | undefined | null

/**
 * The data shape of an infinite query: every page fetched so far, plus the page param each one was fetched with.
 * `pages` and `pageParams` are index-aligned — `pageParams[i]` is the param that produced `pages[i]`.
 */
export interface InfiniteData<TData, TPageParam = unknown> {
  pages: Array<TData>
  pageParams: Array<TPageParam>
}

/**
 * The type of the `meta` object that can be attached to a query and read back from `queryFn`, callbacks and
 * cache-level handlers. Defaults to `Record<string, unknown>`; declare `queryMeta` on {@link Register} to narrow it.
 */
export type QueryMeta = Register extends {
  queryMeta: infer TQueryMeta
}
  ? TQueryMeta extends Record<string, unknown>
    ? TQueryMeta
    : Record<string, unknown>
  : Record<string, unknown>

/** @inline */
export type NetworkMode = 'online' | 'always' | 'offlineFirst'

/** @inline */
export type NotifyOnChangeProps =
  | Array<keyof InfiniteQueryObserverResult>
  | 'all'
  | undefined
  | (() => Array<keyof InfiniteQueryObserverResult> | 'all' | undefined)

export interface QueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> {
  /**
   * If `false`, failed queries will not retry by default.
   * If `true`, failed queries will retry infinitely.
   * If set to an integer number, e.g. 3, failed queries will retry until the failed query count meets that number.
   * If set to a function `(failureCount, error) => boolean` failed queries will retry until the function returns false.
   *
   * Defaults to `3` on the client and `0` on the server.
   */
  retry?: RetryValue<TError>
  /**
   * This function receives a `retryAttempt` integer and the actual Error and returns the delay to apply before the
   * next attempt in milliseconds.
   *
   * A function like `attempt => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000)` applies exponential
   * backoff.
   *
   * A function like `attempt => attempt * 1000` applies linear backoff.
   *
   * Defaults to a function that applies exponential backoff, capped at 30 seconds.
   */
  retryDelay?: RetryDelayValue<TError>
  /**
   * Controls whether a query is allowed to run based on the current network connectivity.
   *
   * @defaultValue 'online'
   * @see [Network Mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode) for more information.
   */
  networkMode?: NetworkMode
  /**
   * The time in milliseconds that unused/inactive cache data remains in memory.
   * When a query's cache becomes unused or inactive, that cache data will be garbage collected after this duration.
   * When different garbage collection times are specified, the longest one will be used.
   * Setting it to `Infinity` will disable garbage collection.
   *
   * Defaults to `5 * 60 * 1000` (5 minutes), or `Infinity` during SSR.
   *
   * Note: the maximum allowed time is about 24 days, imposed by `setTimeout`'s 32-bit signed integer delay — see
   * `timeoutManager.setTimeoutProvider` for a workaround.
   */
  gcTime?: number
  /**
   * The function that the query will use to request data.
   * Required, unless a default query function has been set via `queryClient.setQueryDefaults` or
   * `queryClient.setDefaultOptions`.
   * Receives a {@link QueryFunctionContext}.
   * Must return a promise that will either resolve data or throw an error. The data cannot be `undefined`.
   */
  queryFn?: QueryFunction<TQueryFnData, TQueryKey, TPageParam> | SkipToken
  /**
   * This option can be used to persist the result of a query to an external storage, bypassing the need to actually
   * call the `queryFn`. Useful for persisting a query's data across e.g. server/client boundaries.
   */
  persister?: QueryPersister<TQueryFnData, NoInfer<TQueryKey>, TPageParam>
  /**
   * The hashed form of `queryKey`, computed with `queryKeyHashFn` (or the default hashing function otherwise). Used
   * as the actual cache key internally.
   */
  queryHash?: string
  /**
   * The query key to use for this query.
   *
   * The query key will be hashed into a stable hash. See [Query Keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)
   * for more information.
   *
   * The query will automatically update when this key changes (as long as `enabled` is not set to `false`).
   */
  queryKey?: TQueryKey
  /**
   * If specified, this function is used to hash the `queryKey` to a string.
   */
  queryKeyHashFn?: QueryKeyHashFunction<TQueryKey>
  /**
   * If set, this value will be used as the initial data for the query cache (as long as the query hasn't been
   * created or cached yet).
   * If set to a function, the function will be called **once** during the shared/root query initialization, and be
   * expected to synchronously return the initial data.
   * Initial data is considered stale by default unless a `staleTime` has been set.
   * `initialData` **is persisted** to the cache.
   */
  initialData?: TData | InitialDataFunction<TData>
  /**
   * If set, this value will be used as the time (in milliseconds) of when the `initialData` itself was last updated.
   */
  initialDataUpdatedAt?: number | (() => number | undefined)
  /** @internal */
  behavior?: QueryBehavior<TQueryFnData, TError, TData, TQueryKey>
  /**
   * Set this to `false` to disable structural sharing between query results.
   * Set this to a function which accepts the old and new data and returns resolved data of the same type to implement custom structural sharing logic.
   *
   * @defaultValue true
   */
  structuralSharing?:
    | boolean
    | ((oldData: unknown | undefined, newData: unknown) => unknown)
  /** @internal */
  _defaulted?: boolean
  /** @internal */
  _type?: 'infinite'
  /**
   * Additional payload to be stored on each query.
   * Use this property to pass information that can be used in other places.
   */
  meta?: QueryMeta
  /**
   * Maximum number of pages to store in the data of an infinite query.
   */
  maxPages?: number
}

export interface InitialPageParam<TPageParam = unknown> {
  /**
   * The page param to start from when an infinite query has no pages yet.
   * It is passed to `queryFn` as `pageParam` for the first page; every page after that gets the
   * value returned by `getNextPageParam` or `getPreviousPageParam`.
   * It only applies while the query has no pages: once a first page exists, refetching starts from
   * that page's own param instead.
   */
  initialPageParam: TPageParam
}

export interface InfiniteQueryPageParamsOptions<
  TQueryFnData = unknown,
  TPageParam = unknown,
> extends InitialPageParam<TPageParam> {
  /**
   * This function can be set to automatically get the previous cursor for infinite queries.
   * The result will also be used to determine the value of `hasPreviousPage`.
   */
  getPreviousPageParam?: GetPreviousPageParamFunction<TPageParam, TQueryFnData>
  /**
   * This function can be set to automatically get the next cursor for infinite queries.
   * The result will also be used to determine the value of `hasNextPage`.
   */
  getNextPageParam: GetNextPageParamFunction<TPageParam, TQueryFnData>
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

export interface QueryObserverOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> extends WithRequired<
  QueryOptions<TQueryFnData, TError, TQueryData, TQueryKey, TPageParam>,
  'queryKey'
> {
  /**
   * Set this to `false` or a function that returns `false` to disable automatic refetching when the query mounts or changes query keys.
   * To refetch the query, use the `refetch` method returned from the `useQuery` instance.
   * Accepts a boolean or function that returns a boolean.
   *
   * @defaultValue true
   */
  enabled?: QueryBooleanOption<TQueryFnData, TError, TQueryData, TQueryKey>
  /**
   * The time in milliseconds after data is considered stale.
   * If set to `Infinity`, the data will never be considered stale.
   * If set to `'static'`, the data will never be considered stale.
   * If set to a function, the function will be executed with the query to compute a `staleTime`.
   *
   * @defaultValue 0
   */
  staleTime?: StaleTimeFunction<TQueryFnData, TError, TQueryData, TQueryKey>
  /**
   * If set to a number, the query will continuously refetch at this frequency in milliseconds.
   * If set to a function, the function will be executed with the latest data and query to compute a frequency
   *
   * @defaultValue false
   */
  refetchInterval?:
    | number
    | false
    | ((
        query: Query<TQueryFnData, TError, TQueryData, TQueryKey>,
      ) => number | false | undefined)
  /**
   * If set to `true`, the query will continue to refetch while their tab/window is in the background.
   *
   * @defaultValue false
   */
  refetchIntervalInBackground?: boolean
  /**
   * If set to `true`, the query will refetch on window focus if the data is stale.
   * If set to `false`, the query will not refetch on window focus.
   * If set to `'always'`, the query will always refetch on window focus (except when `staleTime: 'static'` is used).
   * If set to a function, the function will be executed with the latest data and query to compute the value.
   *
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
   *
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
   *
   * @defaultValue true
   */
  retryOnMount?: QueryBooleanOption<TQueryFnData, TError, TQueryData, TQueryKey>
  /**
   * If set, the component will only re-render if any of the listed properties change.
   * When set to `['data', 'error']`, the component will only re-render when the `data` or `error` properties change.
   * When set to `'all'`, the component will re-render whenever a query is updated.
   * When set to a function, the function will be executed to compute the list of properties.
   *
   * Defaults to `undefined`, in which case property access is tracked automatically, and the
   * component only re-renders when one of the tracked properties changes.
   */
  notifyOnChangeProps?: NotifyOnChangeProps
  /**
   * Whether errors should be thrown instead of setting the `error` property.
   * If set to `true` or `suspense` is `true`, all errors will be thrown to the error boundary.
   * If set to `false` and `suspense` is `false`, errors are returned as state.
   * If set to a function, it will be passed the error and the query, and it should return a boolean indicating whether to show the error in an error boundary (`true`) or return the error as state (`false`).
   *
   * @defaultValue false
   */
  throwOnError?: ThrowOnError<TQueryFnData, TError, TQueryData, TQueryKey>
  /**
   * This option can be used to transform or select a part of the data returned by the query function. It affects
   * the returned `data` value, but does not affect what gets stored in the query cache.
   * The `select` function will only run if `data` changed, or if the reference to the `select` function itself
   * changes. To optimize, memoize the function so its reference stays stable across calls.
   */
  select?: (data: TQueryData) => TData
  /**
   * If set to `true`, the query will suspend when `status === 'pending'`
   * and throw errors when `status === 'error'`.
   *
   * @defaultValue false
   */
  suspense?: boolean
  /**
   * If set, this value will be used as the placeholder data for this particular query observer while the query is still in the `loading` data and no initialData has been provided.
   */
  placeholderData?:
    | NonFunctionGuard<TQueryData>
    | PlaceholderDataFunction<
        NonFunctionGuard<TQueryData>,
        TError,
        NonFunctionGuard<TQueryData>,
        TQueryKey
      >

  /** @internal */
  _optimisticResults?: 'optimistic' | 'isRestoring'
}

export type WithRequired<TTarget, TKey extends keyof TTarget> = TTarget & {
  [_ in TKey]: {}
}

export type DefaultedQueryObserverOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = WithRequired<
  QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>,
  'throwOnError' | 'refetchOnReconnect' | 'queryHash'
>

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

export type DefaultedInfiniteQueryObserverOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = WithRequired<
  InfiniteQueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  'throwOnError' | 'refetchOnReconnect' | 'queryHash'
>

export interface QueryExecuteOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> extends WithRequired<
  QueryOptions<TQueryFnData, TError, TQueryData, TQueryKey, TPageParam>,
  'queryKey'
> {
  initialPageParam?: never
  /**
   * This option can be used to transform or select a part of the data returned by the query function. It affects
   * the value this call resolves with, but does not affect what gets stored in the query cache.
   */
  select?: (data: TQueryData) => TData
  /**
   * The time in milliseconds after data is considered stale.
   * If the data is fresh it will be returned from the cache.
   */
  staleTime?: StaleTimeFunction<TQueryFnData, TError, TQueryData, TQueryKey>
}

/** @deprecated */
export interface FetchQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> extends WithRequired<
  QueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
  'queryKey'
> {
  initialPageParam?: never
  /**
   * The time in milliseconds after data is considered stale.
   * If the data is fresh it will be returned from the cache.
   */
  staleTime?: StaleTimeFunction<TQueryFnData, TError, TData, TQueryKey>
}

/** @deprecated */
export interface EnsureQueryDataOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> extends FetchQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
> {
  revalidateIfStale?: boolean
}

/** @deprecated */
export type EnsureInfiniteQueryDataOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = FetchInfiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
> & {
  revalidateIfStale?: boolean
}

type InfiniteQueryPages<TQueryFnData = unknown, TPageParam = unknown> =
  | { pages?: never }
  | {
      pages: number
      getNextPageParam: GetNextPageParamFunction<TPageParam, TQueryFnData>
    }

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
  InitialPageParam<TPageParam> &
  InfiniteQueryPages<TQueryFnData, TPageParam>

/** @deprecated */
export type FetchInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = Omit<
  FetchQueryOptions<
    TQueryFnData,
    TError,
    InfiniteData<TData, TPageParam>,
    TQueryKey,
    TPageParam
  >,
  'initialPageParam'
> &
  InitialPageParam<TPageParam> &
  InfiniteQueryPages<TQueryFnData, TPageParam>

export interface ResultOptions {
  /**
   * If set to `true`, the method throws if any of the underlying query refetch tasks fail.
   * If set to `false`, failed refetches are swallowed and not surfaced to the caller.
   *
   * @defaultValue false
   */
  throwOnError?: boolean
}

export interface RefetchOptions extends ResultOptions {
  /**
   * If set to `true`, a currently running request will be cancelled before a new request is made
   *
   * If set to `false`, no refetch will be made if there is already a request running.
   *
   * @defaultValue true
   */
  cancelRefetch?: boolean
}

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
   *
   * @defaultValue 'active'
   */
  refetchType?: QueryTypeFilter | 'none'
}

export interface RefetchQueryFilters<
  TQueryKey extends QueryKey = QueryKey,
> extends QueryFilters<TQueryKey> {}

export interface InvalidateOptions extends RefetchOptions {}
export interface ResetOptions extends RefetchOptions {}

export interface FetchNextPageOptions extends ResultOptions {
  /**
   * If set to `true`, calling `fetchNextPage` repeatedly will invoke `queryFn` every time,
   * whether the previous invocation has resolved or not. Also, the result from previous invocations will be ignored.
   *
   * If set to `false`, calling `fetchNextPage` repeatedly won't have any effect until the first invocation has resolved.
   *
   * @defaultValue true
   */
  cancelRefetch?: boolean
}

export interface FetchPreviousPageOptions extends ResultOptions {
  /**
   * If set to `true`, calling `fetchPreviousPage` repeatedly will invoke `queryFn` every time,
   * whether the previous invocation has resolved or not. Also, the result from previous invocations will be ignored.
   *
   * If set to `false`, calling `fetchPreviousPage` repeatedly won't have any effect until the first invocation has resolved.
   *
   * @defaultValue true
   */
  cancelRefetch?: boolean
}

/** @inline */
export type QueryStatus = 'pending' | 'error' | 'success'
/** @inline */
export type FetchStatus = 'fetching' | 'paused' | 'idle'

export interface QueryObserverBaseResult<
  TData = unknown,
  TError = DefaultError,
> {
  /**
   * The last successfully resolved data for the query.
   */
  data: TData | undefined
  /**
   * The timestamp for when the query most recently returned the `status` as `"success"`.
   */
  dataUpdatedAt: number
  /**
   * The error object for the query, if an error was thrown.
   * - Defaults to `null`.
   */
  error: TError | null
  /**
   * The timestamp for when the query most recently returned the `status` as `"error"`.
   */
  errorUpdatedAt: number
  /**
   * The failure count for the query.
   * - Incremented every time the query fails.
   * - Reset to `0` when the query succeeds.
   */
  failureCount: number
  /**
   * The failure reason for the query retry.
   * - Reset to `null` when the query succeeds.
   */
  failureReason: TError | null
  /**
   * The sum of all errors.
   */
  errorUpdateCount: number
  /**
   * A derived boolean from the `status` variable, provided for convenience.
   * - `true` if the query attempt resulted in an error.
   */
  isError: boolean
  /**
   * Will be `true` if the query has been fetched.
   */
  isFetched: boolean
  /**
   * Will be `true` if the query has been fetched after the component mounted.
   * - This property can be used to not show any previously cached data.
   */
  isFetchedAfterMount: boolean
  /**
   * A derived boolean from the `fetchStatus` variable, provided for convenience.
   * - `true` whenever the `queryFn` is executing, which includes initial `pending` as well as background refetch.
   */
  isFetching: boolean
  /**
   * Is `true` whenever the first fetch for a query is in-flight.
   * - Is the same as `isFetching && isPending`.
   */
  isLoading: boolean
  /**
   * Will be `pending` if there's no cached data and no query attempt was finished yet.
   */
  isPending: boolean
  /**
   * Will be `true` if the query failed while fetching for the first time.
   */
  isLoadingError: boolean
  /**
   * @deprecated `isInitialLoading` is being deprecated in favor of `isLoading`
   * and will be removed in the next major version.
   */
  isInitialLoading: boolean
  /**
   * A derived boolean from the `fetchStatus` variable, provided for convenience.
   * - The query wanted to fetch, but has been `paused`.
   */
  isPaused: boolean
  /**
   * Will be `true` if the data shown is the placeholder data.
   */
  isPlaceholderData: boolean
  /**
   * Will be `true` if the query failed while refetching.
   */
  isRefetchError: boolean
  /**
   * Is `true` whenever a background refetch is in-flight, which _does not_ include initial `pending`.
   * - Is the same as `isFetching && !isPending`.
   */
  isRefetching: boolean
  /**
   * Will be `true` if the data in the cache is invalidated or if the data is older than the given `staleTime`.
   */
  isStale: boolean
  /**
   * A derived boolean from the `status` variable, provided for convenience.
   * - `true` if the query has received a response with no errors and is ready to display its data.
   */
  isSuccess: boolean
  /**
   * `true` if this observer is enabled, `false` otherwise.
   */
  isEnabled: boolean
  /**
   * A function to manually refetch the query.
   */
  refetch: (
    options?: RefetchOptions,
  ) => Promise<QueryObserverResult<TData, TError>>
  /**
   * The status of the query.
   * - Will be:
   *   - `pending` if there's no cached data and no query attempt was finished yet.
   *   - `error` if the query attempt resulted in an error.
   *   - `success` if the query has received a response with no errors and is ready to display its data.
   */
  status: QueryStatus
  /**
   * The fetch status of the query.
   * - `fetching`: Is `true` whenever the queryFn is executing, which includes initial `pending` as well as background refetch.
   * - `paused`: The query wanted to fetch, but has been `paused`.
   * - `idle`: The query is not fetching.
   * - See [Network Mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode) for more information.
   */
  fetchStatus: FetchStatus
}

export interface QueryObserverPendingResult<
  TData = unknown,
  TError = DefaultError,
> extends QueryObserverBaseResult<TData, TError> {
  data: undefined
  error: null
  isError: false
  isPending: true
  isLoadingError: false
  isRefetchError: false
  isSuccess: false
  isPlaceholderData: false
  status: 'pending'
}

export interface QueryObserverLoadingResult<
  TData = unknown,
  TError = DefaultError,
> extends QueryObserverBaseResult<TData, TError> {
  data: undefined
  error: null
  isError: false
  isPending: true
  isLoading: true
  isLoadingError: false
  isRefetchError: false
  isSuccess: false
  isPlaceholderData: false
  status: 'pending'
}

export interface QueryObserverLoadingErrorResult<
  TData = unknown,
  TError = DefaultError,
> extends QueryObserverBaseResult<TData, TError> {
  data: undefined
  error: TError
  isError: true
  isPending: false
  isLoading: false
  isLoadingError: true
  isRefetchError: false
  isSuccess: false
  isPlaceholderData: false
  status: 'error'
}

export interface QueryObserverRefetchErrorResult<
  TData = unknown,
  TError = DefaultError,
> extends QueryObserverBaseResult<TData, TError> {
  data: TData
  error: TError
  isError: true
  isPending: false
  isLoading: false
  isLoadingError: false
  isRefetchError: true
  isSuccess: false
  isPlaceholderData: false
  status: 'error'
}

export interface QueryObserverSuccessResult<
  TData = unknown,
  TError = DefaultError,
> extends QueryObserverBaseResult<TData, TError> {
  data: TData
  error: null
  isError: false
  isPending: false
  isLoading: false
  isLoadingError: false
  isRefetchError: false
  isSuccess: true
  isPlaceholderData: false
  status: 'success'
}

export interface QueryObserverPlaceholderResult<
  TData = unknown,
  TError = DefaultError,
> extends QueryObserverBaseResult<TData, TError> {
  data: TData
  isError: false
  error: null
  isPending: false
  isLoading: false
  isLoadingError: false
  isRefetchError: false
  isSuccess: true
  isPlaceholderData: true
  status: 'success'
}

export type DefinedQueryObserverResult<
  TData = unknown,
  TError = DefaultError,
> =
  | QueryObserverRefetchErrorResult<TData, TError>
  | QueryObserverSuccessResult<TData, TError>

export type QueryObserverResult<TData = unknown, TError = DefaultError> =
  | DefinedQueryObserverResult<TData, TError>
  | QueryObserverLoadingErrorResult<TData, TError>
  | QueryObserverLoadingResult<TData, TError>
  | QueryObserverPendingResult<TData, TError>
  | QueryObserverPlaceholderResult<TData, TError>

export interface InfiniteQueryObserverBaseResult<
  TData = unknown,
  TError = DefaultError,
> extends QueryObserverBaseResult<TData, TError> {
  /**
   * This function allows you to fetch the next "page" of results.
   */
  fetchNextPage: (
    options?: FetchNextPageOptions,
  ) => Promise<InfiniteQueryObserverResult<TData, TError>>
  /**
   * This function allows you to fetch the previous "page" of results.
   */
  fetchPreviousPage: (
    options?: FetchPreviousPageOptions,
  ) => Promise<InfiniteQueryObserverResult<TData, TError>>
  /**
   * Will be `true` if there is a next page to be fetched (known via the `getNextPageParam` option).
   */
  hasNextPage: boolean
  /**
   * Will be `true` if there is a previous page to be fetched (known via the `getPreviousPageParam` option).
   */
  hasPreviousPage: boolean
  /**
   * Will be `true` if the query failed while fetching the next page.
   */
  isFetchNextPageError: boolean
  /**
   * Will be `true` while fetching the next page with `fetchNextPage`.
   */
  isFetchingNextPage: boolean
  /**
   * Will be `true` if the query failed while fetching the previous page.
   */
  isFetchPreviousPageError: boolean
  /**
   * Will be `true` while fetching the previous page with `fetchPreviousPage`.
   */
  isFetchingPreviousPage: boolean
}

export interface InfiniteQueryObserverPendingResult<
  TData = unknown,
  TError = DefaultError,
> extends InfiniteQueryObserverBaseResult<TData, TError> {
  data: undefined
  error: null
  isError: false
  isPending: true
  isLoadingError: false
  isRefetchError: false
  isFetchNextPageError: false
  isFetchPreviousPageError: false
  isSuccess: false
  isPlaceholderData: false
  status: 'pending'
}

export interface InfiniteQueryObserverLoadingResult<
  TData = unknown,
  TError = DefaultError,
> extends InfiniteQueryObserverBaseResult<TData, TError> {
  data: undefined
  error: null
  isError: false
  isPending: true
  isLoading: true
  isLoadingError: false
  isRefetchError: false
  isFetchNextPageError: false
  isFetchPreviousPageError: false
  isSuccess: false
  isPlaceholderData: false
  status: 'pending'
}

export interface InfiniteQueryObserverLoadingErrorResult<
  TData = unknown,
  TError = DefaultError,
> extends InfiniteQueryObserverBaseResult<TData, TError> {
  data: undefined
  error: TError
  isError: true
  isPending: false
  isLoading: false
  isLoadingError: true
  isRefetchError: false
  isFetchNextPageError: false
  isFetchPreviousPageError: false
  isSuccess: false
  isPlaceholderData: false
  status: 'error'
}

export interface InfiniteQueryObserverRefetchErrorResult<
  TData = unknown,
  TError = DefaultError,
> extends InfiniteQueryObserverBaseResult<TData, TError> {
  data: TData
  error: TError
  isError: true
  isPending: false
  isLoading: false
  isLoadingError: false
  isRefetchError: true
  isSuccess: false
  isPlaceholderData: false
  status: 'error'
}

export interface InfiniteQueryObserverSuccessResult<
  TData = unknown,
  TError = DefaultError,
> extends InfiniteQueryObserverBaseResult<TData, TError> {
  data: TData
  error: null
  isError: false
  isPending: false
  isLoading: false
  isLoadingError: false
  isRefetchError: false
  isFetchNextPageError: false
  isFetchPreviousPageError: false
  isSuccess: true
  isPlaceholderData: false
  status: 'success'
}

export interface InfiniteQueryObserverPlaceholderResult<
  TData = unknown,
  TError = DefaultError,
> extends InfiniteQueryObserverBaseResult<TData, TError> {
  data: TData
  isError: false
  error: null
  isPending: false
  isLoading: false
  isLoadingError: false
  isRefetchError: false
  isSuccess: true
  isPlaceholderData: true
  isFetchNextPageError: false
  isFetchPreviousPageError: false
  status: 'success'
}

export type DefinedInfiniteQueryObserverResult<
  TData = unknown,
  TError = DefaultError,
> =
  | InfiniteQueryObserverRefetchErrorResult<TData, TError>
  | InfiniteQueryObserverSuccessResult<TData, TError>

export type InfiniteQueryObserverResult<
  TData = unknown,
  TError = DefaultError,
> =
  | DefinedInfiniteQueryObserverResult<TData, TError>
  | InfiniteQueryObserverLoadingErrorResult<TData, TError>
  | InfiniteQueryObserverLoadingResult<TData, TError>
  | InfiniteQueryObserverPendingResult<TData, TError>
  | InfiniteQueryObserverPlaceholderResult<TData, TError>

/**
 * The type of a mutation key — the serializable array used to identify and filter mutations.
 * Defaults to `ReadonlyArray<unknown>`; declare `mutationKey` on {@link Register} to narrow it repository-wide.
 */
export type MutationKey = Register extends {
  mutationKey: infer TMutationKey
}
  ? TMutationKey extends ReadonlyArray<unknown>
    ? TMutationKey
    : TMutationKey extends Array<unknown>
      ? TMutationKey
      : ReadonlyArray<unknown>
  : ReadonlyArray<unknown>

/** @inline */
export type MutationStatus = 'idle' | 'pending' | 'success' | 'error'

/**
 * Groups mutations so they run one after another instead of in parallel.
 * Mutations that share the same `id` form a queue: while one is running, the others wait in `isPaused: true`
 * state and resume automatically when their turn comes. Mutations with no scope always run in parallel.
 */
export type MutationScope = {
  id: string
}

/**
 * The type of the `meta` object that can be attached to a mutation and read back from `mutationFn`, callbacks and
 * cache-level handlers. Defaults to `Record<string, unknown>`; declare `mutationMeta` on {@link Register} to narrow it.
 */
export type MutationMeta = Register extends {
  mutationMeta: infer TMutationMeta
}
  ? TMutationMeta extends Record<string, unknown>
    ? TMutationMeta
    : Record<string, unknown>
  : Record<string, unknown>

export type MutationFunctionContext = {
  client: QueryClient
  meta: MutationMeta | undefined
  mutationKey?: MutationKey
}

/** @inline */
export type MutationFunction<TData = unknown, TVariables = unknown> = (
  variables: TVariables,
  context: MutationFunctionContext,
) => Promise<TData>

export interface MutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> {
  /**
   * The function that performs the asynchronous task this mutation runs.
   * Required, unless a default mutation function has been set for the matching `mutationKey` via
   * `queryClient.setMutationDefaults`.
   * Receives the `variables` passed to `mutate`, and a {@link MutationFunctionContext} holding the
   * `QueryClient`, the `mutationKey` and `meta`.
   * Must return a promise that resolves the mutation's data.
   */
  mutationFn?: MutationFunction<TData, TVariables>
  /**
   * The key to use for this mutation. Optional, but required to inherit defaults registered with
   * `queryClient.setMutationDefaults`, and to match this mutation with `useMutationState` or
   * `queryClient.isMutating`.
   */
  mutationKey?: MutationKey
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
  /**
   * If `false`, failed mutations will not retry by default.
   * If `true`, failed mutations will retry infinitely.
   * If set to an integer number, e.g. 3, failed mutations will retry until the failed mutation count meets that number.
   * If set to a function `(failureCount, error) => boolean` failed mutations will retry until the function returns false.
   *
   * @defaultValue 0
   */
  retry?: RetryValue<TError>
  /**
   * This function receives a `retryAttempt` integer and the actual Error and returns the delay to apply before the
   * next attempt in milliseconds.
   *
   * Defaults to a function that applies exponential backoff, capped at 30 seconds.
   */
  retryDelay?: RetryDelayValue<TError>
  /**
   * Controls whether a mutation is allowed to run based on the current network connectivity.
   *
   * @defaultValue 'online'
   * @see [Network Mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode) for more information.
   */
  networkMode?: NetworkMode
  /**
   * The time in milliseconds that an unused/inactive mutation remains in memory before it is
   * garbage collected.
   *
   * Defaults to `5 * 60 * 1000` (5 minutes), or `Infinity` during SSR.
   */
  gcTime?: number
  /** @internal */
  _defaulted?: boolean
  /**
   * Additional payload to be stored on the mutation cache entry.
   * Use it to pass information that can be read wherever the `mutation` is available, such as the
   * `onError` and `onSuccess` callbacks of the `MutationCache`.
   */
  meta?: MutationMeta
  /**
   * Controls whether this mutation runs alongside others or waits its turn.
   * Mutations sharing the same `scope.id` run serially, in the order they were started.
   * Without a scope, a mutation runs as soon as it is triggered.
   */
  scope?: MutationScope
}

export interface MutationObserverOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> extends MutationOptions<TData, TError, TVariables, TOnMutateResult> {
  /**
   * Whether errors should be thrown instead of setting the `error` property.
   * If set to `true`, all errors will be thrown to the nearest error boundary.
   * If set to a function, it will be passed the error and should return a boolean indicating whether to throw the
   * error (`true`) or return it as state (`false`).
   *
   * @defaultValue false
   */
  throwOnError?: boolean | ((error: TError) => boolean)
}

export interface MutateOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> {
  onSuccess?: (
    data: TData,
    variables: TVariables,
    onMutateResult: TOnMutateResult | undefined,
    context: MutationFunctionContext,
  ) => void
  onError?: (
    error: TError,
    variables: TVariables,
    onMutateResult: TOnMutateResult | undefined,
    context: MutationFunctionContext,
  ) => void
  onSettled?: (
    data: TData | undefined,
    error: TError | null,
    variables: TVariables,
    onMutateResult: TOnMutateResult | undefined,
    context: MutationFunctionContext,
  ) => void
}

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

export type MutateFunction<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = (
  ...rest: MutateFunctionRest<TData, TError, TVariables, TOnMutateResult>
) => Promise<TData>

export interface MutationObserverBaseResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> extends MutationState<TData, TError, TVariables, TOnMutateResult> {
  /**
   * The last successfully resolved data for the mutation.
   */
  data: TData | undefined
  /**
   * The variables object passed to the `mutationFn`.
   */
  variables: TVariables | undefined
  /**
   * The error object for the mutation, if an error was encountered.
   * - Defaults to `null`.
   */
  error: TError | null
  /**
   * A boolean variable derived from `status`.
   * - `true` if the last mutation attempt resulted in an error.
   */
  isError: boolean
  /**
   * A boolean variable derived from `status`.
   * - `true` if the mutation is in its initial state prior to executing.
   */
  isIdle: boolean
  /**
   * A boolean variable derived from `status`.
   * - `true` if the mutation is currently executing.
   */
  isPending: boolean
  /**
   * A boolean variable derived from `status`.
   * - `true` if the last mutation attempt was successful.
   */
  isSuccess: boolean
  /**
   * The status of the mutation.
   * - Will be:
   *   - `idle` initial status prior to the mutation function executing.
   *   - `pending` if the mutation is currently executing.
   *   - `error` if the last mutation attempt resulted in an error.
   *   - `success` if the last mutation attempt was successful.
   */
  status: MutationStatus
  /**
   * The mutation function you can call with variables to trigger the mutation and optionally hooks on additional callback options.
   * @param variables - The variables object to pass to the `mutationFn`.
   * @param options.onSuccess - This function will fire when the mutation is successful and will be passed the mutation's result.
   * @param options.onError - This function will fire if the mutation encounters an error and will be passed the error.
   * @param options.onSettled - This function will fire when the mutation is either successfully fetched or encounters an error and be passed either the data or error.
   * @remarks
   * - If you make multiple requests, `onSuccess` will fire only after the latest call you've made.
   * - All the callback functions (`onSuccess`, `onError`, `onSettled`) are void functions, and the returned value will be ignored.
   */
  mutate: MutateFunction<TData, TError, TVariables, TOnMutateResult>
  /**
   * A function to clean the mutation internal state (i.e., it resets the mutation to its initial state).
   */
  reset: () => void
}

export interface MutationObserverIdleResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> extends MutationObserverBaseResult<
  TData,
  TError,
  TVariables,
  TOnMutateResult
> {
  data: undefined
  variables: undefined
  error: null
  isError: false
  isIdle: true
  isPending: false
  isSuccess: false
  status: 'idle'
}

export interface MutationObserverLoadingResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> extends MutationObserverBaseResult<
  TData,
  TError,
  TVariables,
  TOnMutateResult
> {
  data: undefined
  variables: TVariables
  error: null
  isError: false
  isIdle: false
  isPending: true
  isSuccess: false
  status: 'pending'
}

export interface MutationObserverErrorResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> extends MutationObserverBaseResult<
  TData,
  TError,
  TVariables,
  TOnMutateResult
> {
  data: undefined
  error: TError
  variables: TVariables
  isError: true
  isIdle: false
  isPending: false
  isSuccess: false
  status: 'error'
}

export interface MutationObserverSuccessResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> extends MutationObserverBaseResult<
  TData,
  TError,
  TVariables,
  TOnMutateResult
> {
  data: TData
  error: null
  variables: TVariables
  isError: false
  isIdle: false
  isPending: false
  isSuccess: true
  status: 'success'
}

export type MutationObserverResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> =
  | MutationObserverIdleResult<TData, TError, TVariables, TOnMutateResult>
  | MutationObserverLoadingResult<TData, TError, TVariables, TOnMutateResult>
  | MutationObserverErrorResult<TData, TError, TVariables, TOnMutateResult>
  | MutationObserverSuccessResult<TData, TError, TVariables, TOnMutateResult>

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

export interface DefaultOptions<TError = DefaultError> {
  /** Default options applied to every query, unless overridden per-query. */
  queries?: OmitKeyof<
    QueryObserverOptions<unknown, TError>,
    'suspense' | 'queryKey'
  >
  /** Default options applied to every mutation, unless overridden per-mutation. */
  mutations?: MutationObserverOptions<unknown, TError, unknown, unknown>
  /** Default options used when hydrating queries; see {@link HydrateOptions}. */
  hydrate?: HydrateOptions['defaultOptions']
  /** Default options used when dehydrating the client's caches; see {@link DehydrateOptions}. */
  dehydrate?: DehydrateOptions
}

/**
 * Options for cancelling an in-flight fetch, e.g. via `query.cancel()`.
 * They are carried on the {@link CancelledError} that the cancelled fetch rejects with.
 */
export interface CancelOptions {
  revert?: boolean
  silent?: boolean
}

/**
 * Options for writing data into the cache, e.g. via `queryClient.setQueryData()`.
 * `updatedAt` overrides the timestamp the data is recorded with, which is what staleness is measured from;
 * omit it to use the current time.
 */
export interface SetDataOptions {
  updatedAt?: number
}

/** @inline */
export type NotifyEventType =
  | 'added'
  | 'removed'
  | 'updated'
  | 'observerAdded'
  | 'observerRemoved'
  | 'observerResultsUpdated'
  | 'observerOptionsUpdated'

export interface NotifyEvent {
  type: NotifyEventType
}
