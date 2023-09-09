/* istanbul ignore file */

import type { MutationState } from './mutation'
import type { Query, QueryBehavior } from './query'
import type { RetryDelayValue, RetryValue } from './retryer'
import type { QueryFilters, QueryTypeFilter } from './utils'
import type { QueryCache } from './queryCache'
import type { MutationCache } from './mutationCache'
import type { Logger } from './logger'

export type QueryKey = readonly unknown[]

export type QueryFunction<
  T = unknown,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = any,
> = (context: QueryFunctionContext<TQueryKey, TPageParam>) => T | Promise<T>

export interface QueryFunctionContext<
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = any,
> {
  queryKey: TQueryKey
  signal?: AbortSignal
  pageParam?: TPageParam
  meta: QueryMeta | undefined
}

export type InitialDataFunction<T> = () => T | undefined

export type PlaceholderDataFunction<TResult> = () => TResult | undefined

export type QueryKeyHashFunction<TQueryKey extends QueryKey> = (
  queryKey: TQueryKey,
) => string

export type GetPreviousPageParamFunction<TQueryFnData = unknown> = (
  firstPage: TQueryFnData,
  allPages: TQueryFnData[],
) => unknown

export type GetNextPageParamFunction<TQueryFnData = unknown> = (
  lastPage: TQueryFnData,
  allPages: TQueryFnData[],
) => unknown

export interface InfiniteData<TData> {
  pages: TData[]
  pageParams: unknown[]
}

export interface QueryMeta {
  [index: string]: unknown
}

export type NetworkMode = 'online' | 'always' | 'offlineFirst'

export type NotifyOnChangeProps =
  | Array<keyof InfiniteQueryObserverResult>
  | 'all'
  | (() => Array<keyof InfiniteQueryObserverResult> | 'all')

export interface QueryOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
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
  cacheTime?: number
  /**
   * @deprecated This callback will be removed in the next major version. You can achieve the same functionality by passing a function to `structuralSharing` instead.
   */
  isDataEqual?: (oldData: TData | undefined, newData: TData) => boolean
  queryFn?: QueryFunction<TQueryFnData, TQueryKey>
  queryHash?: string
  queryKey?: TQueryKey
  queryKeyHashFn?: QueryKeyHashFunction<TQueryKey>
  initialData?: TData | InitialDataFunction<TData>
  initialDataUpdatedAt?: number | (() => number | undefined)
  behavior?: QueryBehavior<TQueryFnData, TError, TData>
  /**
   * Set this to `false` to disable structural sharing between query results.
   * Set this to a function which accepts the old and new data and returns resolved data of the same type to implement custom structural sharing logic.
   * Defaults to `true`.
   */
  structuralSharing?:
    | boolean
    | ((oldData: TData | undefined, newData: TData) => TData)
  /**
   * This function can be set to automatically get the previous cursor for infinite queries.
   * The result will also be used to determine the value of `hasPreviousPage`.
   */
  getPreviousPageParam?: GetPreviousPageParamFunction<TQueryFnData>
  /**
   * This function can be set to automatically get the next cursor for infinite queries.
   * The result will also be used to determine the value of `hasNextPage`.
   */
  getNextPageParam?: GetNextPageParamFunction<TQueryFnData>
  _defaulted?: boolean
  /**
   * Additional payload to be stored on each query.
   * Use this property to pass information that can be used in other places.
   */
  meta?: QueryMeta
}

export type UseErrorBoundary<
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
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends QueryOptions<TQueryFnData, TError, TQueryData, TQueryKey> {
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
        data: TData | undefined,
        query: Query<TQueryFnData, TError, TQueryData, TQueryKey>,
      ) => number | false)
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
   * If set to `false`, will disable additional instances of a query to trigger background refetches.
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
   * This callback will fire any time the query successfully fetches new data.
   *
   * @deprecated This callback will be removed in the next major version.
   */
  onSuccess?: (data: TData) => void
  /**
   * This callback will fire if the query encounters an error and will be passed the error.
   *
   * @deprecated This callback will be removed in the next major version.
   */
  onError?: (err: TError) => void
  /**
   * This callback will fire any time the query is either successfully fetched or errors and be passed either the data or error.
   *
   * @deprecated This callback will be removed in the next major version.
   */
  onSettled?: (data: TData | undefined, error: TError | null) => void
  /**
   * Whether errors should be thrown instead of setting the `error` property.
   * If set to `true` or `suspense` is `true`, all errors will be thrown to the error boundary.
   * If set to `false` and `suspense` is `false`, errors are returned as state.
   * If set to a function, it will be passed the error and the query, and it should return a boolean indicating whether to show the error in an error boundary (`true`) or return the error as state (`false`).
   * Defaults to `false`.
   */
  useErrorBoundary?: UseErrorBoundary<
    TQueryFnData,
    TError,
    TQueryData,
    TQueryKey
  >
  /**
   * This option can be used to transform or select a part of the data returned by the query function.
   */
  select?: (data: TQueryData) => TData
  /**
   * If set to `true`, the query will suspend when `status === 'loading'`
   * and throw errors when `status === 'error'`.
   * Defaults to `false`.
   */
  suspense?: boolean
  /**
   * Set this to `true` to keep the previous `data` when fetching based on a new query key.
   * Defaults to `false`.
   */
  keepPreviousData?: boolean
  /**
   * If set, this value will be used as the placeholder data for this particular query observer while the query is still in the `loading` data and no initialData has been provided.
   */
  placeholderData?: TQueryData | PlaceholderDataFunction<TQueryData>

  _optimisticResults?: 'optimistic' | 'isRestoring'
}

export type WithRequired<T, K extends keyof T> = T & { [_ in K]: {} }

export type DefaultedQueryObserverOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = WithRequired<
  QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>,
  'useErrorBoundary' | 'refetchOnReconnect'
>

export interface InfiniteQueryObserverOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends QueryObserverOptions<
    TQueryFnData,
    TError,
    InfiniteData<TData>,
    InfiniteData<TQueryData>,
    TQueryKey
  > {}

export type DefaultedInfiniteQueryObserverOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = WithRequired<
  InfiniteQueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >,
  'useErrorBoundary' | 'refetchOnReconnect'
>

export interface FetchQueryOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends QueryOptions<TQueryFnData, TError, TData, TQueryKey> {
  /**
   * The time in milliseconds after data is considered stale.
   * If the data is fresh it will be returned from the cache.
   */
  staleTime?: number
}

export interface FetchInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends FetchQueryOptions<
    TQueryFnData,
    TError,
    InfiniteData<TData>,
    TQueryKey
  > {}

export interface ResultOptions {
  throwOnError?: boolean
}

export interface RefetchPageFilters<TPageData = unknown> {
  refetchPage?: (
    lastPage: TPageData,
    index: number,
    allPages: TPageData[],
  ) => boolean
}

export interface RefetchOptions extends ResultOptions {
  cancelRefetch?: boolean
}

export interface InvalidateQueryFilters<TPageData = unknown>
  extends QueryFilters,
    RefetchPageFilters<TPageData> {
  refetchType?: QueryTypeFilter | 'none'
}

export interface RefetchQueryFilters<TPageData = unknown>
  extends QueryFilters,
    RefetchPageFilters<TPageData> {}

export interface ResetQueryFilters<TPageData = unknown>
  extends QueryFilters,
    RefetchPageFilters<TPageData> {}

export interface InvalidateOptions extends RefetchOptions {}
export interface ResetOptions extends RefetchOptions {}

export interface FetchNextPageOptions extends ResultOptions {
  cancelRefetch?: boolean
  pageParam?: unknown
}

export interface FetchPreviousPageOptions extends ResultOptions {
  cancelRefetch?: boolean
  pageParam?: unknown
}

export type QueryStatus = 'loading' | 'error' | 'success'
export type FetchStatus = 'fetching' | 'paused' | 'idle'

export interface QueryObserverBaseResult<TData = unknown, TError = unknown> {
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
  isLoadingError: boolean
  isInitialLoading: boolean
  isPaused: boolean
  isPlaceholderData: boolean
  isPreviousData: boolean
  isRefetchError: boolean
  isRefetching: boolean
  isStale: boolean
  isSuccess: boolean
  refetch: <TPageData>(
    options?: RefetchOptions & RefetchQueryFilters<TPageData>,
  ) => Promise<QueryObserverResult<TData, TError>>
  remove: () => void
  status: QueryStatus
  fetchStatus: FetchStatus
}

export interface QueryObserverLoadingResult<TData = unknown, TError = unknown>
  extends QueryObserverBaseResult<TData, TError> {
  data: undefined
  error: null
  isError: false
  isLoading: true
  isLoadingError: false
  isRefetchError: false
  isSuccess: false
  status: 'loading'
}

export interface QueryObserverLoadingErrorResult<
  TData = unknown,
  TError = unknown,
> extends QueryObserverBaseResult<TData, TError> {
  data: undefined
  error: TError
  isError: true
  isLoading: false
  isLoadingError: true
  isRefetchError: false
  isSuccess: false
  status: 'error'
}

export interface QueryObserverRefetchErrorResult<
  TData = unknown,
  TError = unknown,
> extends QueryObserverBaseResult<TData, TError> {
  data: TData
  error: TError
  isError: true
  isLoading: false
  isLoadingError: false
  isRefetchError: true
  isSuccess: false
  status: 'error'
}

export interface QueryObserverSuccessResult<TData = unknown, TError = unknown>
  extends QueryObserverBaseResult<TData, TError> {
  data: TData
  error: null
  isError: false
  isLoading: false
  isLoadingError: false
  isRefetchError: false
  isSuccess: true
  status: 'success'
}

export type DefinedQueryObserverResult<TData = unknown, TError = unknown> =
  | QueryObserverRefetchErrorResult<TData, TError>
  | QueryObserverSuccessResult<TData, TError>

export type QueryObserverResult<TData = unknown, TError = unknown> =
  | DefinedQueryObserverResult<TData, TError>
  | QueryObserverLoadingErrorResult<TData, TError>
  | QueryObserverLoadingResult<TData, TError>

export interface InfiniteQueryObserverBaseResult<
  TData = unknown,
  TError = unknown,
> extends QueryObserverBaseResult<InfiniteData<TData>, TError> {
  fetchNextPage: (
    options?: FetchNextPageOptions,
  ) => Promise<InfiniteQueryObserverResult<TData, TError>>
  fetchPreviousPage: (
    options?: FetchPreviousPageOptions,
  ) => Promise<InfiniteQueryObserverResult<TData, TError>>
  hasNextPage?: boolean
  hasPreviousPage?: boolean
  isFetchingNextPage: boolean
  isFetchingPreviousPage: boolean
}

export interface InfiniteQueryObserverLoadingResult<
  TData = unknown,
  TError = unknown,
> extends InfiniteQueryObserverBaseResult<TData, TError> {
  data: undefined
  error: null
  isError: false
  isLoading: true
  isLoadingError: false
  isRefetchError: false
  isSuccess: false
  status: 'loading'
}

export interface InfiniteQueryObserverLoadingErrorResult<
  TData = unknown,
  TError = unknown,
> extends InfiniteQueryObserverBaseResult<TData, TError> {
  data: undefined
  error: TError
  isError: true
  isLoading: false
  isLoadingError: true
  isRefetchError: false
  isSuccess: false
  status: 'error'
}

export interface InfiniteQueryObserverRefetchErrorResult<
  TData = unknown,
  TError = unknown,
> extends InfiniteQueryObserverBaseResult<TData, TError> {
  data: InfiniteData<TData>
  error: TError
  isError: true
  isLoading: false
  isLoadingError: false
  isRefetchError: true
  isSuccess: false
  status: 'error'
}

export interface InfiniteQueryObserverSuccessResult<
  TData = unknown,
  TError = unknown,
> extends InfiniteQueryObserverBaseResult<TData, TError> {
  data: InfiniteData<TData>
  error: null
  isError: false
  isLoading: false
  isLoadingError: false
  isRefetchError: false
  isSuccess: true
  status: 'success'
}

export type InfiniteQueryObserverResult<TData = unknown, TError = unknown> =
  | InfiniteQueryObserverLoadingErrorResult<TData, TError>
  | InfiniteQueryObserverLoadingResult<TData, TError>
  | InfiniteQueryObserverRefetchErrorResult<TData, TError>
  | InfiniteQueryObserverSuccessResult<TData, TError>

export type MutationKey = readonly unknown[]

export type MutationStatus = 'idle' | 'loading' | 'success' | 'error'

export interface MutationMeta {
  [index: string]: unknown
}

export type MutationFunction<TData = unknown, TVariables = unknown> = (
  variables: TVariables,
) => Promise<TData>

export interface MutationOptions<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
> {
  mutationFn?: MutationFunction<TData, TVariables>
  mutationKey?: MutationKey
  variables?: TVariables
  onMutate?: (
    variables: TVariables,
  ) => Promise<TContext | undefined> | TContext | undefined
  onSuccess?: (
    data: TData,
    variables: TVariables,
    context: TContext | undefined,
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
  cacheTime?: number
  _defaulted?: boolean
  meta?: MutationMeta
}

export interface MutationObserverOptions<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
> extends MutationOptions<TData, TError, TVariables, TContext> {
  useErrorBoundary?: boolean | ((error: TError) => boolean)
}

export interface MutateOptions<
  TData = unknown,
  TError = unknown,
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
  TError = unknown,
  TVariables = void,
  TContext = unknown,
> = (
  variables: TVariables,
  options?: MutateOptions<TData, TError, TVariables, TContext>,
) => Promise<TData>

export interface MutationObserverBaseResult<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
> extends MutationState<TData, TError, TVariables, TContext> {
  isError: boolean
  isIdle: boolean
  isLoading: boolean
  isSuccess: boolean
  mutate: MutateFunction<TData, TError, TVariables, TContext>
  reset: () => void
}

export interface MutationObserverIdleResult<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
> extends MutationObserverBaseResult<TData, TError, TVariables, TContext> {
  data: undefined
  error: null
  isError: false
  isIdle: true
  isLoading: false
  isSuccess: false
  status: 'idle'
}

export interface MutationObserverLoadingResult<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
> extends MutationObserverBaseResult<TData, TError, TVariables, TContext> {
  data: undefined
  error: null
  isError: false
  isIdle: false
  isLoading: true
  isSuccess: false
  status: 'loading'
}

export interface MutationObserverErrorResult<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
> extends MutationObserverBaseResult<TData, TError, TVariables, TContext> {
  data: undefined
  error: TError
  isError: true
  isIdle: false
  isLoading: false
  isSuccess: false
  status: 'error'
}

export interface MutationObserverSuccessResult<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
> extends MutationObserverBaseResult<TData, TError, TVariables, TContext> {
  data: TData
  error: null
  isError: false
  isIdle: false
  isLoading: false
  isSuccess: true
  status: 'success'
}

export type MutationObserverResult<
  TData = unknown,
  TError = unknown,
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
  logger?: Logger
  defaultOptions?: DefaultOptions
}

export interface DefaultOptions<TError = unknown> {
  queries?: QueryObserverOptions<unknown, TError>
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
