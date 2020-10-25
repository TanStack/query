import type { MutationState } from './mutation'
import type {
  QueryBehavior,
  QueryDataOrigin,
  QueryErrorOrigin,
  QueryFetchOrigin,
} from './query'
import type { RetryValue, RetryDelayValue } from './retryer'
import type { QueryFilters } from './utils'

export type QueryKey = string | unknown[]

export type QueryFunction<T = unknown> = (...args: any[]) => T | Promise<T>

export type InitialDataFunction<T> = () => T | undefined

export type InitialStaleFunction = () => boolean

export type PlaceholderDataFunction<TResult> = () => TResult | undefined

export type QueryKeyHashFunction = (queryKey: QueryKey) => string

export type GetPreviousPageParamFunction<TQueryFnData = unknown> = (
  firstPage: TQueryFnData,
  allPages: TQueryFnData[]
) => unknown | undefined

export type GetNextPageParamFunction<TQueryFnData = unknown> = (
  lastPage: TQueryFnData,
  allPages: TQueryFnData[]
) => unknown | undefined

export interface InfiniteData<TData> {
  pages: TData[]
  pageParams: unknown[]
}

export interface QueryOptions<
  TData = unknown,
  TError = unknown,
  TQueryFnData = TData
> {
  /**
   * If `false`, failed queries will not retry by default.
   * If `true`, failed queries will retry infinitely., failureCount: num
   * If set to an integer number, e.g. 3, failed queries will retry until the failed query count meets that number.
   * If set to a function `(failureCount, error) => boolean` failed queries will retry until the function returns false.
   */
  retry?: RetryValue<TError>
  retryDelay?: RetryDelayValue
  cacheTime?: number
  isDataEqual?: (oldData: unknown, newData: unknown) => boolean
  queryFn?: QueryFunction<TQueryFnData>
  queryHash?: string
  queryKey?: QueryKey
  queryKeyHashFn?: QueryKeyHashFunction
  queryFnParamsFilter?: (args: unknown[]) => unknown[]
  initialData?: TData | InitialDataFunction<TData>
  behavior?: QueryBehavior<TData, TError, TQueryFnData>
  /**
   * Set this to `false` to disable structural sharing between query results.
   * Defaults to `true`.
   */
  structuralSharing?: boolean
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
}

export interface FetchQueryOptions<
  TData = unknown,
  TError = unknown,
  TQueryFnData = TData
> extends QueryOptions<TData, TError, TQueryFnData> {
  /**
   * The time in milliseconds after data is considered stale.
   * If set to `Infinity`, the data will never be considered stale.
   */
  staleTime?: number
}

export interface QueryObserverOptions<
  TData = unknown,
  TError = unknown,
  TQueryFnData = TData,
  TQueryData = TQueryFnData
> extends FetchQueryOptions<TData, TError, TQueryFnData> {
  /**
   * Set this to `false` to disable automatic refetching when the query mounts or changes query keys.
   * To refetch the query, use the `refetch` method returned from the `useQuery` instance.
   * Defaults to `true`.
   */
  enabled?: boolean
  /**
   * If set to a number, the query will continuously refetch at this frequency in milliseconds.
   * Defaults to `false`.
   */
  refetchInterval?: number | false
  /**
   * If set to `true`, the query will continue to refetch while their tab/window is in the background.
   * Defaults to `false`.
   */
  refetchIntervalInBackground?: boolean
  /**
   * If set to `true`, the query will refetch on window focus if the data is stale.
   * If set to `false`, the query will not refetch on window focus.
   * If set to `'always'`, the query will always refetch on window focus.
   * Defaults to `true`.
   */
  refetchOnWindowFocus?: boolean | 'always'
  /**
   * If set to `true`, the query will refetch on reconnect if the data is stale.
   * If set to `false`, the query will not refetch on reconnect.
   * If set to `'always'`, the query will always refetch on reconnect.
   * Defaults to `true`.
   */
  refetchOnReconnect?: boolean | 'always'
  /**
   * If set to `true`, the query will refetch on mount if the data is stale.
   * If set to `false`, will disable additional instances of a query to trigger background refetches.
   * If set to `'always'`, the query will always refetch on mount.
   * Defaults to `true`.
   */
  refetchOnMount?: boolean | 'always'
  /**
   * Whether a component should re-render when the `isStale` property changes.
   * Defaults to `false`.
   */
  notifyOnStaleChange?: boolean
  /**
   * Whether a change to the query status should re-render a component.
   * If set to `false`, the component will only re-render when the actual `data` or `error` changes.
   * Defaults to `true`.
   */
  notifyOnStatusChange?: boolean
  /**
   * This callback will fire any time the query successfully fetches new data.
   */
  onSuccess?: (data: TData) => void
  /**
   * This callback will fire if the query encounters an error and will be passed the error.
   */
  onError?: (err: TError) => void
  /**
   * This callback will fire any time the query is either successfully fetched or errors and be passed either the data or error.
   */
  onSettled?: (data: TData | undefined, error: TError | null) => void
  /**
   * Whether errors should be thrown instead of setting the `error` property.
   * Defaults to `false`.
   */
  useErrorBoundary?: boolean
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
  placeholderData?: TData | PlaceholderDataFunction<TData>
}

export interface InfiniteQueryObserverOptions<
  TData = unknown,
  TError = unknown,
  TQueryFnData = TData,
  TQueryData = TQueryFnData
>
  extends QueryObserverOptions<
    InfiniteData<TData>,
    TError,
    TQueryFnData,
    InfiniteData<TQueryData>
  > {}

export interface ResultOptions {
  throwOnError?: boolean
}

export interface RefetchOptions extends ResultOptions {
  origin?: QueryFetchOrigin
}

export interface InvalidateQueryFilters extends QueryFilters {
  refetchActive?: boolean
  refetchInactive?: boolean
}

export interface InvalidateOptions {
  throwOnError?: boolean
}

export interface FetchNextPageOptions extends ResultOptions {
  pageParam?: unknown
}

export interface FetchPreviousPageOptions extends ResultOptions {
  pageParam?: unknown
}

export type QueryStatus = 'idle' | 'loading' | 'error' | 'success'

export interface QueryObserverResult<TData = unknown, TError = unknown> {
  data: TData | undefined
  dataOrigin?: QueryDataOrigin
  error: TError | null
  errorOrigin?: QueryErrorOrigin
  failureCount: number
  fetchOrigin?: QueryFetchOrigin
  isError: boolean
  isFetched: boolean
  isFetchedAfterMount: boolean
  isFetching: boolean
  isIdle: boolean
  isLoading: boolean
  isPreviousData: boolean
  isPlaceholderData: boolean
  isStale: boolean
  isSuccess: boolean
  refetch: (
    options?: RefetchOptions
  ) => Promise<QueryObserverResult<TData, TError>>
  remove: () => void
  status: QueryStatus
  updatedAt: number
}

export interface InfiniteQueryObserverResult<TData = unknown, TError = unknown>
  extends QueryObserverResult<InfiniteData<TData>, TError> {
  fetchNextPage: (
    options?: FetchNextPageOptions
  ) => Promise<InfiniteQueryObserverResult<TData, TError>>
  fetchPreviousPage: (
    options?: FetchPreviousPageOptions
  ) => Promise<InfiniteQueryObserverResult<TData, TError>>
  hasNextPage?: boolean
  hasPreviousPage?: boolean
  isFetchingNextPage: boolean
  isFetchingPreviousPage: boolean
}

export type MutationKey = string | unknown[]

export type MutationStatus = 'idle' | 'loading' | 'success' | 'error'

export type MutationFunction<TData = unknown, TVariables = unknown> = (
  variables: TVariables
) => Promise<TData>

export interface MutationOptions<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown
> {
  mutationFn?: MutationFunction<TData, TVariables>
  mutationKey?: string | unknown[]
  variables?: TVariables
  onMutate?: (variables: TVariables) => Promise<TContext> | TContext
  onSuccess?: (
    data: TData,
    variables: TVariables,
    context: TContext | undefined
  ) => Promise<void> | void
  onError?: (
    error: TError,
    variables: TVariables,
    context: TContext | undefined
  ) => Promise<void> | void
  onSettled?: (
    data: TData | undefined,
    error: TError | null,
    variables: TVariables,
    context: TContext | undefined
  ) => Promise<void> | void
  retry?: RetryValue<TError>
  retryDelay?: RetryDelayValue
}

export interface MutationObserverOptions<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown
> extends MutationOptions<TData, TError, TVariables, TContext> {
  useErrorBoundary?: boolean
}

export interface MutateOptions<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown
> {
  onSuccess?: (
    data: TData,
    variables: TVariables,
    context: TContext | undefined
  ) => Promise<void> | void
  onError?: (
    error: TError,
    variables: TVariables,
    context: TContext | undefined
  ) => Promise<void> | void
  onSettled?: (
    data: TData | undefined,
    error: TError | null,
    variables: TVariables,
    context: TContext | undefined
  ) => Promise<void> | void
}

export type MutateFunction<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown
> = (
  variables: TVariables,
  options?: MutateOptions<TData, TError, TVariables, TContext>
) => Promise<TData>

export interface MutationObserverResult<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown
> extends MutationState<TData, TError, TVariables, TContext> {
  isError: boolean
  isIdle: boolean
  isLoading: boolean
  isSuccess: boolean
  mutate: MutateFunction<TData, TError, TVariables, TContext>
  reset: () => void
}

export interface DefaultOptions<TError = unknown> {
  queries?: QueryObserverOptions<unknown, TError>
  mutations?: MutationObserverOptions<unknown, TError, unknown, unknown>
}
