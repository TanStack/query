/* istanbul ignore file */

import type { QueryClient } from './queryClient'
import type { DehydrateOptions, HydrateOptions } from './hydration'
import type { MutationState } from './mutation'
import type { FetchDirection, Query, QueryBehavior } from './query'
import type { RetryDelayValue, RetryValue } from './retryer'
import type { QueryFilters, QueryTypeFilter, SkipToken } from './utils'
import type { QueryCache } from './queryCache'
import type { MutationCache } from './mutationCache'

/**
 * Excludes `undefined` from `T`. Used where a value must be defined, such as the data type that a
 * defined `initialData` resolves to.
 */
export type NonUndefinedGuard<T> = T extends undefined ? never : T

/**
 * Like `Omit`, but applied to each member of a union separately, so each member keeps its own keys.
 */
export type DistributiveOmit<
  TObject,
  TKey extends keyof TObject,
> = TObject extends any ? Omit<TObject, TKey> : never

/**
 * Like `Omit`, but by default (`'strictly'`) `TKey` must be a key of `TObject`, so omitting a key
 * that doesn't exist is a type error. Pass `'safely'` to allow other keys too.
 */
export type OmitKeyof<
  TObject,
  TKey extends (TStrictly extends 'safely'
    ? | keyof TObject
      | (string & Record<never, never>)
      | (number & Record<never, never>)
      | (symbol & Record<never, never>)
    : keyof TObject),
  TStrictly extends 'strictly' | 'safely' = 'strictly',
> = Omit<TObject, TKey>

/**
 * Replaces the types of the properties of `TTargetA` that also exist in `TTargetB` with their types
 * in `TTargetB`. Properties that only exist in `TTargetB` are not added.
 */
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
/**
 * The type of the `dataTagSymbol` key, under which a {@link DataTag} stores its data type.
 */
export type dataTagSymbol = typeof dataTagSymbol
export const dataTagErrorSymbol = Symbol()
/**
 * The type of the `dataTagErrorSymbol` key, under which a {@link DataTag} stores its error type.
 */
export type dataTagErrorSymbol = typeof dataTagErrorSymbol
export const unsetMarker = Symbol()
/**
 * The type of `unsetMarker`, the default error type of a {@link DataTag}. It marks that no error
 * type was tagged.
 */
export type UnsetMarker = typeof unsetMarker
/**
 * Matches any type that has been tagged with {@link DataTag}, whatever its data and error types.
 */
export type AnyDataTag = {
  /**
   * The data type the key was tagged with.
   */
  [dataTagSymbol]: any
  /**
   * The error type the key was tagged with.
   */
  [dataTagErrorSymbol]: any
}
/**
 * Tags `TType` (usually a query key) with a data type and an optional error type, so that APIs that
 * receive it, like `queryClient.getQueryData`, can infer them. A type that is already tagged is
 * returned as is.
 */
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

/**
 * An object whose `queryKey` is tagged with {@link DataTag}, like the options returned by
 * `queryOptions`.
 */
export type QueryKeyWithDataTag<
  TQueryKey extends QueryKey = QueryKey,
  TQueryFnData = unknown,
  TError = DefaultError,
> = {
  /**
   * The query key, tagged with the query's data and error types.
   */
  queryKey: DataTag<TQueryKey, TQueryFnData, TError>
}

/**
 * The data type tagged on a query key by {@link DataTag}, or `TQueryFnData` if the key is not
 * tagged.
 */
export type InferDataFromTag<TQueryFnData, TTaggedQueryKey extends QueryKey> =
  TTaggedQueryKey extends DataTag<unknown, infer TaggedValue, unknown>
    ? TaggedValue
    : TQueryFnData

/**
 * The error type tagged on a query key by {@link DataTag}, or `TError` if the key is not tagged or
 * was tagged without an error type.
 */
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
  boolean | ((query: Query<TQueryFnData, TError, TData, TQueryKey>) => boolean)

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

/**
 * The `placeholderData` function of a query in `useQueries` and its counterparts. Unlike
 * {@link PlaceholderDataFunction}, it receives no previous data or query, because the number of
 * queries can differ between renders.
 */
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
  /**
   * The data of every page fetched so far, in order.
   */
  pages: Array<TData>
  /**
   * The page param each page was fetched with, aligned by index with `pages`.
   */
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

/**
 * The options of a query itself — its `queryKey`, `queryFn`, retries, `gcTime`, `initialData`,
 * `meta`, and so on — shared by observers and the `QueryClient` methods that fetch queries.
 */
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
   * @defaultValue true
   */
  structuralSharing?:
    boolean | ((oldData: unknown | undefined, newData: unknown) => unknown)
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

/**
 * Holds the `initialPageParam` option that every infinite query requires.
 */
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

/**
 * The page param options of an infinite query: `initialPageParam`, and the `getNextPageParam` and
 * `getPreviousPageParam` functions that compute the params of the pages around it.
 */
export type InfiniteQueryMode = 'manual'

export interface InfiniteQueryPageParamsDeclarativeOptions<
  TQueryFnData = unknown,
  TPageParam = unknown,
> extends InitialPageParam<TPageParam> {
  mode?: never
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

export interface InfiniteQueryPageParamsManualOptions<
  TPageParam = unknown,
> extends InitialPageParam<TPageParam> {
  mode: InfiniteQueryMode
  getPreviousPageParam?: never
  getNextPageParam?: never
}

/**
 * The page param options of an infinite query: `initialPageParam`, and the `getNextPageParam` and
 * `getPreviousPageParam` functions that compute the params of the pages around it.
 */
export type InfiniteQueryPageParamsOptions<
  TQueryFnData = unknown,
  TPageParam = unknown,
  TMode extends FetchPageDirectionMode = FetchPageDirectionMode,
> = TMode extends FetchPageDirectionMode
  ? TMode extends InfiniteQueryMode
    ? InfiniteQueryPageParamsManualOptions<TPageParam>
    : InfiniteQueryPageParamsDeclarativeOptions<TQueryFnData, TPageParam>
  : never

export type FetchPageDirectionMode = InfiniteQueryMode | undefined

export interface ManualFetchPageOptions<TPageParam> {
  /**
   * The page param to pass to the query function for this manual fetch.
   */
  pageParam: TPageParam
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

/**
 * The options of a `QueryObserver`, and of the hooks built on it like `useQuery`: the
 * {@link QueryOptions} of the query, plus options that control the observer, such as `enabled`,
 * `staleTime`, `refetchInterval`, `select`, and `placeholderData`.
 */
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
  /**
   * If set to a number, the query will continuously refetch at this frequency in milliseconds.
   * If set to a function, the function will be executed with the latest data and query to compute a frequency
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
   * @defaultValue false
   */
  refetchIntervalInBackground?: boolean
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

/**
 * Makes the `TKey` properties of `TTarget` required and non-nullable.
 */
export type WithRequired<TTarget, TKey extends keyof TTarget> = TTarget & {
  [_ in TKey]: {}
}

/**
 * The {@link QueryObserverOptions} after `QueryClient#defaultQueryOptions` has applied the
 * defaults, so `throwOnError`, `refetchOnReconnect`, and `queryHash` are always set.
 */
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

/**
 * The options of an `InfiniteQueryObserver`: {@link QueryObserverOptions} whose query data is
 * {@link InfiniteData}, plus the page param options.
 */
export type InfiniteQueryObserverOptionsBase<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
  TMode extends FetchPageDirectionMode = undefined,
> = QueryObserverOptions<
  TQueryFnData,
  TError,
  TData,
  InfiniteData<TQueryFnData, TPageParam>,
  TQueryKey,
  TPageParam
> &
  InfiniteQueryPageParamsOptions<TQueryFnData, TPageParam, TMode>

/**
 * The options of an `InfiniteQueryObserver`: {@link QueryObserverOptions} whose query data is
 * {@link InfiniteData}, plus the page param options.
 */
export type InfiniteQueryObserverOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
  TMode extends FetchPageDirectionMode = FetchPageDirectionMode,
> = TMode extends FetchPageDirectionMode
  ? InfiniteQueryObserverOptionsBase<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam,
      TMode
    >
  : never

export type DefaultedInfiniteQueryObserverOptionsBase<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
  TMode extends FetchPageDirectionMode = undefined,
> = WithRequired<
  InfiniteQueryObserverOptionsBase<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam,
    TMode
  >,
  'throwOnError' | 'refetchOnReconnect' | 'queryHash'
>

/**
 * The {@link InfiniteQueryObserverOptions} after `QueryClient#defaultQueryOptions` has applied the
 * defaults, so `throwOnError`, `refetchOnReconnect`, and `queryHash` are always set.
 */
export type DefaultedInfiniteQueryObserverOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
  TMode extends FetchPageDirectionMode = FetchPageDirectionMode,
> = TMode extends FetchPageDirectionMode
  ? DefaultedInfiniteQueryObserverOptionsBase<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam,
      TMode
    >
  : never

/**
 * The options of `queryClient.query`: the {@link QueryOptions} of the query, plus a `staleTime`
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
> extends WithRequired<
  QueryOptions<TQueryFnData, TError, TQueryData, TQueryKey, TPageParam>,
  'queryKey'
> {
  /**
   * Not allowed here, since `initialPageParam` only applies to infinite queries.
   */
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
  /**
   * Not allowed here, since `initialPageParam` only applies to infinite queries.
   */
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
  /**
   * If `true`, stale cached data is returned and also refetched in the background.
   */
  revalidateIfStale?: boolean
}

export type EnsureInfiniteQueryDataOptionsBase<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
  TMode extends FetchPageDirectionMode = undefined,
> = FetchInfiniteQueryOptionsBase<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam,
  TMode
> & {
  revalidateIfStale?: boolean
}

/** @deprecated */
export type EnsureInfiniteQueryDataOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
  TMode extends FetchPageDirectionMode = FetchPageDirectionMode,
> = TMode extends FetchPageDirectionMode
  ? EnsureInfiniteQueryDataOptionsBase<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam,
      TMode
    >
  : never

type InfiniteQueryPages<TQueryFnData = unknown, TPageParam = unknown> =
  | { pages?: never }
  | {
      pages: number
      getNextPageParam: GetNextPageParamFunction<TPageParam, TQueryFnData>
    }

interface FetchInfiniteQueryPageParamsDeclarativeOptions<
  TQueryFnData = unknown,
  TPageParam = unknown,
> extends InitialPageParam<TPageParam> {
  mode?: never
  getPreviousPageParam?: GetPreviousPageParamFunction<TPageParam, TQueryFnData>
  getNextPageParam?: GetNextPageParamFunction<TPageParam, TQueryFnData>
}

type FetchInfiniteQueryPageParamsOptions<
  TQueryFnData = unknown,
  TPageParam = unknown,
  TMode extends FetchPageDirectionMode = FetchPageDirectionMode,
> = TMode extends FetchPageDirectionMode
  ? TMode extends InfiniteQueryMode
    ? InfiniteQueryPageParamsManualOptions<TPageParam>
    : FetchInfiniteQueryPageParamsDeclarativeOptions<TQueryFnData, TPageParam>
  : never

type FetchInfiniteQueryPages<
  TQueryFnData = unknown,
  TPageParam = unknown,
  TMode extends FetchPageDirectionMode = FetchPageDirectionMode,
> = TMode extends FetchPageDirectionMode
  ? TMode extends InfiniteQueryMode
    ? {
        mode: InfiniteQueryMode
        pages?: never
        getNextPageParam?: never
        getPreviousPageParam?: never
      }
    : InfiniteQueryPages<TQueryFnData, TPageParam>
  : never

/**
 * The options of `queryClient.infiniteQuery`: like {@link QueryExecuteOptions}, with the
 * `initialPageParam`, and optionally `pages` together with `getNextPageParam` to fetch that many
 * pages at once.
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
  InitialPageParam<TPageParam> &
  InfiniteQueryPages<TQueryFnData, TPageParam>

/** @deprecated */
export type FetchInfiniteQueryOptionsBase<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
  TMode extends FetchPageDirectionMode = undefined,
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
  FetchInfiniteQueryPageParamsOptions<TQueryFnData, TPageParam, TMode> &
  FetchInfiniteQueryPages<TQueryFnData, TPageParam, TMode>

/** @deprecated */
export type FetchInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
  TMode extends FetchPageDirectionMode = FetchPageDirectionMode,
> = TMode extends FetchPageDirectionMode
  ? FetchInfiniteQueryOptionsBase<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam,
      TMode
    >
  : never

/**
 * Options shared by the `QueryClient` and observer methods that refetch queries, controlling
 * whether a failed refetch makes the returned promise reject.
 */
export interface ResultOptions {
  /**
   * If set to `true`, the method throws if any of the underlying query refetch tasks fail.
   * If set to `false`, failed refetches are swallowed and not surfaced to the caller.
   * @defaultValue false
   */
  throwOnError?: boolean
}

/**
 * Options of the methods that refetch queries, like `refetch` and `queryClient.refetchQueries`.
 */
export interface RefetchOptions extends ResultOptions {
  /**
   * If set to `true`, a currently running request will be cancelled before a new request is made
   *
   * If set to `false`, no refetch will be made if there is already a request running.
   * @defaultValue true
   */
  cancelRefetch?: boolean
}

/**
 * The filters of `queryClient.invalidateQueries`: the {@link QueryFilters} that select the queries
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
 * The filters of `queryClient.refetchQueries`, which select the queries to refetch.
 */
export interface RefetchQueryFilters<
  TQueryKey extends QueryKey = QueryKey,
> extends QueryFilters<TQueryKey> {}

/**
 * Options of `queryClient.invalidateQueries`, applied to the refetch that follows the invalidation.
 */
export interface InvalidateOptions extends RefetchOptions {}
/**
 * Options of `queryClient.resetQueries`, applied to the refetch of the active queries after the
 * reset.
 */
export interface ResetOptions extends RefetchOptions {}

/**
 * Options of `fetchNextPage` on an infinite query result.
 */
export interface FetchNextPageOptions extends ResultOptions {
  /**
   * If set to `true`, calling `fetchNextPage` repeatedly will invoke `queryFn` every time,
   * whether the previous invocation has resolved or not. Also, the result from previous invocations will be ignored.
   *
   * If set to `false`, calling `fetchNextPage` repeatedly won't have any effect until the first invocation has resolved.
   * @defaultValue true
   */
  cancelRefetch?: boolean
}

/**
 * Options of `fetchPreviousPage` on an infinite query result.
 */
export interface FetchPreviousPageOptions extends ResultOptions {
  /**
   * If set to `true`, calling `fetchPreviousPage` repeatedly will invoke `queryFn` every time,
   * whether the previous invocation has resolved or not. Also, the result from previous invocations will be ignored.
   *
   * If set to `false`, calling `fetchPreviousPage` repeatedly won't have any effect until the first invocation has resolved.
   * @defaultValue true
   */
  cancelRefetch?: boolean
}

export type InfiniteQueryFetchNextPageOptions<
  TPageParam = unknown,
  TMode extends FetchPageDirectionMode = undefined,
> = TMode extends InfiniteQueryMode
  ? ManualFetchPageOptions<TPageParam> & FetchNextPageOptions
  : FetchNextPageOptions

export type InfiniteQueryFetchPreviousPageOptions<
  TPageParam = unknown,
  TMode extends FetchPageDirectionMode = undefined,
> = TMode extends InfiniteQueryMode
  ? ManualFetchPageOptions<TPageParam> & FetchPreviousPageOptions
  : FetchPreviousPageOptions

export type InfiniteQueryFetchNextPageArgs<
  TPageParam = unknown,
  TMode extends FetchPageDirectionMode = undefined,
> = TMode extends InfiniteQueryMode
  ? [options: InfiniteQueryFetchNextPageOptions<TPageParam, TMode>]
  : [options?: InfiniteQueryFetchNextPageOptions<TPageParam, TMode>]

export type InfiniteQueryFetchPreviousPageArgs<
  TPageParam = unknown,
  TMode extends FetchPageDirectionMode = undefined,
> = TMode extends InfiniteQueryMode
  ? [options: InfiniteQueryFetchPreviousPageOptions<TPageParam, TMode>]
  : [options?: InfiniteQueryFetchPreviousPageOptions<TPageParam, TMode>]

/** @inline */
export type QueryStatus = 'pending' | 'error' | 'success'
/** @inline */
export type FetchStatus = 'fetching' | 'paused' | 'idle'

/**
 * The properties shared by every state of a query result, like `data`, `error`, `status`, the
 * `is*` flags, and `refetch`. Each `QueryObserver*Result` narrows them for one state.
 */
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

/**
 * A query result in the `pending` state: the query has no data yet.
 */
export interface QueryObserverPendingResult<
  TData = unknown,
  TError = DefaultError,
> extends QueryObserverBaseResult<TData, TError> {
  /**
   * `undefined`, since the query has no data yet.
   */
  data: undefined
  /**
   * `null`, since the query isn't in the `error` state.
   */
  error: null
  /**
   * `false`, since the query isn't in the `error` state.
   */
  isError: false
  /**
   * `true`, since there's no cached data and no query attempt has finished yet.
   */
  isPending: true
  /**
   * `false`, since the query didn't fail while fetching for the first time.
   */
  isLoadingError: false
  /**
   * `false`, since the query didn't fail while refetching.
   */
  isRefetchError: false
  /**
   * `false`, since the query isn't in the `success` state.
   */
  isSuccess: false
  /**
   * `false`, since the data shown isn't the `placeholderData`.
   */
  isPlaceholderData: false
  /**
   * `'pending'`, since there's no cached data and no query attempt has finished yet.
   */
  status: 'pending'
}

/**
 * A query result in the `pending` state while the first fetch is in flight, so `isLoading` is
 * `true`.
 */
export interface QueryObserverLoadingResult<
  TData = unknown,
  TError = DefaultError,
> extends QueryObserverBaseResult<TData, TError> {
  /**
   * `undefined`, since the query has no data yet.
   */
  data: undefined
  /**
   * `null`, since the query isn't in the `error` state.
   */
  error: null
  /**
   * `false`, since the query isn't in the `error` state.
   */
  isError: false
  /**
   * `true`, since there's no cached data and no query attempt has finished yet.
   */
  isPending: true
  /**
   * `true`, since the first fetch is in flight.
   */
  isLoading: true
  /**
   * `false`, since the query didn't fail while fetching for the first time.
   */
  isLoadingError: false
  /**
   * `false`, since the query didn't fail while refetching.
   */
  isRefetchError: false
  /**
   * `false`, since the query isn't in the `success` state.
   */
  isSuccess: false
  /**
   * `false`, since the data shown isn't the `placeholderData`.
   */
  isPlaceholderData: false
  /**
   * `'pending'`, since there's no cached data and no query attempt has finished yet.
   */
  status: 'pending'
}

/**
 * A query result in the `error` state when the first fetch failed, so there is no data.
 */
export interface QueryObserverLoadingErrorResult<
  TData = unknown,
  TError = DefaultError,
> extends QueryObserverBaseResult<TData, TError> {
  /**
   * `undefined`, since the first fetch failed before any data was cached.
   */
  data: undefined
  /**
   * The error the first fetch failed with.
   */
  error: TError
  /**
   * `true`, since the query is in the `error` state.
   */
  isError: true
  /**
   * `false`, since the query has data or a query attempt has finished.
   */
  isPending: false
  /**
   * `false`, since the first fetch isn't in flight.
   */
  isLoading: false
  /**
   * `true`, since the query failed while fetching for the first time.
   */
  isLoadingError: true
  /**
   * `false`, since the query didn't fail while refetching.
   */
  isRefetchError: false
  /**
   * `false`, since the query isn't in the `success` state.
   */
  isSuccess: false
  /**
   * `false`, since the data shown isn't the `placeholderData`.
   */
  isPlaceholderData: false
  /**
   * `'error'`, since the query attempt resulted in an error.
   */
  status: 'error'
}

/**
 * A query result in the `error` state when a refetch failed, so the data from before is kept.
 */
export interface QueryObserverRefetchErrorResult<
  TData = unknown,
  TError = DefaultError,
> extends QueryObserverBaseResult<TData, TError> {
  /**
   * The data from before the failed refetch, which is kept.
   */
  data: TData
  /**
   * The error the refetch failed with.
   */
  error: TError
  /**
   * `true`, since the query is in the `error` state.
   */
  isError: true
  /**
   * `false`, since the query has data or a query attempt has finished.
   */
  isPending: false
  /**
   * `false`, since the first fetch isn't in flight.
   */
  isLoading: false
  /**
   * `false`, since the query didn't fail while fetching for the first time.
   */
  isLoadingError: false
  /**
   * `true`, since the query failed while refetching.
   */
  isRefetchError: true
  /**
   * `false`, since the query isn't in the `success` state.
   */
  isSuccess: false
  /**
   * `false`, since the data shown isn't the `placeholderData`.
   */
  isPlaceholderData: false
  /**
   * `'error'`, since the query attempt resulted in an error.
   */
  status: 'error'
}

/**
 * A query result in the `success` state with data from the cache.
 */
export interface QueryObserverSuccessResult<
  TData = unknown,
  TError = DefaultError,
> extends QueryObserverBaseResult<TData, TError> {
  /**
   * The last successfully resolved data for the query.
   */
  data: TData
  /**
   * `null`, since the query isn't in the `error` state.
   */
  error: null
  /**
   * `false`, since the query isn't in the `error` state.
   */
  isError: false
  /**
   * `false`, since the query has data or a query attempt has finished.
   */
  isPending: false
  /**
   * `false`, since the first fetch isn't in flight.
   */
  isLoading: false
  /**
   * `false`, since the query didn't fail while fetching for the first time.
   */
  isLoadingError: false
  /**
   * `false`, since the query didn't fail while refetching.
   */
  isRefetchError: false
  /**
   * `true`, since the query is in the `success` state.
   */
  isSuccess: true
  /**
   * `false`, since the data shown isn't the `placeholderData`.
   */
  isPlaceholderData: false
  /**
   * `'success'`, since the query has received a response with no errors and is ready to display its
   * data.
   */
  status: 'success'
}

/**
 * A query result in the `success` state that shows `placeholderData` while the query has no data
 * yet.
 */
export interface QueryObserverPlaceholderResult<
  TData = unknown,
  TError = DefaultError,
> extends QueryObserverBaseResult<TData, TError> {
  /**
   * The `placeholderData` shown while the query has no data yet.
   */
  data: TData
  /**
   * `false`, since the query isn't in the `error` state.
   */
  isError: false
  /**
   * `null`, since the query isn't in the `error` state.
   */
  error: null
  /**
   * `false`, since the query has data or a query attempt has finished.
   */
  isPending: false
  /**
   * `false`, since the first fetch isn't in flight.
   */
  isLoading: false
  /**
   * `false`, since the query didn't fail while fetching for the first time.
   */
  isLoadingError: false
  /**
   * `false`, since the query didn't fail while refetching.
   */
  isRefetchError: false
  /**
   * `true`, since the query is in the `success` state.
   */
  isSuccess: true
  /**
   * `true`, since the data shown is the `placeholderData`.
   */
  isPlaceholderData: true
  /**
   * `'success'`, since the query has received a response with no errors and is ready to display its
   * data.
   */
  status: 'success'
}

/**
 * A query result that always has `data`: the success and refetch error states.
 */
export type DefinedQueryObserverResult<TData = unknown, TError = DefaultError> =
  | QueryObserverRefetchErrorResult<TData, TError>
  | QueryObserverSuccessResult<TData, TError>

/**
 * The result of a `QueryObserver`, and of the hooks built on it like `useQuery`. Narrow it by
 * `status` or the `is*` flags to get the type of each state.
 */
export type QueryObserverResult<TData = unknown, TError = DefaultError> =
  | DefinedQueryObserverResult<TData, TError>
  | QueryObserverLoadingErrorResult<TData, TError>
  | QueryObserverLoadingResult<TData, TError>
  | QueryObserverPendingResult<TData, TError>
  | QueryObserverPlaceholderResult<TData, TError>

/**
 * The properties shared by every state of an infinite query result: those of
 * {@link QueryObserverBaseResult}, plus `fetchNextPage`, `fetchPreviousPage`, and the flags about
 * them, like `hasNextPage` and `isFetchingNextPage`.
 */
export interface InfiniteQueryObserverBaseResult<
  TData = unknown,
  TError = DefaultError,
  TPageParam = unknown,
  TMode extends FetchPageDirectionMode = undefined,
> extends QueryObserverBaseResult<TData, TError> {
  /**
   * This function allows you to fetch the next "page" of results.
   */
  fetchNextPage: (
    ...args: InfiniteQueryFetchNextPageArgs<TPageParam, TMode>
  ) => Promise<InfiniteQueryObserverResult<TData, TError, TPageParam, TMode>>
  /**
   * This function allows you to fetch the previous "page" of results.
   */
  fetchPreviousPage: (
    ...args: InfiniteQueryFetchPreviousPageArgs<TPageParam, TMode>
  ) => Promise<InfiniteQueryObserverResult<TData, TError, TPageParam, TMode>>
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

/**
 * An infinite query result in the `pending` state: the query has no data yet.
 */
export interface InfiniteQueryObserverPendingResult<
  TData = unknown,
  TError = DefaultError,
  TPageParam = unknown,
  TMode extends FetchPageDirectionMode = undefined,
> extends InfiniteQueryObserverBaseResult<TData, TError, TPageParam, TMode> {
  /**
   * `undefined`, since the query has no data yet.
   */
  data: undefined
  /**
   * `null`, since the query isn't in the `error` state.
   */
  error: null
  /**
   * `false`, since the query isn't in the `error` state.
   */
  isError: false
  /**
   * `true`, since there's no cached data and no query attempt has finished yet.
   */
  isPending: true
  /**
   * `false`, since the query didn't fail while fetching for the first time.
   */
  isLoadingError: false
  /**
   * `false`, since the query didn't fail while refetching.
   */
  isRefetchError: false
  /**
   * `false`, since fetching the next page didn't fail.
   */
  isFetchNextPageError: false
  /**
   * `false`, since fetching the previous page didn't fail.
   */
  isFetchPreviousPageError: false
  /**
   * `false`, since the query isn't in the `success` state.
   */
  isSuccess: false
  /**
   * `false`, since the data shown isn't the `placeholderData`.
   */
  isPlaceholderData: false
  /**
   * `'pending'`, since there's no cached data and no query attempt has finished yet.
   */
  status: 'pending'
}

/**
 * An infinite query result in the `pending` state while the first fetch is in flight, so
 * `isLoading` is `true`.
 */
export interface InfiniteQueryObserverLoadingResult<
  TData = unknown,
  TError = DefaultError,
  TPageParam = unknown,
  TMode extends FetchPageDirectionMode = undefined,
> extends InfiniteQueryObserverBaseResult<TData, TError, TPageParam, TMode> {
  /**
   * `undefined`, since the query has no data yet.
   */
  data: undefined
  /**
   * `null`, since the query isn't in the `error` state.
   */
  error: null
  /**
   * `false`, since the query isn't in the `error` state.
   */
  isError: false
  /**
   * `true`, since there's no cached data and no query attempt has finished yet.
   */
  isPending: true
  /**
   * `true`, since the first fetch is in flight.
   */
  isLoading: true
  /**
   * `false`, since the query didn't fail while fetching for the first time.
   */
  isLoadingError: false
  /**
   * `false`, since the query didn't fail while refetching.
   */
  isRefetchError: false
  /**
   * `false`, since fetching the next page didn't fail.
   */
  isFetchNextPageError: false
  /**
   * `false`, since fetching the previous page didn't fail.
   */
  isFetchPreviousPageError: false
  /**
   * `false`, since the query isn't in the `success` state.
   */
  isSuccess: false
  /**
   * `false`, since the data shown isn't the `placeholderData`.
   */
  isPlaceholderData: false
  /**
   * `'pending'`, since there's no cached data and no query attempt has finished yet.
   */
  status: 'pending'
}

/**
 * An infinite query result in the `error` state when the first fetch failed, so there is no data.
 */
export interface InfiniteQueryObserverLoadingErrorResult<
  TData = unknown,
  TError = DefaultError,
  TPageParam = unknown,
  TMode extends FetchPageDirectionMode = undefined,
> extends InfiniteQueryObserverBaseResult<TData, TError, TPageParam, TMode> {
  /**
   * `undefined`, since the first fetch failed before any data was cached.
   */
  data: undefined
  /**
   * The error the first fetch failed with.
   */
  error: TError
  /**
   * `true`, since the query is in the `error` state.
   */
  isError: true
  /**
   * `false`, since the query has data or a query attempt has finished.
   */
  isPending: false
  /**
   * `false`, since the first fetch isn't in flight.
   */
  isLoading: false
  /**
   * `true`, since the query failed while fetching for the first time.
   */
  isLoadingError: true
  /**
   * `false`, since the query didn't fail while refetching.
   */
  isRefetchError: false
  /**
   * `false`, since fetching the next page didn't fail.
   */
  isFetchNextPageError: false
  /**
   * `false`, since fetching the previous page didn't fail.
   */
  isFetchPreviousPageError: false
  /**
   * `false`, since the query isn't in the `success` state.
   */
  isSuccess: false
  /**
   * `false`, since the data shown isn't the `placeholderData`.
   */
  isPlaceholderData: false
  /**
   * `'error'`, since the query attempt resulted in an error.
   */
  status: 'error'
}

/**
 * An infinite query result in the `error` state when a refetch failed, so the data from before is
 * kept.
 */
export interface InfiniteQueryObserverRefetchErrorResult<
  TData = unknown,
  TError = DefaultError,
  TPageParam = unknown,
  TMode extends FetchPageDirectionMode = undefined,
> extends InfiniteQueryObserverBaseResult<TData, TError, TPageParam, TMode> {
  /**
   * The data from before the failed refetch, which is kept.
   */
  data: TData
  /**
   * The error the refetch failed with.
   */
  error: TError
  /**
   * `true`, since the query is in the `error` state.
   */
  isError: true
  /**
   * `false`, since the query has data or a query attempt has finished.
   */
  isPending: false
  /**
   * `false`, since the first fetch isn't in flight.
   */
  isLoading: false
  /**
   * `false`, since the query didn't fail while fetching for the first time.
   */
  isLoadingError: false
  /**
   * `true`, since the query failed while refetching.
   */
  isRefetchError: true
  /**
   * `false`, since the query isn't in the `success` state.
   */
  isSuccess: false
  /**
   * `false`, since the data shown isn't the `placeholderData`.
   */
  isPlaceholderData: false
  /**
   * `'error'`, since the query attempt resulted in an error.
   */
  status: 'error'
}

/**
 * An infinite query result in the `success` state with data from the cache.
 */
export interface InfiniteQueryObserverSuccessResult<
  TData = unknown,
  TError = DefaultError,
  TPageParam = unknown,
  TMode extends FetchPageDirectionMode = undefined,
> extends InfiniteQueryObserverBaseResult<TData, TError, TPageParam, TMode> {
  /**
   * The last successfully resolved data for the query.
   */
  data: TData
  /**
   * `null`, since the query isn't in the `error` state.
   */
  error: null
  /**
   * `false`, since the query isn't in the `error` state.
   */
  isError: false
  /**
   * `false`, since the query has data or a query attempt has finished.
   */
  isPending: false
  /**
   * `false`, since the first fetch isn't in flight.
   */
  isLoading: false
  /**
   * `false`, since the query didn't fail while fetching for the first time.
   */
  isLoadingError: false
  /**
   * `false`, since the query didn't fail while refetching.
   */
  isRefetchError: false
  /**
   * `false`, since fetching the next page didn't fail.
   */
  isFetchNextPageError: false
  /**
   * `false`, since fetching the previous page didn't fail.
   */
  isFetchPreviousPageError: false
  /**
   * `true`, since the query is in the `success` state.
   */
  isSuccess: true
  /**
   * `false`, since the data shown isn't the `placeholderData`.
   */
  isPlaceholderData: false
  /**
   * `'success'`, since the query has received a response with no errors and is ready to display its
   * data.
   */
  status: 'success'
}

/**
 * An infinite query result in the `success` state that shows `placeholderData` while the query has
 * no data yet.
 */
export interface InfiniteQueryObserverPlaceholderResult<
  TData = unknown,
  TError = DefaultError,
  TPageParam = unknown,
  TMode extends FetchPageDirectionMode = undefined,
> extends InfiniteQueryObserverBaseResult<TData, TError, TPageParam, TMode> {
  /**
   * The `placeholderData` shown while the query has no data yet.
   */
  data: TData
  /**
   * `false`, since the query isn't in the `error` state.
   */
  isError: false
  /**
   * `null`, since the query isn't in the `error` state.
   */
  error: null
  /**
   * `false`, since the query has data or a query attempt has finished.
   */
  isPending: false
  /**
   * `false`, since the first fetch isn't in flight.
   */
  isLoading: false
  /**
   * `false`, since the query didn't fail while fetching for the first time.
   */
  isLoadingError: false
  /**
   * `false`, since the query didn't fail while refetching.
   */
  isRefetchError: false
  /**
   * `true`, since the query is in the `success` state.
   */
  isSuccess: true
  /**
   * `true`, since the data shown is the `placeholderData`.
   */
  isPlaceholderData: true
  /**
   * `false`, since fetching the next page didn't fail.
   */
  isFetchNextPageError: false
  /**
   * `false`, since fetching the previous page didn't fail.
   */
  isFetchPreviousPageError: false
  /**
   * `'success'`, since the query has received a response with no errors and is ready to display its
   * data.
   */
  status: 'success'
}

/**
 * An infinite query result that always has `data`: the success and refetch error states.
 */
export type DefinedInfiniteQueryObserverResult<
  TData = unknown,
  TError = DefaultError,
  TPageParam = unknown,
  TMode extends FetchPageDirectionMode = undefined,
> =
  | InfiniteQueryObserverRefetchErrorResult<TData, TError, TPageParam, TMode>
  | InfiniteQueryObserverSuccessResult<TData, TError, TPageParam, TMode>

/**
 * The result of an `InfiniteQueryObserver`, and of the hooks built on it like `useInfiniteQuery`.
 * Narrow it by `status` or the `is*` flags to get the type of each state.
 */
export type InfiniteQueryObserverResult<
  TData = unknown,
  TError = DefaultError,
  TPageParam = unknown,
  TMode extends FetchPageDirectionMode = undefined,
> =
  | DefinedInfiniteQueryObserverResult<TData, TError, TPageParam, TMode>
  | InfiniteQueryObserverLoadingErrorResult<TData, TError, TPageParam, TMode>
  | InfiniteQueryObserverLoadingResult<TData, TError, TPageParam, TMode>
  | InfiniteQueryObserverPendingResult<TData, TError, TPageParam, TMode>
  | InfiniteQueryObserverPlaceholderResult<TData, TError, TPageParam, TMode>

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
  /**
   * The scope's identifier. Mutations with the same `id` run one after another.
   */
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

/**
 * The object passed to `mutationFn` and the mutation callbacks: the `QueryClient`, the mutation's
 * `meta`, and its `mutationKey`.
 */
export type MutationFunctionContext = {
  /**
   * The `QueryClient` the mutation runs in.
   */
  client: QueryClient
  /**
   * The `meta` of the mutation options.
   */
  meta: MutationMeta | undefined
  /**
   * The `mutationKey` of the mutation options, if set.
   */
  mutationKey?: MutationKey
}

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

/**
 * The options of a `MutationObserver`, and of the hooks built on it like `useMutation`: the
 * {@link MutationOptions}, plus `throwOnError`.
 */
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
   * @defaultValue false
   */
  throwOnError?: boolean | ((error: TError) => boolean)
}

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

/**
 * The properties shared by every state of a mutation result, like `data`, `error`, `variables`,
 * `status`, the `is*` flags, `mutate`, and `reset`.
 */
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

/**
 * A mutation result in the `idle` state: the mutation hasn't run yet, or was reset.
 */
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
  /**
   * `undefined`, since the mutation hasn't run.
   */
  data: undefined
  /**
   * `undefined`, since the mutation hasn't run.
   */
  variables: undefined
  /**
   * `null`, since the mutation hasn't failed.
   */
  error: null
  /**
   * `false`, since the mutation hasn't failed.
   */
  isError: false
  /**
   * `true`, since the mutation hasn't run yet or was reset.
   */
  isIdle: true
  /**
   * `false`, since the mutation isn't running.
   */
  isPending: false
  /**
   * `false`, since the mutation hasn't succeeded.
   */
  isSuccess: false
  /**
   * `'idle'`, since the mutation hasn't run yet or was reset.
   */
  status: 'idle'
}

/**
 * A mutation result in the `pending` state while the mutation runs.
 */
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
  /**
   * `undefined`, since the mutation hasn't succeeded.
   */
  data: undefined
  /**
   * The variables passed to `mutate` for this mutation.
   */
  variables: TVariables
  /**
   * `null`, since the mutation hasn't failed.
   */
  error: null
  /**
   * `false`, since the mutation hasn't failed.
   */
  isError: false
  /**
   * `false`, since the mutation has run.
   */
  isIdle: false
  /**
   * `true`, since the mutation is running.
   */
  isPending: true
  /**
   * `false`, since the mutation hasn't succeeded.
   */
  isSuccess: false
  /**
   * `'pending'`, since the mutation is running.
   */
  status: 'pending'
}

/**
 * A mutation result in the `error` state after the mutation failed.
 */
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
  /**
   * `undefined`, since the mutation hasn't succeeded.
   */
  data: undefined
  /**
   * The error the mutation failed with.
   */
  error: TError
  /**
   * The variables passed to `mutate` for this mutation.
   */
  variables: TVariables
  /**
   * `true`, since the mutation failed.
   */
  isError: true
  /**
   * `false`, since the mutation has run.
   */
  isIdle: false
  /**
   * `false`, since the mutation isn't running.
   */
  isPending: false
  /**
   * `false`, since the mutation hasn't succeeded.
   */
  isSuccess: false
  /**
   * `'error'`, since the mutation failed.
   */
  status: 'error'
}

/**
 * A mutation result in the `success` state after the mutation succeeded.
 */
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
  /**
   * The data the mutation resolved with.
   */
  data: TData
  /**
   * `null`, since the mutation hasn't failed.
   */
  error: null
  /**
   * The variables passed to `mutate` for this mutation.
   */
  variables: TVariables
  /**
   * `false`, since the mutation hasn't failed.
   */
  isError: false
  /**
   * `false`, since the mutation has run.
   */
  isIdle: false
  /**
   * `false`, since the mutation isn't running.
   */
  isPending: false
  /**
   * `true`, since the mutation succeeded.
   */
  isSuccess: true
  /**
   * `'success'`, since the mutation succeeded.
   */
  status: 'success'
}

/**
 * The result of a `MutationObserver`, and of the hooks built on it like `useMutation`. Narrow it by
 * `status` or the `is*` flags to get the type of each state.
 */
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

/**
 * The options of `new QueryClient()`: the `queryCache` and `mutationCache` to use, and the
 * `defaultOptions` for its queries and mutations.
 */
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
    QueryObserverOptions<unknown, TError>,
    'suspense' | 'queryKey'
  >
  /** Default options applied to every mutation, unless overridden per-mutation. */
  mutations?: MutationObserverOptions<unknown, TError, unknown, unknown>
  /** Default options used when hydrating queries and mutations; see {@link HydrateOptions}. */
  hydrate?: HydrateOptions['defaultOptions']
  /** Default options used when dehydrating the client's caches; see {@link DehydrateOptions}. */
  dehydrate?: DehydrateOptions
}

/**
 * Options for cancelling an in-flight fetch, e.g. via `query.cancel()`.
 * They are carried on the {@link CancelledError} that the cancelled fetch rejects with.
 */
export interface CancelOptions {
  /**
   * If `true`, the query goes back to the state it had before the fetch started, instead of getting
   * the cancellation error.
   */
  revert?: boolean
  /**
   * If `true`, the cancellation error isn't surfaced, e.g. because another fetch replaces the
   * cancelled one.
   */
  silent?: boolean
}

/**
 * Options for writing data into the cache, e.g. via `queryClient.setQueryData()`.
 * `updatedAt` overrides the timestamp the data is recorded with, which is what staleness is measured from;
 * omit it to use the current time.
 */
export interface SetDataOptions {
  /**
   * The timestamp to record the data with, instead of the current time. Staleness is measured from
   * it.
   */
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

/**
 * The base shape of the events that the query and mutation caches send to their listeners.
 */
export interface NotifyEvent {
  /**
   * The kind of event, e.g. `'added'`, `'removed'`, or `'updated'`.
   */
  type: NotifyEventType
}
