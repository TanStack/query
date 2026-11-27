import type {
  DefaultError,
  DefinedInfiniteQueryObserverResult,
  DefinedQueryObserverResult,
  DistributiveOmit,
  InferErrorFromTag,
  InfiniteData,
  InfiniteQueryExecuteOptions,
  InfiniteQueryObserverOptions,
  InfiniteQueryObserverPlaceholderResult,
  InfiniteQueryObserverResult,
  MutateFunction,
  MutationObserverOptions,
  MutationObserverResult,
  OmitKeyof,
  Override,
  QueryErrorBoundaryOption,
  QueryExecuteOptions,
  QueryKey,
  QueryObserverOptions,
  QueryObserverPlaceholderResult,
  QueryObserverResult,
  SkipToken,
  ThrowOnError,
} from '@tanstack/query-core-pluggable'

/** Error options recognized when inferring a query inside a parallel group. */
export type GroupThrowOnError<TError> =
  | ThrowOnError<any, TError, any, any>
  | QueryErrorBoundaryOption<any, TError, any, any>

/**
 * {@link UseBaseQueryOptions} with all type parameters set to `any`, useful when the specific types aren't
 * relevant, e.g. when accepting options for any query in a helper function.
 */
export type AnyUseBaseQueryOptions = UseBaseQueryOptions<
  any,
  any,
  any,
  any,
  any
>
/**
 * The options shared by `useQuery` and `useQuery(suspenseQueryOptions(...))`. Extends {@link QueryObserverOptions}
 * with the React-specific `subscribed` option.
 * @template TQueryFnData - The type your `queryFn` resolves to.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs. Defaults to `TQueryFnData` when no
 * `select` is used.
 * @template TQueryData - The type of the data actually held in the query cache — the input to `select` and
 * `placeholderData`. Defaults to, and is usually the same as, `TQueryFnData`.
 * @template TQueryKey - The type of your `queryKey`.
 */
export interface UseBaseQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends QueryObserverOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey
> {
  /**
   * Set this to `false` to unsubscribe this observer from updates to the query cache.
   * @defaultValue true
   */
  subscribed?: boolean
}

/**
 * The options accepted by `usePrefetchQuery` — everything you can pass to `query`, with a
 * required `queryFn`. Pass `defaultQueryFn` to use the client defaults.
 * @template TQueryFnData - The type your `queryFn` resolves to.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs. Defaults to `TQueryFnData` when no
 * `select` is used.
 * @template TQueryData - The type of the data actually held in the query cache — the input to `select` and
 * `placeholderData`. Defaults to, and is usually the same as, `TQueryFnData`.
 * @template TQueryKey - The type of your `queryKey`.
 */
export type UsePrefetchQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = DistributiveOmit<
  QueryExecuteOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>,
  'queryFn'
> & {
  /**
   * Pass a query function or `defaultQueryFn` to use the client defaults. Prefetch hooks do not accept `skipToken`.
   */
  queryFn: Exclude<
    QueryExecuteOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    >['queryFn'],
    SkipToken | undefined
  >
}

/**
 * The options accepted by `usePrefetchInfiniteQuery` — everything you can pass to `infiniteQuery(client, options)`,
 * with a required `queryFn`. Pass `defaultQueryFn` to use the client defaults.
 * @template TQueryFnData - The type of a single page, as your `queryFn` resolves it.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs. Defaults to `InfiniteData<TQueryFnData>`,
 * the shape of all fetched pages plus their page params — a prefetch never reads `data` back out, so this
 * parameter only matters if you reuse these options elsewhere with `select` applied.
 * @template TQueryKey - The type of your `queryKey`.
 * @template TPageParam - The type of the parameter passed to `queryFn` to fetch a given page.
 */
export type UsePrefetchInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> = DistributiveOmit<
  InfiniteQueryExecuteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  'queryFn'
> & {
  /**
   * Pass a query function or `defaultQueryFn` to use the client defaults. Prefetch hooks do not accept `skipToken`.
   */
  queryFn: Exclude<
    InfiniteQueryExecuteOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >['queryFn'],
    SkipToken | undefined
  >
}

/**
 * {@link UseQueryOptions} with all type parameters set to `any`, useful when the specific types aren't
 * relevant, e.g. when accepting options for any query in a helper function.
 */
export type AnyUseQueryOptions = UseQueryOptions<any, any, any, any>
/**
 * The ordinary options accepted by {@link queryOptions}. The factory selects the render policy for `useQuery`.
 * @template TQueryFnData - The type your `queryFn` resolves to.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs. Defaults to `TQueryFnData` when no
 * `select` is used.
 * @template TQueryKey - The type of your `queryKey`.
 */
export interface UseQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends OmitKeyof<
  UseBaseQueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>,
  'suspense' | 'throwOnError'
> {
  /** Pass [throwOnError, true] or [throwOnError, predicate] to route a settled error to React. */
  throwOnError?: QueryErrorBoundaryOption<
    TQueryFnData,
    TError,
    TQueryFnData,
    TQueryKey
  >
}

/**
 * {@link UseSuspenseQueryOptions} with all type parameters set to `any`, useful when the specific types aren't
 * relevant, e.g. when accepting options for any query in a helper function.
 */
export type AnyUseSuspenseQueryOptions = UseSuspenseQueryOptions<
  any,
  any,
  any,
  any
>
/**
 * Options for a `useQuery(suspenseQueryOptions(...))` call whose data is defined. The options match those of
 * {@link UseQueryOptions} except for `throwOnError` and `enabled`.
 * Use the other overload for a query function that can be `skipToken`.
 * @template TQueryFnData - The type your `queryFn` resolves to.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs. Defaults to `TQueryFnData` when no
 * `select` is used.
 * @template TQueryKey - The type of your `queryKey`.
 */
export interface UseSuspenseQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends OmitKeyof<
  UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  'queryFn' | 'enabled' | 'throwOnError'
> {
  /**
   * The query function. Use `defaultQueryFn` to use the client's configured function.
   */
  queryFn: Exclude<
    UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>['queryFn'],
    SkipToken
  >
}

/**
 * {@link UseInfiniteQueryOptions} with all type parameters set to `any`, useful when the specific types aren't
 * relevant, e.g. when accepting options for any query in a helper function.
 */
export type AnyUseInfiniteQueryOptions = UseInfiniteQueryOptions<
  any,
  any,
  any,
  any,
  any
>
/**
 * The options accepted by `useQuery(infiniteQueryOptions(...))`. Extends {@link InfiniteQueryObserverOptions}
 * with the React-specific `subscribed` option. {@link infiniteQueryOptions} and {@link suspenseInfiniteQueryOptions} select the render policy.
 * @template TQueryFnData - The type of a single page, as your `queryFn` resolves it.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs — defaults to `InfiniteData<TQueryFnData>`,
 * the shape of all fetched pages plus their page params.
 * @template TQueryKey - The type of your `queryKey`.
 * @template TPageParam - The type of the parameter passed to `queryFn` to fetch a given page.
 */
export interface UseInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> extends OmitKeyof<
  InfiniteQueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
  'suspense' | 'throwOnError'
> {
  /** Enables error boundary handling for the paginated query. */
  throwOnError?: QueryErrorBoundaryOption<
    TQueryFnData,
    TError,
    InfiniteData<TQueryFnData, TPageParam>,
    TQueryKey
  >
  /**
   * Set this to `false` to unsubscribe this observer from updates to the query cache.
   * @defaultValue true
   */
  subscribed?: boolean
}

/**
 * {@link UseSuspenseInfiniteQueryOptions} with all type parameters set to `any`, useful when the specific types
 * aren't relevant, e.g. when accepting options for any query in a helper function.
 */
export type AnyUseSuspenseInfiniteQueryOptions =
  UseSuspenseInfiniteQueryOptions<any, any, any, any, any>
/**
 * The options accepted by `useQuery(suspenseInfiniteQueryOptions(...))`. Same as {@link UseInfiniteQueryOptions}, except for
 * `enabled` and `throwOnError`. If `placeholderData` provides data, the query can render while the fetch runs.
 * @template TQueryFnData - The type of a single page, as your `queryFn` resolves it.
 * @template TError - The type of errors your `queryFn` may throw.
 * @template TData - The type `data` ends up as after `select` runs — defaults to `InfiniteData<TQueryFnData>`,
 * the shape of all fetched pages plus their page params.
 * @template TQueryKey - The type of your `queryKey`.
 * @template TPageParam - The type of the parameter passed to `queryFn` to fetch a given page.
 */
export interface UseSuspenseInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> extends OmitKeyof<
  UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
  'queryFn' | 'enabled' | 'throwOnError'
> {
  /**
   * The query function. Use `defaultQueryFn` to use the client defaults. Use the other overload when the function can be `skipToken`.
   */
  queryFn: Exclude<
    UseInfiniteQueryOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >['queryFn'],
    SkipToken
  >
}

/**
 * The result of `useQuery` when `initialData` isn't set — `data` may be `undefined` while the query is
 * `pending`. Re-exports {@link QueryObserverResult}. `useQuery(infiniteQueryOptions(...))` returns
 * {@link UseInfiniteQueryResult} instead.
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TError - The type of errors your `queryFn` may throw.
 */
export type UseBaseQueryResult<
  TData = unknown,
  TError = DefaultError,
> = QueryObserverResult<TData, TError>

/**
 * The result of `useQuery`. Same as {@link UseBaseQueryResult}.
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TError - The type of errors your `queryFn` may throw.
 */
export type UseQueryResult<
  TData = unknown,
  TError = DefaultError,
> = UseBaseQueryResult<TData, TError>

/** The result of `useQuery(suspenseQueryOptions(...))`, including defined placeholder data when configured. */
export type UseSuspenseQueryResult<TData = unknown, TError = DefaultError> =
  | DefinedQueryObserverResult<TData, TError>
  | QueryObserverPlaceholderResult<TData, TError>

/**
 * The result of `useQuery` when `initialData` is set. The `data` is never `undefined` (unless a `select` changes `TData` to include `undefined`).
 * Re-exports {@link DefinedQueryObserverResult}.
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TError - The type of errors your `queryFn` may throw.
 */
export type DefinedUseQueryResult<
  TData = unknown,
  TError = DefaultError,
> = DefinedQueryObserverResult<TData, TError>

/**
 * The result of `useQuery(infiniteQueryOptions(...))` when `initialData` isn't set — `data` may be `undefined` while the query is
 * `pending`. Re-exports {@link InfiniteQueryObserverResult}.
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TError - The type of errors your `queryFn` may throw.
 */
export type UseInfiniteQueryResult<
  TData = unknown,
  TError = DefaultError,
> = InfiniteQueryObserverResult<TData, TError>

/**
 * The result of `useQuery(infiniteQueryOptions(...))` when `initialData` is set — `data` is never `undefined` (unless a
 * `select` changes `TData` to include `undefined`). Re-exports {@link DefinedInfiniteQueryObserverResult}
 *.
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TError - The type of errors your `queryFn` may throw.
 */
export type DefinedUseInfiniteQueryResult<
  TData = unknown,
  TError = DefaultError,
> = DefinedInfiniteQueryObserverResult<TData, TError>

/**
 * The result of `useQuery(suspenseInfiniteQueryOptions(...))`, including defined placeholder data when configured.
 * @template TData - The type `data` ends up as after `select` runs.
 * @template TError - The type of errors your `queryFn` may throw.
 */
export type UseSuspenseInfiniteQueryResult<
  TData = unknown,
  TError = DefaultError,
> =
  | DefinedInfiniteQueryObserverResult<TData, TError>
  | InfiniteQueryObserverPlaceholderResult<TData, TError>

/**
 * {@link UseMutationOptions} with all type parameters set to `any`, useful when the specific types aren't
 * relevant, e.g. when accepting options for any mutation in a helper function.
 */
export type AnyUseMutationOptions = UseMutationOptions<any, any, any, any>
/**
 * The options accepted by `useMutation`. Same as {@link MutationObserverOptions},
 * minus the internal `_defaulted` flag.
 * @template TData - The type your mutation function resolves to.
 * @template TError - The type of errors your mutation function may throw.
 * @template TVariables - The type of the variable passed to `mutate`/`mutateAsync`.
 * @template TOnMutateResult - The type returned by `onMutate`, passed to `onSuccess`/`onError`/`onSettled` as
 * their `onMutateResult` parameter — useful for optimistic-update rollback data.
 */
export interface UseMutationOptions<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> extends OmitKeyof<
  MutationObserverOptions<TData, TError, TVariables, TOnMutateResult>,
  '_defaulted'
> {}

/**
 * The type of `mutate`, as returned by `useMutation`. Forwards the variables (and an optional per-call
 * `onSuccess`/`onError`/`onSettled`) to the underlying `mutate` call. Fire-and-forget — errors are surfaced
 * through the mutation result instead of being thrown by `mutate`, unless `throwOnError` makes `useMutation`
 * rethrow them.
 * @template TData - The type your mutation function resolves to.
 * @template TError - The type of errors your mutation function may throw.
 * @template TVariables - The type of the variable passed to `mutate`.
 * @template TOnMutateResult - The type returned by `onMutate`, passed to `onSuccess`/`onError`/`onSettled` as
 * their `onMutateResult` parameter — useful for optimistic-update rollback data.
 */
export type UseMutateFunction<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = (
  ...args: Parameters<
    MutateFunction<TData, TError, TVariables, TOnMutateResult>
  >
) => void

/**
 * The type of `mutateAsync`, as returned by `useMutation`. Similar to {@link UseMutateFunction}, but returns a
 * promise which can be awaited.
 * @template TData - The type your mutation function resolves to.
 * @template TError - The type of errors your mutation function may throw.
 * @template TVariables - The type of the variable passed to `mutateAsync`.
 * @template TOnMutateResult - The type returned by `onMutate`, passed to `onSuccess`/`onError`/`onSettled` as
 * their `onMutateResult` parameter — useful for optimistic-update rollback data.
 */
export type UseMutateAsyncFunction<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> = MutateFunction<TData, TError, TVariables, TOnMutateResult>

/**
 * The result of `useMutation`. Same as {@link MutationObserverResult}, with
 * `mutate` narrowed to the fire-and-forget {@link UseMutateFunction} signature, plus the added `mutateAsync`.
 * @template TData - The type your mutation function resolves to.
 * @template TError - The type of errors your mutation function may throw.
 * @template TVariables - The type of the variable passed to `mutate`/`mutateAsync`.
 * @template TOnMutateResult - The type returned by `onMutate`, passed to `onSuccess`/`onError`/`onSettled` as
 * their `onMutateResult` parameter — useful for optimistic-update rollback data.
 */
export type UseBaseMutationResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TOnMutateResult = unknown,
> = Override<
  MutationObserverResult<TData, TError, TVariables, TOnMutateResult>,
  { mutate: UseMutateFunction<TData, TError, TVariables, TOnMutateResult> }
> & {
  /**
   * Similar to `mutate`, but returns a promise which can be awaited.
   */
  mutateAsync: UseMutateAsyncFunction<
    TData,
    TError,
    TVariables,
    TOnMutateResult
  >
}

/**
 * The result of `useMutation`. Same as {@link UseBaseMutationResult}.
 * @template TData - The type your mutation function resolves to.
 * @template TError - The type of errors your mutation function may throw.
 * @template TVariables - The type of the variable passed to `mutate`/`mutateAsync`.
 * @template TOnMutateResult - The type returned by `onMutate`, passed to `onSuccess`/`onError`/`onSettled` as
 * their `onMutateResult` parameter — useful for optimistic-update rollback data.
 */
export type UseMutationResult<
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TOnMutateResult = unknown,
> = UseBaseMutationResult<TData, TError, TVariables, TOnMutateResult>

/** Recovers the error type retained in a prepared query key when an error handler is absent. */
export type TaggedQueryError<T, TFallback> = T extends {
  queryKey: infer K extends QueryKey
}
  ? InferErrorFromTag<TFallback, K>
  : TFallback
