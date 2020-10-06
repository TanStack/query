import type { QueryFilters } from './utils'

export type QueryKey = string | unknown[]

export type QueryFunction<T = unknown> = (...args: any[]) => T | Promise<T>

export type InitialDataFunction<T> = () => T | undefined

export type InitialStaleFunction = () => boolean

export type QueryKeyHashFunction = (queryKey: QueryKey) => string

export type ShouldRetryFunction<TError = unknown> = (
  failureCount: number,
  error: TError
) => boolean

export type GetPreviousPageParamFunction<TQueryFnData = unknown> = (
  firstPage: TQueryFnData,
  allPages: TQueryFnData[]
) => unknown | undefined

export type GetNextPageParamFunction<TQueryFnData = unknown> = (
  lastPage: TQueryFnData,
  allPages: TQueryFnData[]
) => unknown | undefined

export type RetryDelayFunction = (attempt: number) => number

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
  retry?: boolean | number | ShouldRetryFunction<TError>
  retryDelay?: number | RetryDelayFunction
  cacheTime?: number
  isDataEqual?: (oldData: unknown, newData: unknown) => boolean
  queryFn?: QueryFunction<TQueryFnData>
  queryHash?: string
  queryKey?: QueryKey
  queryKeyHashFn?: QueryKeyHashFunction
  queryFnParamsFilter?: (args: unknown[]) => unknown[]
  initialData?: TData | InitialDataFunction<TData>
  infinite?: true
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
}

export interface ResultOptions {
  throwOnError?: boolean
}

export interface RefetchOptions extends ResultOptions {}

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
  error: TError | null
  failureCount: number
  fetchNextPage: (
    options?: FetchNextPageOptions
  ) => Promise<QueryObserverResult<TData, TError>>
  fetchPreviousPage: (
    options?: FetchPreviousPageOptions
  ) => Promise<QueryObserverResult<TData, TError>>
  hasNextPage?: boolean
  hasPreviousPage?: boolean
  isError: boolean
  isFetched: boolean
  isFetchedAfterMount: boolean
  isFetching: boolean
  isFetchingNextPage?: boolean
  isFetchingPreviousPage?: boolean
  isIdle: boolean
  isLoading: boolean
  isPreviousData: boolean
  isStale: boolean
  isSuccess: boolean
  refetch: (
    options?: RefetchOptions
  ) => Promise<QueryObserverResult<TData, TError>>
  remove: () => void
  status: QueryStatus
  updatedAt: number
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

export interface MutationOptions<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown
> extends MutateOptions<TData, TError, TVariables, TContext> {
  onMutate?: (variables: TVariables) => Promise<TContext> | TContext
  useErrorBoundary?: boolean
  suspense?: boolean
}

export interface DefaultOptions<TError = unknown> {
  queries?: QueryObserverOptions<unknown, TError>
  mutations?: MutationOptions<unknown, TError, unknown, unknown>
}
