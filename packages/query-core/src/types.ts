/* istanbul ignore file */

import type { MutationState } from './mutation'
import type { FetchDirection, Query, QueryBehavior } from './query'
import type { RetryDelayValue, RetryValue } from './retryer'
import type { QueryFilters, QueryTypeFilter } from './utils'
import type { QueryCache } from './queryCache'
import type { MutationCache } from './mutationCache'

export type NoInfer<T> = [T][T extends any ? 0 : never]

export interface Register {
  // defaultError: Error
  // queryMeta: Record<string, unknown>
  // mutationMeta: Record<string, unknown>
}

export type DefaultError = Register extends {
  defaultError: infer TError
}
  ? TError
  : Error

export type QueryKey = ReadonlyArray<unknown>

export declare const dataTagSymbol: unique symbol
export type DataTag<TType, TValue> = TType & {
  [dataTagSymbol]: TValue
}

export type QueryFunction<
  T = unknown,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> = (context: QueryFunctionContext<TQueryKey, TPageParam>) => T | Promise<T>

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
      queryKey: TQueryKey
      signal: AbortSignal
      meta: QueryMeta | undefined
    }
  : {
      queryKey: TQueryKey
      signal: AbortSignal
      pageParam: TPageParam
      direction: FetchDirection
      meta: QueryMeta | undefined
    }

export type InitialDataFunction<T> = () => T | undefined

type NonFunctionGuard<T> = T extends Function ? never : T

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

export type QueryKeyHashFunction<TQueryKey extends QueryKey> = (
  queryKey: TQueryKey,
) => string

export type GetPreviousPageParamFunction<TPageParam, TQueryFnData = unknown> = (
  firstPage: TQueryFnData,
  allPages: Array<TQueryFnData>,
  firstPageParam: TPageParam,
  allPageParams: Array<TPageParam>,
) => TPageParam | undefined | null

export type GetNextPageParamFunction<TPageParam, TQueryFnData = unknown> = (
  lastPage: TQueryFnData,
  allPages: Array<TQueryFnData>,
  lastPageParam: TPageParam,
  allPageParams: Array<TPageParam>,
) => TPageParam | undefined | null

export interface InfiniteData<TData, TPageParam = unknown> {
  pages: Array<TData>
  pageParams: Array<TPageParam>
}

export type QueryMeta = Register extends {
  queryMeta: infer TQueryMeta
}
  ? TQueryMeta extends Record<string, unknown>
    ? TQueryMeta
    : Record<string, unknown>
  : Record<string, unknown>

export type NetworkMode = 'online' | 'always' | 'offlineFirst'

export type NotifyOnChangeProps =
  | Array<keyof InfiniteQueryObserverResult>
  | 'all'
  | (() => Array<keyof InfiniteQueryObserverResult> | 'all')

export interface QueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
> {
  /**
   * If `false`, failed queries will not retry by default.
   * If `true`, failed queries will retry infinitely., failureCount: num
   * If set to an integer number, e.g. 3, failed queries will retry until the failed query count meets that number.
   * If set to a function `(failureCount, error) => boolean` failed queries will retry until the function returns false.
   */
  retry?: RetryValue<TError>
  retryDelay?: RetryDelayValue<TError>
  networkMode?: NetworkMode
  /**
   * The time in milliseconds that unused/inactive cache data remains in memory.
   * When a query's cache becomes unused or inactive, that cache data will be garbage collected after this duration.
   * When different garbage collection times are specified, the longest one will be used.
   * Setting it to `Infinity` will disable garbage collection.
   */
  gcTime?: number
  queryFn?: QueryFunction<TQueryFnData, TQueryKey, TPageParam>
  persister?: QueryPersister<
    NoInfer<TQueryFnData>,
    NoInfer<TQueryKey>,
    NoInfer<TPageParam>
  >
  queryHash?: string
  queryKey?: TQueryKey
  queryKeyHashFn?: QueryKeyHashFunction<TQueryKey>
  initialData?: TData | InitialDataFunction<TData>
  initialDataUpdatedAt?: number | (() => number | undefined)
  behavior?: QueryBehavior<TQueryFnData, TError, TData, TQueryKey>
  /**
   * Set this to `false` to disable structural sharing between query results.
   * Set this to a function which accepts the old and new data and returns resolved data of the same type to implement custom structural sharing logic.
   * Defaults to `true`.
   */
  structuralSharing?: boolean | (<T>(oldData: T | undefined, newData: T) => T)
  _defaulted?: boolean
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
> extends QueryOptions<
    TQueryFnData,
    TError,
    TQueryData,
    TQueryKey,
    TPageParam
  > {
  /**
   * Set this to `false` to disable automatic refetching when the query mounts or changes query keys.
   * To refetch the query, use the `refetch` method returned from the `useQuery` instance.
   * Defaults to `true`.
   */
  enabled?: boolean
  /**
   * The time in milliseconds after data is considered stale.
   * If set to `Infinity`, the data will never be considered stale.
   */
  staleTime?: number
  /**
   * If set to a number, the query will continuously refetch at this frequency in milliseconds.
   * If set to a function, the function will be executed with the latest data and query to compute a frequency
   * Defaults to `false`.
   */
  refetchInterval?:
    | number
    | false
    | ((
        query: Query<TQueryFnData, TError, TQueryData, TQueryKey>,
      ) => number | false | undefined)
  /**
   * If set to `true`, the query will continue to refetch while their tab/window is in the background.
   * Defaults to `false`.
   */
  refetchIntervalInBackground?: boolean
  /**
   * If set to `true`, the query will refetch on window focus if the data is stale.
   * If set to `false`, the query will not refetch on window focus.
   * If set to `'always'`, the query will always refetch on window focus.
   * If set to a function, the function will be executed with the latest data and query to compute the value.
   * Defaults to `true`.
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
   * If set to `'always'`, the query will always refetch on reconnect.
   * If set to a function, the function will be executed with the latest data and query to compute the value.
   * Defaults to the value of `networkOnline` (`true`)
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
   * If set to `'always'`, the query will always refetch on mount.
   * If set to a function, the function will be executed with the latest data and query to compute the value
   * Defaults to `true`.
   */
  refetchOnMount?:
    | boolean
    | 'always'
    | ((
        query: Query<TQueryFnData, TError, TQueryData, TQueryKey>,
      ) => boolean | 'always')
  /**
   * If set to `false`, the query will not be retried on mount if it contains an error.
   * Defaults to `true`.
   */
  retryOnMount?: boolean
  /**
   * If set, the component will only re-render if any of the listed properties change.
   * When set to `['data', 'error']`, the component will only re-render when the `data` or `error` properties change.
   * When set to `'all'`, the component will re-render whenever a query is updated.
   * When set to a function, the function will be executed to compute the list of properties.
   * By default, access to properties will be tracked, and the component will only re-render when one of the tracked properties change.
   */
  notifyOnChangeProps?: NotifyOnChangeProps
  /**
   * Whether errors should be thrown instead of setting the `error` property.
   * If set to `true` or `suspense` is `true`, all errors will be thrown to the error boundary.
   * If set to `false` and `suspense` is `false`, errors are returned as state.
   * If set to a function, it will be passed the error and the query, and it should return a boolean indicating whether to show the error in an error boundary (`true`) or return the error as state (`false`).
   * Defaults to `false`.
   */
  throwOnError?: ThrowOnError<TQueryFnData, TError, TQueryData, TQueryKey>
  /**
   * This option can be used to transform or select a part of the data returned by the query function.
   */
  select?: (data: TQueryData) => TData
  /**
   * If set to `true`, the query will suspend when `status === 'pending'`
   * and throw errors when `status === 'error'`.
   * Defaults to `false`.
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
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> extends QueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      InfiniteData<TQueryData, TPageParam>,
      TQueryKey,
      TPageParam
    >,
    InfiniteQueryPageParamsOptions<TQueryFnData, TPageParam> {}

export type DefaultedInfiniteQueryObserverOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = WithRequired<
  InfiniteQueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey,
    TPageParam
  >,
  'throwOnError' | 'refetchOnReconnect' | 'queryHash'
>

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
   * The time in milliseconds after data is considered stale.
   * If the data is fresh it will be returned from the cache.
   */
  staleTime?: number
}

type FetchInfiniteQueryPages<TQueryFnData = unknown, TPageParam = unknown> =
  | { pages?: never }
  | {
      pages: number
      getNextPageParam: GetNextPageParamFunction<TPageParam, TQueryFnData>
    }

export type FetchInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = FetchQueryOptions<
  TQueryFnData,
  TError,
  InfiniteData<TData, TPageParam>,
  TQueryKey,
  TPageParam
> &
  InitialPageParam<TPageParam> &
  FetchInfiniteQueryPages<TQueryFnData, TPageParam>

export interface ResultOptions {
  throwOnError?: boolean
}

export interface RefetchOptions extends ResultOptions {
  cancelRefetch?: boolean
}

export interface InvalidateQueryFilters extends QueryFilters {
  refetchType?: QueryTypeFilter | 'none'
}

export interface RefetchQueryFilters extends QueryFilters {}

export interface InvalidateOptions extends RefetchOptions {}
export interface ResetOptions extends RefetchOptions {}

export interface FetchNextPageOptions extends ResultOptions {
  cancelRefetch?: boolean
}

export interface FetchPreviousPageOptions extends ResultOptions {
  cancelRefetch?: boolean
}

export type QueryStatus = 'pending' | 'error' | 'success'
export type FetchStatus = 'fetching' | 'paused' | 'idle'

export interface QueryObserverBaseResult<
  TData = unknown,
  TError = DefaultError,
> {
  data: TData | undefined
  dataUpdatedAt: number
  error: TError | null
  errorUpdatedAt: number
  failureCount: number
  failureReason: TError | null
  errorUpdateCount: number
  isError: boolean
  isFetched: boolean
  isFetchedAfterMount: boolean
  isFetching: boolean
  isLoading: boolean
  isPending: boolean
  isLoadingError: boolean
  /**
   * @deprecated isInitialLoading is being deprecated in favor of isLoading
   * and will be removed in the next major version.
   */
  isInitialLoading: boolean
  isPaused: boolean
  isPlaceholderData: boolean
  isRefetchError: boolean
  isRefetching: boolean
  isStale: boolean
  isSuccess: boolean
  refetch: (
    options?: RefetchOptions,
  ) => Promise<QueryObserverResult<TData, TError>>
  status: QueryStatus
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

export interface InfiniteQueryObserverBaseResult<
  TData = unknown,
  TError = DefaultError,
> extends QueryObserverBaseResult<TData, TError> {
  fetchNextPage: (
    options?: FetchNextPageOptions,
  ) => Promise<InfiniteQueryObserverResult<TData, TError>>
  fetchPreviousPage: (
    options?: FetchPreviousPageOptions,
  ) => Promise<InfiniteQueryObserverResult<TData, TError>>
  hasNextPage: boolean
  hasPreviousPage: boolean
  isFetchingNextPage: boolean
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
  isSuccess: false
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
  isSuccess: false
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
  isSuccess: false
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
  isSuccess: true
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

export type MutationKey = ReadonlyArray<unknown>

export type MutationStatus = 'idle' | 'pending' | 'success' | 'error'

export type MutationMeta = Register extends {
  mutationMeta: infer TMutationMeta
}
  ? TMutationMeta extends Record<string, unknown>
    ? TMutationMeta
    : Record<string, unknown>
  : Record<string, unknown>

export type MutationFunction<TData = unknown, TVariables = unknown> = (
  variables: TVariables,
) => Promise<TData>

export interface MutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
> {
  mutationFn?: MutationFunction<TData, TVariables>
  mutationKey?: MutationKey
  onMutate?: (
    variables: TVariables,
  ) => Promise<TContext | undefined> | TContext | undefined
  onSuccess?: (
    data: TData,
    variables: TVariables,
    context: TContext,
  ) => Promise<unknown> | unknown
  onError?: (
    error: TError,
    variables: TVariables,
    context: TContext | undefined,
  ) => Promise<unknown> | unknown
  onSettled?: (
    data: TData | undefined,
    error: TError | null,
    variables: TVariables,
    context: TContext | undefined,
  ) => Promise<unknown> | unknown
  retry?: RetryValue<TError>
  retryDelay?: RetryDelayValue<TError>
  networkMode?: NetworkMode
  gcTime?: number
  _defaulted?: boolean
  meta?: MutationMeta
}

export interface MutationObserverOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
> extends MutationOptions<TData, TError, TVariables, TContext> {
  throwOnError?: boolean | ((error: TError) => boolean)
}

export interface MutateOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
> {
  onSuccess?: (data: TData, variables: TVariables, context: TContext) => void
  onError?: (
    error: TError,
    variables: TVariables,
    context: TContext | undefined,
  ) => void
  onSettled?: (
    data: TData | undefined,
    error: TError | null,
    variables: TVariables,
    context: TContext | undefined,
  ) => void
}

export type MutateFunction<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
> = (
  variables: TVariables,
  options?: MutateOptions<TData, TError, TVariables, TContext>,
) => Promise<TData>

export interface MutationObserverBaseResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
> extends MutationState<TData, TError, TVariables, TContext> {
  isError: boolean
  isIdle: boolean
  isPending: boolean
  isSuccess: boolean
  mutate: MutateFunction<TData, TError, TVariables, TContext>
  reset: () => void
}

export interface MutationObserverIdleResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
> extends MutationObserverBaseResult<TData, TError, TVariables, TContext> {
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
  TContext = unknown,
> extends MutationObserverBaseResult<TData, TError, TVariables, TContext> {
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
  TContext = unknown,
> extends MutationObserverBaseResult<TData, TError, TVariables, TContext> {
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
  TContext = unknown,
> extends MutationObserverBaseResult<TData, TError, TVariables, TContext> {
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
  TContext = unknown,
> =
  | MutationObserverIdleResult<TData, TError, TVariables, TContext>
  | MutationObserverLoadingResult<TData, TError, TVariables, TContext>
  | MutationObserverErrorResult<TData, TError, TVariables, TContext>
  | MutationObserverSuccessResult<TData, TError, TVariables, TContext>

export interface QueryClientConfig {
  queryCache?: QueryCache
  mutationCache?: MutationCache
  defaultOptions?: DefaultOptions
}

export interface DefaultOptions<TError = DefaultError> {
  queries?: Omit<QueryObserverOptions<unknown, TError>, 'suspense'>
  mutations?: MutationObserverOptions<unknown, TError, unknown, unknown>
}

export interface CancelOptions {
  revert?: boolean
  silent?: boolean
}

export interface SetDataOptions {
  updatedAt?: number
}

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
