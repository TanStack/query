import type { QueryClientOf, QueryOf, RuntimeBinding } from './binding'
import type {
  DefaultError,
  FetchStatus,
  QueryKey,
  QueryOptions,
  QueryStatus,
} from './types'

export interface QueryConfig<
  TRuntime extends RuntimeBinding,
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey = QueryKey,
> {
  client: QueryClientOf<TRuntime>
  queryKey: TQueryKey
  queryHash: string
  options?: QueryOptions<TRuntime, TQueryFnData, TError, TData, TQueryKey>
  defaultOptions?: QueryOptions<
    TRuntime,
    TQueryFnData,
    TError,
    TData,
    TQueryKey
  >
  state?: QueryState<TData, TError>
}

/**
 * The raw state stored on a `Query` instance. This is the underlying state
 * that observer results (e.g. `QueryObserverResult`) are derived from.
 */
export interface QueryState<TData = unknown, TError = DefaultError> {
  /**
   * The last successfully resolved data for the query.
   */
  data: TData | undefined
  /**
   * The number of times the query has successfully resolved.
   */
  dataUpdateCount: number
  /**
   * The timestamp for when the query most recently returned the `status` as `"success"`.
   */
  dataUpdatedAt: number
  /**
   * The error object for the query, if the last attempt resulted in an error.
   * - Defaults to `null`.
   */
  error: TError | null
  /**
   * The sum of all errors, incremented every time the query resolves with an error.
   */
  errorUpdateCount: number
  /**
   * The timestamp for when the query most recently returned the `status` as `"error"`.
   */
  errorUpdatedAt: number
  /**
   * The failure count for the current fetch.
   * - Incremented every time the fetch fails.
   * - Reset to `0` when the fetch succeeds.
   */
  fetchFailureCount: number
  /**
   * The reason the current fetch failed, as reported by the retryer.
   * - Reset to `null` when the fetch succeeds.
   */
  fetchFailureReason: TError | null
  /**
   * Metadata passed to the currently in-flight (or most recent) fetch, e.g. the
   * `fetchMore` direction for infinite queries.
   */
  fetchMeta: FetchMeta | null
  /**
   * Whether the query has been marked as invalidated via `invalidate()`.
   * - Reset to `false` whenever the query resolves successfully.
   */
  isInvalidated: boolean
  /**
   * The status of the query.
   * - `pending` if there's no cached data and no attempt was finished yet.
   * - `error` if the last attempt resulted in an error.
   * - `success` if the query has data.
   */
  status: QueryStatus
  /**
   * The fetch status of the query.
   * - `fetching`: the `queryFn` is currently executing.
   * - `paused`: a fetch wanted to run but has been paused (see network mode).
   * - `idle`: the query is not fetching.
   */
  fetchStatus: FetchStatus
}

/**
 * The context passed to a {@link QueryBehavior}'s `onFetch`, which can replace `fetchFn` to change
 * how the query fetches (e.g. to fetch pages for an infinite query).
 */
export interface FetchContext<
  TRuntime extends RuntimeBinding,
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey = QueryKey,
> {
  /**
   * The function that runs the fetch. By default it calls `queryFn`; `onFetch` can replace it.
   */
  fetchFn: () => unknown | Promise<unknown>
  /**
   * The options of this fetch.
   */
  fetchOptions?: FetchOptions
  /**
   * The `AbortSignal` that aborts when the fetch is cancelled.
   */
  signal: AbortSignal
  /**
   * The options of the query.
   */
  options: QueryOptions<TRuntime, TQueryFnData, TError, TData, any>
  /**
   * The `QueryClient` the query belongs to.
   */
  client: QueryClientOf<TRuntime>
  /**
   * The key of the query.
   */
  queryKey: TQueryKey
  /**
   * The state of the query when the fetch starts.
   */
  state: QueryState<TData, TError>
}

/**
 * Customizes how a query fetches, e.g. the behavior that fetches the pages of an infinite query.
 */
export interface QueryBehavior<
  TRuntime extends RuntimeBinding,
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> {
  /**
   * Called before each fetch of the query, e.g. to replace `fetchFn` in the context.
   */
  onFetch: (
    context: FetchContext<TRuntime, TQueryFnData, TError, TData, TQueryKey>,
    query: QueryOf<TRuntime>,
  ) => void
}

/**
 * The direction an infinite query fetches in: `'forward'` for the next page, `'backward'` for the
 * previous one.
 */
export type FetchDirection = 'forward' | 'backward'

/**
 * Metadata for a fetch, e.g. the direction when an infinite query fetches more pages.
 */
export interface FetchMeta {
  /**
   * Set when an infinite query fetches another page, with the direction to fetch in.
   */
  fetchMore?: { direction: FetchDirection }
}

/**
 * Options for a single fetch of a query.
 */
export interface FetchOptions<TData = unknown> {
  /**
   * If `true`, an in-flight fetch is cancelled before starting a new one, when the query already
   * has data. Otherwise, the in-flight fetch is reused.
   */
  cancelRefetch?: boolean
  /**
   * Metadata of the fetch, stored in the query's `fetchMeta` state.
   */
  meta?: FetchMeta
  /**
   * A promise to use for the first attempt instead of calling `fetchFn`, e.g. a pending promise
   * restored by `hydrate`.
   */
  initialPromise?: Promise<TData>
}

export interface QueryFailedAction<TError> {
  type: 'failed'
  failureCount: number
  error: TError
}

export interface FetchAction {
  type: 'fetch'
  meta?: FetchMeta
}

export interface QuerySuccessAction<TData> {
  data: TData | undefined
  type: 'success'
  dataUpdatedAt?: number
  manual?: boolean
}

export interface QueryErrorAction<TError> {
  type: 'error'
  error: TError
}

export interface InvalidateAction {
  type: 'invalidate'
}

export interface QueryPauseAction {
  type: 'pause'
}

export interface QueryContinueAction {
  type: 'continue'
}

export interface SetStateAction<TData, TError> {
  type: 'setState'
  state: Partial<QueryState<TData, TError>>
}

/**
 * The actions a query dispatches to update its state, e.g. when it starts fetching, fails, or
 * succeeds.
 */
export type QueryAction<TData, TError> =
  | QueryContinueAction
  | QueryErrorAction<TError>
  | QueryFailedAction<TError>
  | FetchAction
  | InvalidateAction
  | QueryPauseAction
  | SetStateAction<TData, TError>
  | QuerySuccessAction<TData>
